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
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {photoIcon} Capture {photoTypeDisplay} Photo
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {!isStreaming && !isCaptured && (
          <div className="space-y-4">
            <div className="text-gray-500 text-sm mb-4">
              Take a photo to show the {photoType === 'before' ? 'current state of the windows' : 'sparkling clean results'}
            </div>
            <button
              onClick={startCamera}
              disabled={disabled}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              📸 Start Camera
            </button>
          </div>
        )}

        {isStreaming && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect like a selfie camera
              />
              
              {/* Camera overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/60 rounded-lg w-80 h-60 flex items-center justify-center">
                  <span className="text-white/80 text-sm bg-black/50 px-2 py-1 rounded">
                    Position windows in frame
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                📷 Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {isCaptured && (
          <div className="space-y-4">
            <div className="text-green-600 font-medium">
              ✅ {photoTypeDisplay} photo captured successfully!
            </div>
            <button
              onClick={retakePhoto}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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