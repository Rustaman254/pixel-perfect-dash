import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, X, MessageSquare, FileText, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  productName?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  productName = "Forms"
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolStatus]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setToolStatus("Thinking...");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please log in to use the AI assistant");
        setLoading(false);
        setToolStatus(null);
        return;
      }

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      setToolStatus(null);

      if (res.ok) {
        const data = await res.json();
        const content = data.message || data.messages?.[data.messages.length - 1]?.text || "";
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: content,
            timestamp: new Date(),
          },
        ]);
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to get response");
      }
    } catch (error) {
      console.error("AI error:", error);
      toast.error("Failed to connect to AI assistant");
    } finally {
      setLoading(false);
      setToolStatus(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#025864] hover:bg-[#025864]/90 shadow-lg flex items-center justify-center"
        style={{ borderRadius: "50%" }}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[500px] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50">
      <div className="bg-[#025864] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <div>
            <span className="font-semibold text-sm block">{productName} Assistant</span>
            <span className="text-xs text-white/70">AI powered help</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tool Status Bar */}
      {toolStatus && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
          <span className="text-sm text-amber-800">{toolStatus}</span>
        </div>
      )}

      <ScrollArea className="flex-1 p-4 max-h-[350px]">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-4">
              <Bot className="h-12 w-12 mx-auto mb-2 text-[#025864]" />
              <p className="text-sm font-medium">{productName} Assistant</p>
              <p className="text-xs text-slate-400 mt-1">
                Ask me anything - "show my forms", "create a form", etc.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <Bot className="h-6 w-6 text-[#025864] flex-shrink-0 mt-1" />
              )}
              {msg.role === "tool" && (
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              )}
              <div
                className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${
                  msg.role === "user"
                    ? "bg-[#025864] text-white"
                    : msg.role === "tool"
                    ? "bg-green-100 text-green-800"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === "user" && (
                <User className="h-6 w-6 text-slate-400 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 justify-start">
              <Bot className="h-6 w-6 text-[#025864] flex-shrink-0 mt-1" />
              <div className="bg-slate-100 px-3 py-2 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-[#025864]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask me...`}
          disabled={loading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          size="icon"
          className="bg-[#025864] hover:bg-[#025864]/90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default AIAssistant;