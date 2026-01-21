import React from "react";
import { ChatSection } from "@/components/ChatSection";
import { Header } from "@/components/Header";
import { useParams, useNavigate } from "react-router-dom";
import { useCosmosData } from "@/hooks/useCosmosData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, FileText, LayoutGrid, Sparkles, ArrowLeft, ClipboardList, Zap, Gauge, Target, Percent, Activity, Lightbulb, Rocket } from "lucide-react";

function getDTOData(id: string, cosmosData: Array<Record<string, any>>) {
  for (const entry of cosmosData) {
    const key = Object.keys(entry)[0];
    const data = entry[key];
    if (data.id === id) return data;
  }
  return null;
}

export const DTODetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isOcrDialogOpen, setOcrDialogOpen] = React.useState(false);
  const { data: cosmosData, loading } = useCosmosData();
  const dto = id ? getDTOData(id, cosmosData) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-surface-subtle">
        <Header />
        <main className="container mx-auto px-6 py-10">
          <Card className="p-8 text-center">Loading DTO data...</Card>
        </main>
      </div>
    );
  }

  if (!dto) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-surface-subtle">
        <Header />
        <main className="container mx-auto px-6 py-10">
          <Card className="p-8 text-center">DTO not found.</Card>
        </main>
      </div>
    );
  }

  let ocrFields: string[] = [];
  if (dto.ocr_samples && typeof dto.ocr_samples === "string") {
    ocrFields = dto.ocr_samples
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !/^\d+$/.test(line));
  }
  const previewOcrFields = ocrFields.slice(0, 6);
  const hasMoreOcrFields = ocrFields.length > previewOcrFields.length;

  const labelMap: Record<string, string> = {
    detected_type: "Detected Type",
    detection_confidence: "Detection Confidence",
    rated_current: "Rated Current",
    no_of_poles: "No Of Poles",
  };

  interface ParamField {
    key: string;
    label: string;
    value: string;
    confidence?: number;
  }

  // Function to get icon for parameter type
  const getParamIcon = (key: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      detected_type: Target,
      detection_confidence: Percent,
      rated_current: Zap,
      no_of_poles: Gauge,
      current: Zap,
      poles: Gauge,
      type: Target,
      confidence: Percent,
    };
    
    // Try exact match first
    if (iconMap[key.toLowerCase()]) {
      return iconMap[key.toLowerCase()];
    }
    
    // Try partial match
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('current')) return Zap;
    if (lowerKey.includes('pole') || lowerKey.includes('pole')) return Gauge;
    if (lowerKey.includes('type') || lowerKey.includes('detected')) return Target;
    if (lowerKey.includes('confidence') || lowerKey.includes('percentage')) return Percent;
    
    // Default icon
    return Activity;
  };

  const paramFields: ParamField[] = [];
  let totalConfidence = 0;
  let confidenceCount = 0;
  let detectionConfidence: number | null = null;
  
  if (dto.parameters && typeof dto.parameters === "object") {
    for (const [k, v] of Object.entries(dto.parameters)) {
      const label = labelMap[k] || k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      let value = "";
      let confidence: number | undefined = undefined;
      
      // Extract detection_confidence specifically for OCR extraction percentage
      if (k === "detection_confidence") {
        if (typeof v === "object" && v !== null && "value" in v) {
          const confValue = (v as any).value;
          if (typeof confValue === "number") {
            detectionConfidence = confValue;
          } else if (typeof confValue === "string") {
            const parsed = parseFloat(confValue);
            if (!isNaN(parsed)) {
              detectionConfidence = parsed;
            }
          }
        } else if (typeof v === "number") {
          detectionConfidence = v;
        } else if (typeof v === "string") {
          const parsed = parseFloat(v);
          if (!isNaN(parsed)) {
            detectionConfidence = parsed;
          }
        }
      }
      
      if (typeof v === "object" && v !== null && "value" in v) {
        value = String((v as any).value);
        if ("confidence" in v && typeof (v as any).confidence === "number") {
          confidence = (v as any).confidence;
          totalConfidence += confidence;
          confidenceCount++;
        }
      } else {
        value = String(v);
      }
      
      paramFields.push({ key: k, label, value, confidence });
    }
  }
  
  // Calculate average extraction percentage from confidence
  const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : null;
  const extractionPercentage = averageConfidence !== null ? Math.round(averageConfidence * 100) : null;
  
  // Use detection_confidence as OCR extraction percentage (convert to percentage if it's a decimal)
  const ocrExtractionPercentage = detectionConfidence !== null 
    ? (detectionConfidence <= 1 ? Math.round(detectionConfidence * 100) : Math.round(detectionConfidence))
    : null;

  const solutionDescription = dto.llm_description || "No description available.";
  const motivation = dto.llm_motivation || "No motivation available.";

  const ingestedAt = dto.ingested_at ? new Date(dto.ingested_at).toLocaleString() : "Not available";
  const fileType = dto.chunks?.[0]?.type || "Unknown";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-subtle">
      <Header />
      <main className="container mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="gap-2" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Button>
            <Badge variant="outline" className="gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              DTO Details
            </Badge>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1">
              <FileText className="w-3.5 h-3.5" />
              {dto.file_name || "Unknown file"}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <LayoutGrid className="w-3.5 h-3.5" />
              {fileType.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CalendarClock className="w-3.5 h-3.5" />
              {ingestedAt}
            </Badge>
          </div>
        </div>

        {/* Three Equal Cards in a Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Card 1: DTO Context */}
          <Card className="card-medium p-6 space-y-4 flex flex-col h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-muted">DTO Context</p>
                <h2 className="text-xl font-semibold truncate mt-1">{dto.id}</h2>
              </div>
              <Badge className="gap-1 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
                AI ready
              </Badge>
            </div>
            <Separator />
            {ocrExtractionPercentage !== null && (
              <div className="p-3 rounded-xl bg-muted/60 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">OCR Extraction</p>
                  <span className="text-lg font-semibold text-card-foreground">{ocrExtractionPercentage}%</span>
                </div>
                <div className="w-full bg-surface-subtle rounded-full h-2">
                  <div 
                    className="bg-brand h-2 rounded-full transition-all"
                    style={{ width: `${ocrExtractionPercentage}%` }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-3 text-sm text-text-muted flex-grow">
              <div className="flex items-center justify-between">
                <span>File</span>
                <span className="font-medium text-card-foreground truncate ml-2">{dto.file_name || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Type</span>
                <Badge variant="secondary">{fileType.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Ingested</span>
                <span className="font-medium text-card-foreground text-xs">{ingestedAt}</span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span>Parameters</span>
                <span className="font-semibold text-card-foreground">{paramFields.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>OCR Fields</span>
                <span className="font-semibold text-card-foreground">{ocrFields.length || 0}</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Structured Parameters */}
          <Card className="card-medium p-6 space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Structured Parameters</p>
                <h3 className="text-lg font-semibold">DTO Parameters</h3>
              </div>
              <Badge variant="secondary">Normalized</Badge>
            </div>
            {detectionConfidence !== null && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-muted/60 to-muted/40 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-brand" />
                    <p className="text-xs text-text-muted font-medium">Detection Confidence</p>
                  </div>
                  <span className="text-lg font-semibold text-card-foreground">{ocrExtractionPercentage}%</span>
                </div>
                <div className="w-full bg-surface-subtle rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-brand to-brand/80 h-2.5 rounded-full transition-all shadow-sm"
                    style={{ width: `${ocrExtractionPercentage}%` }}
                  />
                </div>
              </div>
            )}
            {extractionPercentage !== null && detectionConfidence === null && (
              <div className="p-3 rounded-xl bg-muted/60 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">Extraction Percentage</p>
                  <span className="text-lg font-semibold text-card-foreground">{extractionPercentage}%</span>
                </div>
                <div className="w-full bg-surface-subtle rounded-full h-2">
                  <div 
                    className="bg-brand h-2 rounded-full transition-all"
                    style={{ width: `${extractionPercentage}%` }}
                  />
                </div>
              </div>
            )}
            <Separator />
            <div className="flex-grow overflow-y-auto space-y-2.5">
              {paramFields.length > 0 ? (
                paramFields.map((field, i) => {
                  const IconComponent = getParamIcon(field.key);
                  return (
                    <div 
                      key={i} 
                      className="group relative p-4 rounded-xl border border-border/60 bg-gradient-to-br from-surface-subtle to-surface-subtle/50 hover:border-brand/30 hover:shadow-sm transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-brand/10 text-brand flex-shrink-0 group-hover:bg-brand/20 transition-colors">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide truncate">
                                {field.label}
                              </p>
                              {field.confidence !== undefined && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0 flex-shrink-0">
                                  {Math.round(field.confidence * 100)}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-card-foreground break-words leading-relaxed">
                              {field.value}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="w-8 h-8 text-text-muted/40 mb-2" />
                  <p className="text-sm text-text-muted">No parameters found.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Card 3: Raw Extraction / Other Extracted Fields */}
          <Card className="card-medium p-6 space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Raw Extraction</p>
                <h3 className="text-lg font-semibold">Other Extracted Fields</h3>
              </div>
              <Badge variant="outline">OCR</Badge>
            </div>
            <Separator />
            <div className="flex-grow overflow-y-auto space-y-2">
              {previewOcrFields.length > 0 ? (
                <>
                  {previewOcrFields.map((line, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted text-sm border border-border">
                      {line}
                    </div>
                  ))}
                  {hasMoreOcrFields && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2" 
                      onClick={() => setOcrDialogOpen(true)}
                    >
                      Show More ({ocrFields.length - previewOcrFields.length} more)
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-text-muted">No other extracted fields found.</p>
              )}
            </div>
          </Card>
        </div>

        {/* OCR Dialog - 85% of screen */}
        <Dialog open={isOcrDialogOpen} onOpenChange={setOcrDialogOpen}>
          <DialogContent className="w-[85vw] max-w-[85vw] h-[85vh] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>All Extracted Fields</DialogTitle>
              <DialogDescription>Complete list of all OCR extracted fields ({ocrFields.length} total)</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ocrFields.map((line, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted text-sm border border-border">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Analysis and Chat Sections */}
        <div className="space-y-4">

          <Card className="card-medium p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">AI powered analysis</p>
                <h3 className="text-lg font-semibold">Insights</h3>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="group relative p-5 rounded-xl bg-gradient-to-br from-surface-subtle to-surface-subtle/80 border border-border/60 hover:border-brand/30 hover:shadow-md transition-all space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-brand/10 text-brand group-hover:bg-brand/20 transition-colors">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Solution Description</p>
                </div>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">{solutionDescription}</p>
                </div>
              </div>
              <div className="group relative p-5 rounded-xl bg-gradient-to-br from-surface-subtle to-surface-subtle/80 border border-border/60 hover:border-brand/30 hover:shadow-md transition-all space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-brand/10 text-brand group-hover:bg-brand/20 transition-colors">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Motivation</p>
                </div>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">{motivation}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="card-medium p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Ask questions</p>
                <h3 className="text-lg font-semibold">Chat about this DTO</h3>
              </div>
              <Badge variant="outline">Context aware</Badge>
            </div>
            <ChatSection context={dto} />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DTODetails;
