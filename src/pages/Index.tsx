import { useMemo, useState, useEffect, useRef, type ComponentType } from "react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { DTODatagrid } from "@/components/DTODatagrid";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock3, Database, ShieldCheck, Sparkles, Zap, Lock, Brain } from "lucide-react";
import { useCosmosData } from "@/hooks/useCosmosData";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchCosmosItems } from "@/services/cosmosService";

type ParsedRow = {
  id: string;
  fileName: string;
  fileType: string;
  dtoResult: "Success" | "Fail";
  ingestedAt?: string;
};

const mapCosmosRows = (cosmosData: Array<Record<string, any>>): ParsedRow[] => {
  return cosmosData
    .map((entry: any) => {
      const key = Object.keys(entry)[0];
      const data = entry[key];
      return {
        id: data.id,
        fileName: data.file_name,
        fileType: data.chunks?.[0]?.type || "unknown",
        dtoResult: data.llm_description ? "Success" as const : "Fail" as const,
        ingestedAt: data.ingested_at,
      };
    })
    .sort((a, b) => {
      const aDate = a.ingestedAt ? new Date(a.ingestedAt).getTime() : 0;
      const bDate = b.ingestedAt ? new Date(b.ingestedAt).getTime() : 0;
      return bDate - aDate;
    });
};

