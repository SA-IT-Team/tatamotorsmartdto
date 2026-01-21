import { Brain, HelpCircle, LayoutDashboard, ListTree, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const Header = () => {
  const [activeSection, setActiveSection] = useState<"overview" | "dtos">("overview");

  const scrollToSection = (sectionId: string, section: "overview" | "dtos") => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Approximate header height in pixels
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(section);
    }
  };

  // Set overview as default on mount
  useEffect(() => {
    setActiveSection("overview");
  }, []);
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-brand rounded-xl shadow-sm">
              <Brain className="w-6 h-6 text-brand-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-Tata-red">Tata Smart DTO Control</h1>
              <p className="text-sm text-text-muted">Live extraction • AI analysis • Cosmos audit</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 text-sm text-text-muted">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("gap-2", activeSection === "overview" && "bg-accent text-accent-foreground")}
              onClick={() => scrollToSection("overview-section", "overview")}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("gap-2", activeSection === "dtos" && "bg-accent text-accent-foreground")}
              onClick={() => scrollToSection("dtos-section", "dtos")}
            >
              <ListTree className="w-4 h-4" />
              DTOs
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Radio className="w-3.5 h-3.5 text-success" />
              Live
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Help
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem>
                  <div className="space-y-1">
                    <p className="font-medium">How it works</p>
                    <p className="text-xs text-text-muted">Upload a document to kick off blob ingest → DTO extraction → AI analysis.</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="space-y-1">
                    <p className="font-medium">Supported formats</p>
                    <p className="text-xs text-text-muted">PDF, DOC, DOCX files up to 10MB</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="space-y-1">
                    <p className="font-medium">Shortcuts</p>
                    <p className="text-xs text-text-muted">Ctrl+Enter to analyze • Ctrl+K to clear</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};