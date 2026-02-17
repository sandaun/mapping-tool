import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { UPLOAD_CONFIG } from "@/lib/ai/config";

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

    const extension = file.name.slice(
      ((file.name.lastIndexOf(".") - 1) >>> 0) + 2,
    );
    const isAllowed = UPLOAD_CONFIG.allowedExtensions.includes(
      `.${extension.toLowerCase()}` as (typeof UPLOAD_CONFIG.allowedExtensions)[number],
    );

    if (!isAllowed) {
      return `Unsupported file type. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(", ")}`;
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
    [onFileSelect],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragOver(false);
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <input
          type="file"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={UPLOAD_CONFIG.allowedExtensions.join(",")}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drag & drop your device manual here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse files
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            PDF, Excel, CSV, Word, Images (Max {UPLOAD_CONFIG.maxFileSizeMB}MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-md border border-destructive/30 bg-destructive/10 flex items-center gap-2 text-sm text-destructive">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
