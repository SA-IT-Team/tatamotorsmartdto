export interface CosmosItem {
  source_blob: string;
  ingested_at: string;
  file_name: string;
  chunks: Array<{
    path: string;
    type: string;
    page: number;
    note: string;
  }>;
  ocr_samples?: string;
  ocr_raw?: Array<{
    text: string;
    source: string;
    chunk_type: string;
    key_values?: any[];
  }>;
  llm_description?: string;
  llm_motivation?: string;
  llm_raw?: string;
  parameters?: Record<string, any>;
  id: string;
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}

const COSMOS_API_ENDPOINT = import.meta.env.VITE_COSMOS_API_ENDPOINT;

export async function fetchCosmosItems(): Promise<CosmosItem[]> {
  if (!COSMOS_API_ENDPOINT) {
    throw new Error("VITE_COSMOS_API_ENDPOINT is not configured");
  }

  try {
    const response = await fetch(COSMOS_API_ENDPOINT);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Cosmos items: ${response.status} ${response.statusText}`);
    }
    
    const data: CosmosItem[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Cosmos items:", error);
    throw error;
  }
}

/**
 * Transforms the API response array into the format expected by the app:
 * Array of objects where each object has the id as the key
 */
export function formatCosmosData(items: CosmosItem[]): Array<Record<string, CosmosItem>> {
  return items.map((item) => ({
    [item.id]: item,
  }));
}

