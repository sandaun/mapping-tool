import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { UPLOAD_CONFIG } from '@/lib/ai/config';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUploader({ onFileSelect, disabled }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return `File too large. Max size is ${UPLOAD_CONFIG.maxFileSizeMB}MB.`;
    }

    const extension = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2);
    const isAllowed = UPLOAD_CONFIG.allowedExtensions.includes(`.${extension.toLowerCase()}` as typeof UPLOAD_CONFIG.allowedExtensions[number]);

    if (!isAllowed) {
      return `Unsupported file type. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}`;
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={UPLOAD_CONFIG.allowedExtensions.join(',')}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Drag & drop your device manual here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse files
            </p>
          </div>
          <p className="text-xs text-gray-400">
            PDF, Excel, CSV, Word, Images (Max {UPLOAD_CONFIG.maxFileSizeMB}MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