const StatCard = ({
  label,
  value,
  helper,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  helper?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "brand" | "success" | "warning";
}) => {
  const toneClasses =
    tone === "success"
      ? "text-success bg-success/10"
      : tone === "warning"
        ? "text-warning bg-warning/10"
        : "text-brand bg-brand/10";
  return (
    <Card className="card-soft p-5 flex items-center gap-4">
      <div className={cn("p-3 rounded-xl", toneClasses)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-text-muted">{label}</p>
        <p className="text-2xl font-semibold text-card-foreground">{value}</p>
        {helper && <p className="text-xs text-text-muted mt-1">{helper}</p>}
      </div>
    </Card>
  );
};

const PipelineStep = ({
  label,
  detail,
  status,
}: {
  label: string;
  detail: string;
  status: "running" | "idle" | "ready";
}) => {
  const statusTone =
    status === "running"
      ? "bg-warning/15 text-warning border-warning/30"
      : status === "ready"
        ? "bg-success/15 text-success border-success/30"
        : "bg-muted text-text-muted border-border";
  
  const statusIndicator = status === "running" ? (
    <div className="flex items-center gap-2">
      <div className="animate-spin w-2.5 h-2.5 border-2 border-warning border-t-transparent rounded-full" />
      <span className="text-xs uppercase tracking-wide text-warning">Running</span>
    </div>
  ) : status === "ready" ? (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-success" />
      <span className="text-xs uppercase tracking-wide text-success">Ready</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-border" />
      <span className="text-xs uppercase tracking-wide">Idle</span>
    </div>
  );

  return (
    <div className={cn("flex items-center justify-between rounded-2xl border px-4 py-3", statusTone)}>
      <div>
        <p className="text-sm font-semibold text-card-foreground">{label}</p>
        <p className="text-xs text-text-muted">{detail}</p>
      </div>
      {statusIndicator}
    </div>
  );
};

const InstructionsCard = () => (
  <Card className="card-medium p-6 h-full flex flex-col">
    <div className="space-y-4">
      <h4 className="font-semibold text-lg text-card-foreground">How SMART DTO Extraction Works:</h4>
      <div className="grid gap-3 text-sm text-text-muted">
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">1</div>
          <div>Upload your engineering drawing or document (PDF, DOC, DOCX, up to 10MB)</div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</div>
          <div>Azure OCR extracts key fields and DTO data</div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</div>
          <div>AI analyzes the extracted DTO for insights and saves results to CosmosDB</div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">4</div>
          <div>All processed files and DTO results are shown in the datagrid for review</div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">5</div>
          <div>AI Chat Enabled feature for interactive conversations about your DTOs</div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">6</div>
          <div>SMART DTO AI Conversation leverages all extracted context for intelligent insights</div>
        </div>
      </div>
    </div>
  </Card>
);


type PipelineStatus = {
  upload: "idle" | "running" | "ready";
  extraction: "idle" | "running" | "ready";
  persistence: "idle" | "running" | "ready";
};

const Index = () => {
  const { toast } = useToast();
  const { data: cosmosData, loading: cosmosLoading, refetch: refetchCosmosData } = useCosmosData();
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>({
    upload: "idle",
    extraction: "idle",
    persistence: "idle",
  });
  const uploadedFileNameRef = useRef<string | null>(null);
  const pipelineTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const rows = useMemo(() => mapCosmosRows(cosmosData), [cosmosData]);
  const successCount = rows.filter((r) => r.dtoResult === "Success").length;
  const successRate = rows.length ? Math.round((successCount / rows.length) * 100) : 0;
  const latestIngested = rows[0]?.ingestedAt ? new Date(rows[0].ingestedAt).toLocaleString() : "Awaiting first run";

  // Clear all pipeline timeouts
  const clearAllTimeouts = () => {
    pipelineTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    pipelineTimeoutsRef.current = [];
  };

  // Reset pipeline when cleared
  const handleClear = () => {
    setPipelineStatus({
      upload: "idle",
      extraction: "idle",
      persistence: "idle",
    });
    uploadedFileNameRef.current = null;
    clearAllTimeouts();
    toast({
      title: "Cleared",
      description: "Upload cleared",
    });
  };

  // Handle pipeline progression
  const handleUploadSuccess = async (fileName: string) => {
    uploadedFileNameRef.current = fileName;
    
    // Clear any existing timeouts
    clearAllTimeouts();
    
    // Step 1: Upload successful - mark as ready
    setPipelineStatus({
      upload: "ready",
      extraction: "idle",
      persistence: "idle",
    });

    // Step 2: Wait 1-2 seconds, then start extraction
    const timeout1 = setTimeout(() => {
      setPipelineStatus((prev) => ({
        ...prev,
        extraction: "running",
      }));

      // Step 3: Wait another 3-4 seconds, then mark extraction as ready and start persistence check
      const timeout2 = setTimeout(async () => {
        setPipelineStatus((prev) => ({
          ...prev,
          extraction: "ready",
          persistence: "running",
        }));

        // Step 4: Check Cosmos DB for the new item and always refetch to update UI
        try {
          // Always refetch cosmos data first to ensure UI is updated with latest data
          await refetchCosmosData();
          
          const items = await fetchCosmosItems();
          const foundItem = items.find((item) => item.file_name === fileName);
          
          if (foundItem) {
            // Item found in Cosmos DB - mark persistence as ready
            setPipelineStatus((prev) => ({
              ...prev,
              persistence: "ready",
            }));
            
            toast({
              title: "Pipeline complete!",
              description: "File processed and saved to Cosmos DB",
            });
          } else {
            // Item not found yet - keep checking (optional: retry logic)
            setPipelineStatus((prev) => ({
              ...prev,
              persistence: "running",
            }));
            
            // Retry after 2 more seconds
            const retryTimeout = setTimeout(async () => {
              // Refetch cosmos data on retry as well
              await refetchCosmosData();
              
              const retryItems = await fetchCosmosItems();
              const retryFoundItem = retryItems.find((item) => item.file_name === fileName);
              
              if (retryFoundItem) {
                setPipelineStatus((prev) => ({
                  ...prev,
                  persistence: "ready",
                }));
                toast({
                  title: "Pipeline complete!",
                  description: "File processed and saved to Cosmos DB",
                });
              } else {
                setPipelineStatus((prev) => ({
                  ...prev,
                  persistence: "ready", // Mark as ready anyway after retry
                }));
                toast({
                  title: "Processing...",
                  description: "File is being processed. Check back in a moment.",
                });
              }
            }, 2000);
            pipelineTimeoutsRef.current.push(retryTimeout);
          }
        } catch (error) {
          console.error("Error checking Cosmos DB:", error);
          // Always refetch cosmos data even on error to ensure UI is up to date
          await refetchCosmosData();
          setPipelineStatus((prev) => ({
            ...prev,
            persistence: "ready", // Mark as ready even on error
          }));
        }
      }, 10000); // 10 seconds for extraction to complete
      pipelineTimeoutsRef.current.push(timeout2);
    }, 1500); // 1.5 seconds - wait before starting extraction
    pipelineTimeoutsRef.current.push(timeout1);
  };

  const handleUploadStart = () => {
    setPipelineStatus({
      upload: "running",
      extraction: "idle",
      persistence: "idle",
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-subtle">
      <Header />

      <main className="container mx-auto px-6 py-10">
        <section id="overview-section" className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-3xl border border-border/70 bg-surface-subtle/80 backdrop-blur p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-brand/10 pointer-events-none" />
            <div className="grid gap-6 lg:grid-cols-3 relative">
              <div className="lg:col-span-2 space-y-5">
                <Badge variant="outline" className="w-fit gap-2">
                  <Sparkles className="w-4 h-4 text-brand" />
                  Real-time DTO Control Room
                </Badge>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  AI-Powered DTO Extraction with Real-Time Analysis
                </h1>
                <p className="text-lg text-text-muted max-w-3xl leading-relaxed">
                  Upload engineering drawings or docs and watch the pipeline stream through blob storage, DTO extraction, Azure OpenAI
                  AI analysis, and CosmosDB persistence. Engage with your data through AI Chat for interactive conversations
                  and intelligent insights — all from one responsive workspace powered by AI.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary/80 hover:bg-secondary border border-border/50">
                    <Lock className="w-3.5 h-3.5 text-success" />
                    Secure uploads
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary/80 hover:bg-secondary border border-border/50">
                    <Database className="w-3.5 h-3.5 text-brand" />
                    Cosmos-backed history
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary/80 hover:bg-secondary border border-border/50">
                    <Brain className="w-3.5 h-3.5 text-warning" />
                    Azure OpenAI insights
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3">
                <StatCard label="Documents processed" value={`${rows.length || 0}`} helper="Tracked in CosmosDB" icon={Database} />
                <StatCard
                  label="Success rate"
                  value={`${successRate}%`}
                  helper={`${successCount} successful DTOs`}
                  icon={ShieldCheck}
                  tone="success"
                />
                <StatCard label="Last ingestion" value={latestIngested} helper="Live from blob intake" icon={Clock3} tone="warning" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Instructions Card */}
            <InstructionsCard />

            {/* File Upload Card */}
            <div className="h-full">
              <FileUpload 
                onClear={handleClear}
                onUploadStart={handleUploadStart}
                onUploadSuccess={handleUploadSuccess}
              />
            </div>

            {/* Pipeline Health Status Card */}
            <Card className="card-medium p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-muted">Pipeline health</p>
                  <h3 className="text-lg font-semibold">Live status</h3>
                </div>
                <Badge variant="outline" className="gap-2">
                  <Activity className="w-4 h-4 text-success" />
                  Operational
                </Badge>
              </div>
              <div className="space-y-3 flex-1">
                <PipelineStep
                  label="Upload to Azure Blob"
                  detail="Direct SAS upload with validation"
                  status={pipelineStatus.upload}
                />
                <PipelineStep
                  label="DTO extraction + OCR"
                  detail="Files routed to extraction workers"
                  status={pipelineStatus.extraction}
                />
                <PipelineStep
                  label="AI analysis + persistence"
                  detail="Insights streamed to CosmosDB"
                  status={pipelineStatus.persistence}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 mt-4"
                onClick={() =>
                  toast({
                    title: "Triggering analysis",
                    description: "Upload a document to start the live pipeline.",
                  })
                }
              >
                <Zap className="w-4 h-4" />
                Trigger fresh analysis
              </Button>
            </Card>

          </div>

          <div id="dtos-section">
            <DTODatagrid isLoading={cosmosLoading} cosmosData={cosmosData} />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface-subtle/50 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-muted">
            <div>
              <p>&copy; 2024 Tata Smart DTO Analyzer. Built for production workloads.</p>
            </div>
            <div className="flex items-center gap-6">
              <span>Keyboard shortcuts: Ctrl+Enter to analyze • Ctrl+K to clear</span>
              <span>Version 1.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;