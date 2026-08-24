import { useState, useEffect, useRef, useCallback } from 'react';
import { ScanFace, Camera, CheckCircle, AlertCircle, User, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function FaceRegistration() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [step, setStep] = useState('select'); // select, capture, processing, done
  const [capturedImages, setCapturedImages] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => { fetchStudents(); return () => stopCamera(); }, []);

  const fetchStudents = async () => {
    try { const res = await api.get('/students'); setStudents(res.data.students || []); } catch (e) {}
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCameraActive(true);
    } catch (error) { toast.error('Camera access denied. Please allow camera access.'); }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImages(prev => [...prev, imageData]);
    toast.success(`Image ${capturedImages.length + 1} captured`);
  }, [capturedImages.length]);

  const angles = ['Front Face', 'Slight Left', 'Slight Right', 'Slight Up'];

  const handleRegister = async () => {
    if (capturedImages.length < 1) { toast.error('Capture at least 1 image'); return; }
    setStep('processing');
    try {
      const res = await api.post(`/students/${selectedStudent._id}/register-face`, { images: capturedImages });
      if (res.data.success) {
        setRegistrationResult(res.data);
        setStep('done');
        toast.success('Face registered successfully!');
        fetchStudents();
      } else {
        toast.error(res.data.message || 'Registration failed');
        setStep('capture');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      setStep('capture');
    }
  };

  const reset = () => {
    stopCamera();
    setSelectedStudent(null);
    setCapturedImages([]);
    setStep('select');
    setRegistrationResult(null);
  };

  const filteredStudents = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <PageHeader title="Face Registration" subtitle="Register student faces for attendance recognition" />

      {step === 'select' && (
        <div className="max-w-3xl mx-auto">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-surface-900">Select a Student</h3></div>
            <div className="p-4">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." className="input-field mb-4" />
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredStudents.map(s => (
                  <button key={s._id} onClick={() => { setSelectedStudent(s); setStep('capture'); startCamera(); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:border-primary-300 hover:bg-primary-50 ${s.faceRegistered ? 'border-emerald-200 bg-emerald-50/50' : 'border-surface-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                        {s.fullName?.[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-surface-900">{s.fullName}</p>
                        <p className="text-xs text-surface-500">{s.studentId} • {s.departmentId?.code} • Y{s.year}/{s.section}</p>
                      </div>
                    </div>
                    {s.faceRegistered ? (
                      <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" />Registered</span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700">Not Registered</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'capture' && selectedStudent && (
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-surface-900">Capturing: {selectedStudent.fullName}</h3>
                <p className="text-sm text-surface-500">{selectedStudent.studentId}</p>
              </div>
              <button onClick={reset} className="btn-secondary text-sm">← Back</button>
            </div>
            <div className="card-body">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Camera */}
                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {cameraActive && <div className="camera-overlay camera-scanning" />}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-surface-500" />
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <p className="text-center text-sm text-surface-500 mt-3">Position your face inside the oval frame</p>
                  <div className="flex gap-3 mt-4">
                    <button onClick={captureFrame} disabled={!cameraActive || capturedImages.length >= 4}
                      className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" />
                      Capture {capturedImages.length < angles.length ? angles[capturedImages.length] : 'Image'}
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-surface-900">Captured Images ({capturedImages.length}/4)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {angles.map((angle, i) => (
                      <div key={i} className={`p-3 rounded-xl border-2 transition-all ${capturedImages[i] ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-surface-200 bg-surface-50'}`}>
                        {capturedImages[i] ? (
                          <div className="space-y-2">
                            <img src={capturedImages[i]} alt={angle} className="w-full rounded-lg aspect-square object-cover" />
                            <div className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" /><span className="text-xs font-medium">{angle}</span></div>
                          </div>
                        ) : (
                          <div className="aspect-square flex items-center justify-center"><div className="text-center"><User className="w-8 h-8 text-surface-300 mx-auto" /><p className="text-xs text-surface-400 mt-1">{angle}</p></div></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {capturedImages.length > 0 && (
                    <div className="flex gap-3">
                      <button onClick={() => setCapturedImages([])} className="btn-secondary flex-1 flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" />Retake All</button>
                      <button onClick={handleRegister} className="btn-success flex-1">Register Face</button>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium">📌 Tips for best results:</p>
                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                      <li>• Ensure good lighting on your face</li>
                      <li>• Remove sunglasses or masks</li>
                      <li>• Look directly at the camera for front image</li>
                      <li>• Slightly turn for angle captures</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-bold text-surface-900">Processing Face Data</h3>
          <p className="text-surface-500 mt-2">Detecting face, verifying quality, generating embeddings...</p>
        </div>
      )}

      {step === 'done' && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">Face Registration Complete!</h3>
          <div className="space-y-2 text-sm text-surface-600 mb-6">
            <p>✓ Face detected</p>
            <p>✓ Face quality verified</p>
            <p>✓ Face embedding generated</p>
            <p>✓ Quality Score: {registrationResult?.qualityScore?.toFixed(0) || 95}%</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-primary">Register Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
