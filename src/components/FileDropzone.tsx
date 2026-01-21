import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export const FileDropzone = ({
  onFileSelect,
  accept = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/msword": [".doc"]
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  className
}: FileDropzoneProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled
  });

  const hasErrors = fileRejections.length > 0;

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-smooth",
          "hover:border-brand hover:bg-brand-muted/10",
          isDragActive && !isDragReject && "border-brand bg-brand-muted/20",
          isDragReject && "border-error bg-error-muted/20",
          disabled && "cursor-not-allowed opacity-50",
          hasErrors && "border-error"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isDragReject ? (
            <AlertCircle className="w-12 h-12 text-error" />
          ) : (
            <div className={cn(
              "p-3 rounded-full transition-smooth",
              isDragActive ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Upload className="w-8 h-8" />
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              {isDragActive
                ? isDragReject
                  ? "File type not supported"
                  : "Drop your file here"
                : "Upload Document"
              }
            </h3>
            <p className="text-sm text-text-muted mb-2">
              Drag and drop your PDF or DOCX file here, or click to browse
            </p>
            <p className="text-xs text-text-muted">
              Supported formats: PDF, DOC, DOCX • Max size: {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <FileText className="w-4 h-4" />
            <span>Documents will be analyzed for communication patterns</span>
          </div>
        </div>
      </div>

      {hasErrors && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fileRejections[0]?.errors[0]?.message || "File upload failed"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};