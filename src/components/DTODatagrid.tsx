import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, ShieldCheck } from "lucide-react";
import { useCosmosData } from "@/hooks/useCosmosData";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DTORecord {
  id: string;
  fileName: string;
  fileType: string;
  dtoResult: "Success" | "Fail";
  date: string;
}

function parseCosmosData(cosmosData: Array<Record<string, any>>): DTORecord[] {
  return cosmosData
    .map((entry: any) => {
      const key = Object.keys(entry)[0];
      const data = entry[key];
      let date = "";
      if (data.ingested_at) {
        const d = new Date(data.ingested_at);
        date = d.toLocaleString();
      }
      return {
        id: data.id,
        fileName: data.file_name,
        fileType: data.chunks?.[0]?.type || "unknown",
        dtoResult: (data.llm_description ? "Success" : "Fail") as "Success" | "Fail",
        date,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

interface DTODatagridProps {
  isLoading?: boolean;
  cosmosData?: Array<Record<string, any>>;
}

export const DTODatagrid: React.FC<DTODatagridProps> = ({ isLoading, cosmosData: propCosmosData }) => {
  const { data: hookCosmosData, loading } = useCosmosData();
  // Use prop data if provided, otherwise use hook data
  const cosmosData = propCosmosData ?? hookCosmosData;
  const rows = parseCosmosData(cosmosData);
  const isDataLoading = isLoading || loading;
  const navigate = useNavigate();
  const successCount = rows.filter((r) => r.dtoResult === "Success").length;

  return (
    <Card className="card-medium p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm text-text-muted">Cosmos-backed history</p>
          <h3 className="text-xl font-semibold">DTO Inventory</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Database className="w-4 h-4" />
            {rows.length} records
          </Badge>
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="w-4 h-4 text-success" />
            {successCount} ready
          </Badge>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">File Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Ingested</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isDataLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                  Loading DTOs...
                </td>
              </tr>
            ) : (
              <>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-subtle/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground truncate">{row.fileName}</td>
                    <td className="px-4 py-3 uppercase text-xs text-text-muted">{row.fileType}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={row.dtoResult === "Success" ? "default" : "destructive"}
                        className={cn(row.dtoResult === "Success" && "bg-success text-success-foreground")}
                      >
                        {row.dtoResult === "Success" ? "Ready" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{row.date || "—"}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" onClick={() => navigate(`/dto/${row.id}`)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                      No DTOs available yet. Upload a document to populate the feed.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
