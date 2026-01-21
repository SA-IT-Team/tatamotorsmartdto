export class AzureService {
  
  // Azure Blob Storage configuration
  private static readonly BLOB_STORAGE_ACCOUNT = import.meta.env.VITE_AZURE_BLOB_STORAGE_ACCOUNT;
  private static readonly BLOB_CONTAINER = import.meta.env.VITE_AZURE_BLOB_CONTAINER;
  private static readonly BLOB_SAS_TOKEN = import.meta.env.VITE_AZURE_BLOB_SAS_TOKEN;

  /**
   * Constructs the Azure Blob Storage upload URL from environment variables and fileName
   * @param fileName - The name of the file to upload
   * @returns The complete SAS URL for uploading the file
   * @throws Error if required environment variables are missing
   */
  private static constructUploadUrl(fileName: string): string {
    if (!this.BLOB_STORAGE_ACCOUNT) {
      throw new Error("VITE_AZURE_BLOB_STORAGE_ACCOUNT is not configured");
    }
    if (!this.BLOB_CONTAINER) {
      throw new Error("VITE_AZURE_BLOB_CONTAINER is not configured");
    }
    if (!this.BLOB_SAS_TOKEN) {
      throw new Error("VITE_AZURE_BLOB_SAS_TOKEN is not configured");
    }

    const baseUrl = `https://${this.BLOB_STORAGE_ACCOUNT}.blob.core.windows.net/${this.BLOB_CONTAINER}`;
    const encodedFileName = encodeURIComponent(fileName);
    const sasToken = this.BLOB_SAS_TOKEN.startsWith('?') 
      ? this.BLOB_SAS_TOKEN 
      : `?${this.BLOB_SAS_TOKEN}`;
    
    return `${baseUrl}/${encodedFileName}${sasToken}`;
  }

  /**
   * Uploads a file to Azure Blob Storage using SAS URL
   * @param file - The file to upload
   * @returns Promise that resolves when upload is complete
   * @throws Error if upload fails or configuration is missing
   */
  static async uploadFile(file: File): Promise<void> {
    const uploadUrl = this.constructUploadUrl(file.name);
    
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type || "application/octet-stream"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("is not configured")) {
        throw error;
      }
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

export default AzureService;