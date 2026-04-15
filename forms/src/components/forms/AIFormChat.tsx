import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIFormChatProps {
  onFormCreated?: (formId: number, formSlug: string) => void;
}

const AIFormChat: React.FC<AIFormChatProps> = ({ onFormCreated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !ws) {
      connectWebSocket();
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !ws) return;

    const pollInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      } else if (ws.readyState === WebSocket.CLOSED) {
        console.log("WebSocket closed, reconnecting...");
        connectWebSocket();
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isOpen, ws]);

  const connectWebSocket = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      toast.error("Please log in to use the AI assistant");
      return;
    }

    const wsUrl = `${import.meta.env.VITE_WS_URL || "ws://localhost:3001"}/ws/agent?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: data.message,
              timestamp: new Date(),
            },
          ]);
        } else if (data.type === "thinking") {
          setThinking(true);
        } else if (data.type === "response") {
          setThinking(false);
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

          if (data.messages) {
            const formData = data.messages.find((m: any) => m.text?.includes("Form created successfully"));
            if (formData) {
              const match = formData.text.match(/ID: (\d+)|slug: ([a-z0-9-]+)/i);
              if (match && onFormCreated) {
                const formId = match[1];
                const formSlug = match[2];
                if (formId) {
                  onFormCreated(parseInt(formId), formSlug);
                }
              }
            }
          }
        } else if (data.type === "error") {
          setThinking(false);
          toast.error(data.message);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Connection error. Using HTTP fallback.");
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };

    setWs(socket);
  };

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

    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "chat", message }));
      } else {
        await sendHttpRequest(message);
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
      setLoading(false);
    }
  };

  const sendHttpRequest = async (message: string) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/agent/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message || data.messages?.[data.messages.length - 1]?.text || "",
          timestamp: new Date(),
        },
      ]);
    } else {
      const error = await res.json();
      toast.error(error.message || "Failed to get response");
    }

    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#025864] hover:bg-[#025864]/90 shadow-lg"
        style={{ borderRadius: "50%" }}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[500px] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
      <div className="bg-[#025864] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">Forms AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4 max-h-[350px]">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-4">
              <Bot className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">
                Hi! I&apos;m your forms assistant. Tell me what kind of form you want to create, and I&apos;ll generate it for you!
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
              <div
                className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${
                  msg.role === "user"
                    ? "bg-[#025864] text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <User className="h-6 w-6 text-slate-400 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}

          {thinking && (
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
          placeholder="Describe the form you want..."
          disabled={loading || thinking}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={loading || thinking || !input.trim()}
          size="icon"
          className="bg-[#025864] hover:bg-[#025864]/90"
        >
          {loading || thinking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default AIFormChat;