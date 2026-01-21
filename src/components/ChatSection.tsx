import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Bot, User } from "lucide-react";

interface ChatMessage {
  sender: "user" | "ai";
  message: string;
}

interface ChatSectionProps {
  context: any;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ context }) => {
  function cleanText(text: string): string {
    return text
      .replace(/\s*---+\s*/g, "\n")
      .replace(/#+\s*/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\|/g, " ")
      .replace(/\n{2,}/g, "\n")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { sender: "user", message: input };
    const queryText = input.trim(); // Capture input before clearing
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    try {
      const aiResponse = await fetchAzureOpenAI(queryText, context);
      setMessages(prev => [...prev, { sender: "ai", message: aiResponse }]);
    } catch (err) {
      console.error("Error fetching AI response:", err);
      const errorMessage = err instanceof Error ? err.message : "Error fetching AI response.";
      setMessages(prev => [...prev, { sender: "ai", message: `Error: ${errorMessage}` }]);
    } finally {
      setLoading(false);
    }
  };

  async function fetchAzureOpenAI(query: string, context: any): Promise<string> {
    const AZURE_OPENAI_BASE = import.meta.env.VITE_AZURE_OPENAI_BASE;
    const AZURE_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY;
    const DEPLOYMENT_NAME = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;
    const API_VERSION = import.meta.env.VITE_AZURE_OPENAI_VERSION;

    console.log("Azure OpenAI Config Check:", {
      hasBase: !!AZURE_OPENAI_BASE,
      hasKey: !!AZURE_KEY,
      hasDeployment: !!DEPLOYMENT_NAME,
      hasApiVersion: !!API_VERSION,
    });

    if (!AZURE_OPENAI_BASE) {
      throw new Error("VITE_AZURE_OPENAI_BASE is not configured");
    }
    if (!AZURE_KEY) {
      throw new Error("VITE_AZURE_KEY is not configured");
    }
    if (!DEPLOYMENT_NAME) {
      throw new Error("VITE_DEPLOYMENT_NAME is not configured");
    }
    if (!API_VERSION) {
      throw new Error("VITE_API_VERSION is not configured");
    }

    const prompt = `You are an expert technical writer. Given the following extracted technical parameters and any relevant text, be technical and concise.
DTO Context: ${JSON.stringify(context)}
User Query: ${query}`;
    const url = `${AZURE_OPENAI_BASE}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`;
    const body = {
      messages: [
        { role: "system", content: "You are a SMART AI DTO Analysis assistant. Answer user queries based on the DTO context provided." },
        { role: "user", content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.2,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
    };
    console.log("Making API call to:", url);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_KEY,
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error Response:", res.status, res.statusText, errorText);
      throw new Error(`Failed to fetch AI response: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log("API Response received:", data);
    return data.choices?.[0]?.message?.content || "No response from AI.";
  }

  const hasConversation = messages.length > 0 || loading;

  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className={`${hasConversation ? 'h-[400px]' : 'h-[240px]'} rounded-xl border border-border/60 bg-gradient-to-b from-surface-subtle/50 to-surface-subtle shadow-sm transition-all duration-300 ease-in-out`}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 rounded-full bg-brand/10 mb-4">
                <Sparkles className="w-6 h-6 text-brand" />
              </div>
              <p className="text-sm font-medium text-text-muted mb-1">Start the conversation</p>
              <p className="text-xs text-text-muted/70">Ask a question about this DTO to get AI-powered insights</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-3`}>
              {msg.sender === "ai" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center border border-brand/20">
                  <Bot className="w-4 h-4 text-brand" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl text-sm shadow-sm transition-all ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-brand to-brand/90 text-brand-foreground rounded-br-md px-4 py-3 shadow-brand/20"
                    : "bg-muted/80 backdrop-blur-sm text-card-foreground rounded-bl-md px-4 py-3 border border-border/40"
                }`}
              >
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {cleanText(msg.message)}
                </div>
              </div>
              {msg.sender === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center border border-border/40">
                  <User className="w-4 h-4 text-card-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center border border-brand/20">
                <Bot className="w-4 h-4 text-brand animate-pulse" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md text-sm bg-muted/80 text-card-foreground border border-border/40 shadow-sm inline-flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-text-muted ml-1">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Input
            className="flex-1 pr-12 h-11 rounded-xl border-border/60 bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-brand/20 transition-all"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a technical question about this DTO..."
            disabled={loading}
            onKeyDown={e => {
              if (e.key === "Enter") sendMessage();
            }}
          />
        </div>
        <Button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()} 
          className="gap-2 h-11 px-6 rounded-xl bg-brand hover:bg-brand/90 text-brand-foreground shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatSection;
