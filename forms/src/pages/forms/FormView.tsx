import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  type: string;
  question: string;
  required: boolean;
  options?: string[];
  description?: string;
}

interface Form {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  settings: any;
  theme?: {
    view: 'list' | 'chat' | 'card';
    color: string;
    showPoweredBy: boolean;
  };
}

const FormView = () => {
  const { slug } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetchForm();
  }, [slug]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/public/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data);
      } else {
        toast.error('Form not found');
      }
    } catch (error) {
      console.error('Failed to fetch form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    if (form?.settings?.collectEmail && !email) {
      toast.error('Please enter your email');
      return;
    }

    for (const question of form?.questions || []) {
      if (question.required && !answers[question.id]) {
        toast.error(`Please answer: ${question.question}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${form?.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form?.settings?.collectEmail ? email : undefined,
          answers,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('Response submitted successfully!');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#025864]" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Form not found</h2>
            <p className="text-slate-500">This form may have been deleted or the link is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Thank you!</h2>
            <p className="text-slate-500 mb-6">Your response has been submitted successfully.</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Submit another response
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = form.questions?.length 
    ? (Object.keys(answers).filter(k => answers[k]).length / form.questions.length) * 100 
    : 0;

  const theme = form?.theme || { view: 'list', color: '#025864', showPoweredBy: true };
  const isChatView = theme.view === 'chat';
  const isCardView = theme.view === 'card';

  const renderQuestion = (question: Question, index: number) => {
    const isAnswerOnRight = index % 2 === 0;
    
    if (isChatView) {
      return (
        <div key={question.id} className="mb-6">
          {/* Question on Left */}
          <div className="flex justify-start mb-2">
            <div className="max-w-[85%]">
              <div className="px-4 py-3 rounded-2xl bg-white border shadow-sm">
                <p className="text-sm font-medium mb-1">{question.question}</p>
                {question.description && <p className="text-xs text-slate-500 mb-2">{question.description}</p>}
                {question.required && <span className="text-xs text-red-500">* Required</span>}
              </div>
            </div>
          </div>
          {/* Answer on Right */}
          <div className="flex justify-end">
            <div className="max-w-[85%]">
              <div className="px-4 py-3 rounded-2xl text-white" style={{ backgroundColor: theme.color }}>
                {renderInput(question)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isCardView) {
      return (
        <div key={question.id} className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
          <Label className="text-base font-semibold block mb-2">
            {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {question.description && (
            <p className="text-sm text-slate-500 mb-3">{question.description}</p>
          )}
          {renderInput(question)}
        </div>
      );
    }

    // List view (default)
    return (
      <div key={question.id} className="space-y-2">
        <Label className="text-base">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {question.description && (
          <p className="text-sm text-slate-500">{question.description}</p>
        )}
        {renderInput(question)}
      </div>
    );
  };

  const renderInput = (question: Question, forChat: boolean = false) => {
    const inputClass = forChat ? "bg-white/10 border-white/20 text-white placeholder:text-white/60" : "";
    
    switch (question.type) {
      case 'text':
        return <Input className={inputClass} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="Your answer" />;
      case 'textarea':
        return <Textarea className={inputClass} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="Your answer" rows={4} />;
      case 'number':
        return <Input type="number" className={inputClass} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="Your answer" />;
      case 'email':
        return <Input type="email" className={inputClass} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="your@email.com" />;
      case 'date':
        return <Input type="date" className={inputClass} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} />;
      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Checkbox checked={(answers[question.id] || []).includes(option)} onCheckedChange={(checked) => {
                  const current = answers[question.id] || [];
                  if (checked) handleAnswerChange(question.id, [...current, option]);
                  else handleAnswerChange(question.id, current.filter((o: string) => o !== option));
                }} />
                <Label className="text-white">{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'radio':
        return (
          <RadioGroup value={answers[question.id] || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <RadioGroupItem value={option} id={`${question.id}_${idx}`} className="border-white" />
                <Label htmlFor={`${question.id}_${idx}`} className="text-white">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'select':
        return (
          <Select value={answers[question.id] || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {question.options?.map((option, idx) => (<SelectItem key={idx} value={option}>{option}</SelectItem>))}
            </SelectContent>
          </Select>
        );
      default:
        return <Input className={inputClass} placeholder="Your answer" />;
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 ${isChatView ? 'bg-gradient-to-b from-slate-100 to-slate-200' : 'bg-slate-50'}`}>
      <div className="max-w-2xl mx-auto">
        <Card className={isCardView ? 'shadow-xl' : ''}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && <CardDescription className="text-base">{form.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            {form.settings?.showProgressBar && (
              <div className="mb-6">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: theme.color }} />
                </div>
                <p className="text-sm text-slate-500 mt-1 text-right">{Math.round(progress)}% complete</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {form.settings?.collectEmail && (
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
                </div>
              )}

              {isChatView ? (
                <div className="space-y-2 py-4">
                  {form.questions?.map((question, idx) => {
                    const isOdd = idx % 2 === 1;
                    return (
                      <div key={question.id} className={`flex ${isOdd ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div className={`max-w-[85%] ${isOdd ? 'order-2' : 'order-1'}`}>
                          <div className={`px-4 py-3 rounded-2xl ${isOdd ? 'text-white' : 'bg-white border shadow-sm'}`} style={isOdd ? { backgroundColor: theme.color } : {}}>
                            <p className="text-sm font-medium mb-1">{question.question}</p>
                            {question.description && <p className="text-xs opacity-75 mb-2">{question.description}</p>}
                            {renderInput(question)}
                          </div>
                          {question.required && <p className={`text-xs mt-1 ${isOdd ? 'text-right' : 'text-left'} text-slate-400`}>Required</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                form.questions?.map((question, idx) => renderQuestion(question, idx))
              )}

              <Button 
                type="submit" 
                className="w-full hover:opacity-90"
                style={{ backgroundColor: theme.color }}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submit
              </Button>

              {theme.showPoweredBy && (
                <p className="text-center text-xs text-slate-400 mt-4">
                  Powered by <span style={{ color: theme.color }}>Sokostack</span>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormView;