import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, X, MessageSquare, FileText, CheckCircle, Clock, Pencil, Type, AlignLeft, ListPlus } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool" | "progress";
  content: string;
  timestamp: Date;
  step?: string;
  progress?: number;
}

interface FormContext {
  formId?: number;
  title?: string;
  description?: string;
  questions?: any[];
}

interface AIAssistantProps {
  productName?: string;
  formContext?: FormContext;
  onFormUpdated?: (form: any) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  productName = "Forms",
  formContext,
  onFormUpdated
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolStatus, progressSteps]);

  useEffect(() => {
    if (!isOpen) return;

    const pollInterval = setInterval(() => {
      console.log("Forms AI Assistant: Connection active");
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isOpen]);

  const updateProgress = (step: string, progress: number) => {
    setProgressSteps(prev => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
    setCurrentStep(progress);
    setToolStatus(step);
  };

  const clearProgress = () => {
    setProgressSteps([]);
    setCurrentStep(-1);
    setToolStatus(null);
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
    setToolStatus("Analyzing your request...");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please log in to use the AI assistant");
        setLoading(false);
        setToolStatus(null);
        return;
      }

      const requestBody: any = {
        message: message,
      };

      if (formContext?.formId) {
        requestBody.formId = formContext.formId;
        requestBody.currentForm = {
          title: formContext.title,
          description: formContext.description,
          questions: formContext.questions
        };
      }

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      clearProgress();

      if (res.ok) {
        const data = await res.json();
        
        // Check for progress updates in the response
        if (data.progress) {
          const progressMessages: Message[] = [];
          
          if (data.progress.title) {
            progressMessages.push({
              id: Date.now().toString() + '_title',
              role: 'progress',
              content: `Setting title: "${data.progress.title}"`,
              timestamp: new Date(),
              step: 'Title',
              progress: 1
            });
          }
          
          if (data.progress.description) {
            progressMessages.push({
              id: Date.now().toString() + '_desc',
              role: 'progress',
              content: `Adding description: "${data.progress.description}"`,
              timestamp: new Date(),
              step: 'Description',
              progress: 2
            });
          }
          
          if (data.progress.questions && data.progress.questions.length > 0) {
            data.progress.questions.forEach((q: any, idx: number) => {
              progressMessages.push({
                id: Date.now().toString() + '_q_' + idx,
                role: 'progress',
                content: `Adding question ${idx + 1}: "${q.question}" (${q.type})`,
                timestamp: new Date(),
                step: `Question ${idx + 1}`,
                progress: 3 + idx
              });
            });
          }
          
          progressMessages.push({
            id: Date.now().toString() + '_complete',
            role: 'tool',
            content: `Form ${formContext?.formId ? 'updated' : 'created'} successfully!`,
            timestamp: new Date(),
            step: 'Complete',
            progress: 100
          });
          
          setMessages(prev => [...prev, ...progressMessages]);
          
          if (onFormUpdated && data.progress.form) {
            onFormUpdated(data.progress.form);
          }
        }
        
        const content = data.message || data.messages?.[data.messages.length - 1]?.text || "";
        
        const formIdMatch = content.match(/(?:form|id)[\s:]*(\d+)/i);
        const createdMatch = content.includes("created") || content.includes("updated") || content.includes("success");
        
        if ((formIdMatch || createdMatch) && (window.location.pathname === '/' || window.location.pathname === '/forms')) {
          window.dispatchEvent(new CustomEvent('ai-form-created'));
          toast.success("Form created! Check your dashboard.");
        }
        
        if (content && !data.progress) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: content,
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to get response");
      }
    } catch (error) {
      console.error("AI error:", error);
      toast.error("Failed to connect to AI assistant");
    } finally {
      setLoading(false);
      clearProgress();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const getPromptPlaceholder = () => {
    if (formContext?.formId) {
      return `Edit this form (e.g., "add questions about pricing")`;
    }
    return `Ask me anything - "create a feedback form", etc.`;
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
    <div className="fixed bottom-6 right-6 w-[400px] max-h-[600px] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50">
      <div className="bg-[#025864] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <div>
            <span className="font-semibold text-sm block">{productName} Assistant</span>
            <span className="text-xs text-white/70">
              {formContext?.formId ? 'Editing form' : 'AI powered help'}
            </span>
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

      {/* Progress Steps */}
      {progressSteps.length > 0 && (
        <div className="bg-gradient-to-r from-[#025864]/10 to-[#038a9c]/10 border-b border-[#025864]/20 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 text-[#025864] animate-spin" />
            <span className="text-sm font-medium text-[#025864]">Building your form...</span>
          </div>
          <div className="space-y-1">
            {progressSteps.map((step, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-2 text-xs ${
                  idx <= currentStep ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {idx < currentStep ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : idx === currentStep ? (
                  <Loader2 className="h-3 w-3 text-[#025864] animate-spin" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-slate-300" />
                )}
                <span className={idx <= currentStep ? 'font-medium' : ''}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool Status Bar */}
      {toolStatus && progressSteps.length === 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
          <span className="text-sm text-amber-800">{toolStatus}</span>
        </div>
      )}

      <ScrollArea className="flex-1 p-4 max-h-[380px]">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-4">
              <Bot className="h-12 w-12 mx-auto mb-2 text-[#025864]" />
              <p className="text-sm font-medium">{productName} Assistant</p>
              <p className="text-xs text-slate-400 mt-1">
                {formContext?.formId 
                  ? `Editing: "${formContext.title || 'Untitled'}"` 
                  : 'Ask me anything - "create a form", "show my forms", etc.'}
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
              {msg.role === "progress" && (
                <div className="h-6 w-6 rounded-full bg-[#025864]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  {msg.progress && msg.progress < 100 ? (
                    <Loader2 className="h-3 w-3 text-[#025864] animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                </div>
              )}
              {msg.role === "user" && (
                <User className="h-6 w-6 text-slate-400 flex-shrink-0 mt-1" />
              )}
              <div
                className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${
                  msg.role === "user"
                    ? "bg-[#025864] text-white"
                    : msg.role === "tool"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : msg.role === "progress"
                    ? "bg-[#025864]/10 text-slate-700 border border-[#025864]/20"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.step && msg.role === "progress" && (
                  <div className="text-xs text-[#025864] mt-1 font-medium">{msg.step}</div>
                )}
              </div>
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
          placeholder={getPromptPlaceholder()}
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