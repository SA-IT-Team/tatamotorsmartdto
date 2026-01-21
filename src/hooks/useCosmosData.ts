import { useState, useEffect, useCallback } from "react";
import { fetchCosmosItems, formatCosmosData, type CosmosItem } from "@/services/cosmosService";

export interface FormattedCosmosData extends Array<Record<string, CosmosItem>> {}

export function useCosmosData() {
  const [data, setData] = useState<FormattedCosmosData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await fetchCosmosItems();
      const formatted = formatCosmosData(items);
      setData(formatted);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch Cosmos data");
      setError(error);
      console.error("Error in useCosmosData:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

