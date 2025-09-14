import { useState, useRef, useCallback, useEffect } from 'react';

interface PhotoCaptureProps {
  onPhotoCaptured: (photoBlob: Blob, photoType: 'before' | 'after') => void;
  photoType: 'before' | 'after';
  disabled?: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoCaptured, photoType, disabled }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          facingMode: { ideal: 'environment' } // Prefer rear camera on mobile
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onPhotoCaptured(blob, photoType);
        setIsCaptured(true);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [onPhotoCaptured, photoType, stopCamera]);

  const retakePhoto = useCallback(() => {
    setIsCaptured(false);
    startCamera();
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const photoTypeDisplay = photoType === 'before' ? 'Before Cleaning' : 'After Cleaning';
  const photoIcon = photoType === 'before' ? '😔' : '✨';

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 sm:p-6">
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3">
          {photoIcon} Capture {photoTypeDisplay} Photo
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {!isStreaming && !isCaptured && (
          <div className="space-y-6">
            <div className="text-gray-600 text-base mb-4 px-2">
              Take a photo to show the {photoType === 'before' ? 'current state of the windows' : 'sparkling clean results'}
            </div>
            <button
              onClick={startCamera}
              disabled={disabled}
              className={`min-h-[56px] px-8 py-4 rounded-xl font-semibold text-lg transition-colors w-full sm:w-auto ${
                disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              } flex items-center justify-center`}
            >
              📸 Start Camera
            </button>
          </div>
        )}

        {isStreaming && (
          <div className="space-y-6">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-sm mx-auto rounded-xl shadow-xl border-4 border-gray-200"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect like a selfie camera
              />
              
              {/* Camera overlay guide - Mobile Optimized */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/70 rounded-lg flex items-center justify-center" style={{width: '85%', height: '70%'}}>
                  <span className="text-white text-sm bg-black/60 px-3 py-2 rounded-lg font-medium">
                    Position windows in frame
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={capturePhoto}
                className="min-h-[56px] px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center"
              >
                📷 Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="min-h-[56px] px-8 py-4 bg-gray-600 text-white rounded-xl font-semibold text-lg hover:bg-gray-700 active:bg-gray-800 transition-colors flex items-center justify-center"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {isCaptured && (
          <div className="space-y-6">
            <div className="text-green-600 font-semibold text-lg">
              ✅ {photoTypeDisplay} photo captured successfully!
            </div>
            <button
              onClick={retakePhoto}
              className="min-h-[56px] px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors w-full sm:w-auto flex items-center justify-center"
            >
              🔄 Retake Photo
            </button>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default PhotoCapture;