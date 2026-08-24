import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScanFace, Camera, UserCheck, AlertCircle, Play, StopCircle, RefreshCw } from 'lucide-react';
import { PageHeader, StatusBadge } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function LiveAttendance() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = location.state?.sessionId;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCamera, setActiveCamera] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [roster, setRoster] = useState([]); // All students in the class
  const [manualStatusLoading, setManualStatusLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionIntervalRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      toast.error('No active session provided');
      navigate('/faculty/dashboard');
      return;
    }
    fetchSessionDetails();
    return () => {
      stopCamera();
    };
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      // Get session
      const sessionsRes = await api.get(`/attendance/sessions?status=ACTIVE`);
      const currentSession = sessionsRes.data.find(s => s._id === sessionId);
      if (!currentSession) {
        toast.error('Active session not found or already completed');
        navigate('/faculty/dashboard');
        return;
      }
      setSession(currentSession);

      // Get all attendance records for this session
      const attendanceRes = await api.get(`/attendance?sessionId=${sessionId}`);
      setRecognizedStudents(attendanceRes.data.records || []);

      // Get class roster
      const classId = currentSession.classId?._id || currentSession.classId;
      const classRes = await api.get(`/classes/${classId}`);
      const studentsRes = await api.get(`/students?department=${classRes.data.departmentId?._id}&year=${classRes.data.year}&section=${classRes.data.section}`);
      setRoster(studentsRes.data.students || []);

    } catch (e) {
      console.error(e);
      toast.error('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActiveCamera(true);
      // Start recognition loop every 3 seconds
      recognitionIntervalRef.current = setInterval(processFrame, 3000);
      toast.success('Live face scan camera active');
    } catch (e) {
      toast.error('Unable to access webcam');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }
    setActiveCamera(false);
  };

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await api.post('/attendance/recognize', {
        sessionId,
        image: base64Image
      });

      if (res.data.recognized) {
        if (res.data.duplicate) {
          // Already marked
        } else {
          toast.success(`Marked Present: ${res.data.student.name} (${res.data.confidence}%)`, { icon: '🤖' });
          // Reload attendance list
          fetchSessionDetails();
        }
      }
    } catch (e) {
      console.error('Frame processing failed:', e.message);
    }
  }, [sessionId]);

  const handleEndSession = async () => {
    stopCamera();
    try {
      await api.post(`/attendance/session/${sessionId}/end`);
      toast.success('Session completed. Absent students auto-registered.');
      navigate('/faculty/dashboard');
    } catch (e) {
      toast.error('Failed to end session');
    }
  };

  const handleManualMark = async (studentId, status) => {
    try {
      await api.post('/attendance/mark', {
        studentId,
        sessionId,
        status
      });
      toast.success(`Attendance updated manually`);
      fetchSessionDetails();
    } catch (e) {
      toast.error('Manual mark failed');
    }
  };

  if (loading) return <div className="page-container"><p className="text-surface-500">Loading live attendance session...</p></div>;

  const presentCount = recognizedStudents.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const totalStudents = roster.length;
  const absentCount = totalStudents - presentCount;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Live Face Recognition Attendance"
        subtitle={`Session active for ${session?.subjectId?.subjectName || 'Course'} (${session?.subjectId?.subjectCode})`}
        actions={
          <button onClick={handleEndSession} className="btn-danger flex items-center gap-2">
            <StopCircle className="w-4 h-4" /> End Attendance Session
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Feed card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header flex justify-between items-center bg-surface-900 text-white">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${activeCamera ? 'bg-red-500 animate-pulse' : 'bg-surface-500'}`} />
                <span className="font-semibold text-sm">Webcam Stream: {activeCamera ? 'ON' : 'OFF'}</span>
              </div>
              {!activeCamera ? (
                <button onClick={startCamera} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
                  <Play className="w-3.5 h-3.5" /> Activate Scanner
                </button>
              ) : (
                <button onClick={stopCamera} className="btn-secondary py-1 px-3 text-xs bg-surface-700 hover:bg-surface-650 text-white border-0">
                  Pause Scanner
                </button>
              )}
            </div>
            <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {activeCamera && <div className="camera-overlay camera-scanning" />}
              {!activeCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="w-12 h-12 text-surface-600" />
                  <p className="text-surface-500 text-sm">Activate the scanner to begin live identification</p>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card text-center">
              <p className="text-2xl font-bold text-surface-900">{totalStudents}</p>
              <p className="text-xs text-surface-400">Class Roster</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-xs text-surface-400">Present (Detected)</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl font-bold text-red-650">{absentCount}</p>
              <p className="text-xs text-surface-400">Absent (Remaining)</p>
            </div>
          </div>
        </div>

        {/* Live Attendance List */}
        <div className="card flex flex-col max-h-[600px]">
          <div className="card-header flex justify-between items-center">
            <h3 className="font-semibold text-surface-900">Attendance Log</h3>
            <button onClick={fetchSessionDetails} className="p-1 rounded hover:bg-surface-100">
              <RefreshCw className="w-4 h-4 text-surface-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {roster.map(student => {
              const record = recognizedStudents.find(r => r.studentId?._id === student._id);
              return (
                <div key={student._id} className="flex justify-between items-center p-3 bg-surface-50 rounded-xl border border-surface-100">
                  <div>
                    <p className="font-semibold text-sm text-surface-900">{student.fullName}</p>
                    <p className="text-xs text-surface-400 font-mono">{student.studentId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {record ? (
                      <>
                        <StatusBadge status={record.status} />
                        {record.recognitionConfidence > 0 && (
                          <span className="text-xs font-semibold text-surface-400">{record.recognitionConfidence}%</span>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleManualMark(student._id, 'PRESENT')}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleManualMark(student._id, 'ABSENT')}
                          className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold"
                        >
                          Absent
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
