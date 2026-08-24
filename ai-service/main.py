from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import base64
import io
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FRS Face Recognition Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to import face_recognition, fall back to simulation mode
SIMULATION_MODE = False
try:
    import face_recognition
    import cv2
    logger.info("✅ Face recognition libraries loaded successfully")
except ImportError:
    SIMULATION_MODE = True
    logger.warning("⚠️ face_recognition not available. Running in SIMULATION mode.")
    logger.warning("   Install with: pip install face_recognition opencv-python")


class RegisterRequest(BaseModel):
    student_id: str
    images: List[str]  # base64 encoded images


class RegisteredFace(BaseModel):
    student_id: str
    mongo_id: str
    name: str
    embedding: List[float]


class RecognizeRequest(BaseModel):
    image: str  # base64 encoded image
    registered_faces: List[RegisteredFace]


class VerifyRequest(BaseModel):
    image: str
    embedding: List[float]


def decode_base64_image(base64_string: str):
    """Decode base64 image to numpy array."""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        
        if not SIMULATION_MODE:
            import cv2
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError("Failed to decode image")
            # Convert BGR to RGB for face_recognition
            return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            return np.zeros((480, 640, 3), dtype=np.uint8)  # Dummy image
    except Exception as e:
        logger.error(f"Image decode error: {e}")
        raise ValueError(f"Failed to decode image: {str(e)}")


@app.get("/api/health")
async def health_check():
    return {
        "status": "OK",
        "simulation_mode": SIMULATION_MODE,
        "message": "Face recognition service is running" + 
                   (" (simulation mode)" if SIMULATION_MODE else "")
    }


@app.post("/api/face/register")
async def register_face(request: RegisterRequest):
    """Register a student's face. Returns face embedding."""
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="No images provided")

        if SIMULATION_MODE:
            # Generate a consistent pseudo-random embedding based on student_id
            np.random.seed(hash(request.student_id) % 2**32)
            embedding = np.random.randn(128).tolist()
            return {
                "success": True,
                "student_id": request.student_id,
                "embedding": embedding,
                "quality_score": 95.0,
                "message": "Face registered successfully (simulation mode)",
                "faces_detected": len(request.images)
            }

        # Real face recognition
        embeddings = []
        for i, img_b64 in enumerate(request.images):
            try:
                image = decode_base64_image(img_b64)
                face_locations = face_recognition.face_locations(image, model="hog")
                
                if len(face_locations) == 0:
                    logger.warning(f"No face detected in image {i+1}")
                    continue
                
                if len(face_locations) > 1:
                    logger.warning(f"Multiple faces detected in image {i+1}, using the largest")
                    # Use the largest face
                    face_locations = [max(face_locations, key=lambda x: (x[2]-x[0]) * (x[1]-x[3]))]
                
                face_encoding = face_recognition.face_encodings(image, face_locations)
                if face_encoding:
                    embeddings.append(face_encoding[0])
            except Exception as e:
                logger.error(f"Error processing image {i+1}: {e}")
                continue

        if not embeddings:
            raise HTTPException(status_code=400, detail="No valid faces detected in any image")

        # Average the embeddings for a more robust representation
        avg_embedding = np.mean(embeddings, axis=0).tolist()

        return {
            "success": True,
            "student_id": request.student_id,
            "embedding": avg_embedding,
            "quality_score": min(100, len(embeddings) * 25.0),
            "message": f"Face registered successfully from {len(embeddings)} images",
            "faces_detected": len(embeddings)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/face/recognize")
async def recognize_face(request: RecognizeRequest):
    """Recognize a face from a camera frame against registered faces."""
    try:
        if not request.registered_faces:
            return {"recognized": False, "message": "No registered faces to compare against"}

        if SIMULATION_MODE:
            # Simulation: randomly pick a registered face with high confidence
            if request.registered_faces:
                # Use image data hash to deterministically pick a face
                img_hash = hash(request.image[:100]) % len(request.registered_faces)
                matched = request.registered_faces[img_hash]
                confidence = 85.0 + (hash(request.image[:50]) % 15)
                return {
                    "recognized": True,
                    "student_id": matched.student_id,
                    "mongo_id": matched.mongo_id,
                    "name": matched.name,
                    "confidence": confidence,
                    "message": f"Recognized {matched.name} (simulation mode)"
                }
            return {"recognized": False, "confidence": 0, "message": "No match found (simulation)"}

        # Real recognition
        image = decode_base64_image(request.image)
        face_locations = face_recognition.face_locations(image, model="hog")

        if not face_locations:
            return {"recognized": False, "confidence": 0, "message": "No face detected in frame"}

        # Use the largest face
        if len(face_locations) > 1:
            face_locations = [max(face_locations, key=lambda x: (x[2]-x[0]) * (x[1]-x[3]))]

        face_encoding = face_recognition.face_encodings(image, face_locations)
        if not face_encoding:
            return {"recognized": False, "confidence": 0, "message": "Could not encode face"}

        input_embedding = face_encoding[0]

        # Compare with all registered faces
        best_match = None
        best_distance = float('inf')

        for reg_face in request.registered_faces:
            if not reg_face.embedding:
                continue
            known_embedding = np.array(reg_face.embedding)
            distance = np.linalg.norm(input_embedding - known_embedding)
            
            if distance < best_distance:
                best_distance = distance
                best_match = reg_face

        # Convert distance to confidence (lower distance = higher confidence)
        # Typical threshold is 0.6 for face_recognition library
        if best_match and best_distance < 0.6:
            confidence = max(0, min(100, (1 - best_distance / 0.6) * 100))
            return {
                "recognized": True,
                "student_id": best_match.student_id,
                "mongo_id": best_match.mongo_id,
                "name": best_match.name,
                "confidence": round(confidence, 1),
                "distance": round(best_distance, 4),
                "message": f"Recognized {best_match.name}"
            }

        return {
            "recognized": False,
            "confidence": 0,
            "distance": round(best_distance, 4) if best_distance < float('inf') else None,
            "message": "Face not recognized or confidence too low"
        }

    except Exception as e:
        logger.error(f"Recognition error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/face/verify")
async def verify_face(request: VerifyRequest):
    """Verify a face against a known embedding."""
    try:
        if SIMULATION_MODE:
            return {"verified": True, "confidence": 92.0, "message": "Verified (simulation mode)"}

        image = decode_base64_image(request.image)
        face_locations = face_recognition.face_locations(image, model="hog")

        if not face_locations:
            return {"verified": False, "confidence": 0, "message": "No face detected"}

        face_encoding = face_recognition.face_encodings(image, face_locations[:1])
        if not face_encoding:
            return {"verified": False, "confidence": 0, "message": "Could not encode face"}

        known_embedding = np.array(request.embedding)
        distance = np.linalg.norm(face_encoding[0] - known_embedding)
        confidence = max(0, min(100, (1 - distance / 0.6) * 100))

        return {
            "verified": distance < 0.6,
            "confidence": round(confidence, 1),
            "distance": round(distance, 4),
            "message": "Face verified" if distance < 0.6 else "Face verification failed"
        }

    except Exception as e:
        logger.error(f"Verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
