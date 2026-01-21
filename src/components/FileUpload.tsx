import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileDropzone } from "./FileDropzone";
import { Trash2, Upload, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AzureService from "@/services/azureService";

interface FileUploadProps {
  onClear: () => void;
  disabled?: boolean;
  onUploadStart?: () => void;
  onUploadSuccess?: (fileName: string) => void;
}

export const FileUpload = ({ 
  onClear, 
  disabled = false,
  onUploadStart,
  onUploadSuccess
}: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadComplete(false);
    
    // Notify pipeline that upload is starting
    onUploadStart?.();
    
    try {
      setIsUploading(true);
    
      toast({
        title: "Uploading file...",
        description: "Transferring file to Azure storage"
      });
      
      await AzureService.uploadFile(file);
      setUploadComplete(true);
      
      // Notify pipeline that upload was successful
      onUploadSuccess?.(file.name);
      
      toast({
        title: "Upload successful!",
        description: `${file.name} uploaded. DTO extraction and analysis will be available in the datagrid shortly.`
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadComplete(false);
    onClear();
  };


  return (
    <Card className="card-medium p-6 h-full flex flex-col">
      <div className="space-y-6 flex-1">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-brand" />
          <h3 className="text-lg font-semibold text-card-foreground">Upload Engineering Document</h3>
        </div>
        
        {!selectedFile ? (
          <FileDropzone
            onFileSelect={handleFileSelect}
            disabled={disabled || isUploading}
          />
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-smooth",
              uploadComplete ? "border-success bg-success-muted/10" : "border-border"
            )}>
              <div className={cn(
                "p-2 rounded-lg",
                uploadComplete ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
              )}>
                {uploadComplete ? <CheckCircle className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-card-foreground truncate">{selectedFile.name}</p>
                <p className="text-sm text-text-muted">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {isUploading && (
                <div className="animate-spin w-5 h-5 border-2 border-brand border-t-transparent rounded-full" />
              )}
            </div>

            {/* No extracted text preview, results will appear in datagrid */}

            {/* Only show clear button */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={handleClear}
                variant="outline"
                disabled={disabled || isUploading}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};