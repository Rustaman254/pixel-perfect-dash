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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#025864' }} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
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
    const theme = form?.theme || { view: 'list', color: '#025864', showPoweredBy: true };
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8fafc' }}>
        <Card className="max-w-md w-full shadow-lg" style={{ borderTopColor: theme.color, borderTopWidth: '4px' }}>
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${theme.color}20` }}>
              <CheckCircle className="h-8 w-8" style={{ color: '#22c55e' }} />
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

  const theme = form?.theme || { view: 'list', color: '#025864', showPoweredBy: true };
  const isChatView = theme.view === 'chat';
  const isCardView = theme.view === 'card';

  const getHexColor = (color: string) => {
    if (color.startsWith('#')) return color;
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    const computed = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);
    return computed || color;
  };

  const themeColorHex = getHexColor(theme.color);

  const renderQuestion = (question: Question, index: number) => {
    if (isChatView) {
      return (
        <div key={question.id} className="mb-6">
          <div className="flex justify-start mb-2">
            <div className="max-w-[85%]">
              <div className="px-4 py-3 rounded-2xl bg-white border shadow-sm">
                <p className="text-sm font-medium mb-1 text-slate-900">{question.question}</p>
                {question.description && <p className="text-xs text-slate-500 mb-2">{question.description}</p>}
                {question.required && <span className="text-xs text-red-500">* Required</span>}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[85%]">
              <div className="px-4 py-3 rounded-2xl text-white" style={{ backgroundColor: theme.color }}>
                <div className="text-white">{renderInput(question)}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isCardView) {
      return (
        <div key={question.id} className="mb-5 p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all" style={{ borderLeftColor: theme.color, borderLeftWidth: '4px' }}>
          <Label className="text-base font-semibold block mb-2 text-slate-900">
            {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {question.description && (
            <p className="text-sm text-slate-500 mb-4">{question.description}</p>
          )}
          <div className="mt-1">{renderInput(question)}</div>
        </div>
      );
    }

    return (
      <div key={question.id} className="py-4 px-5 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all mb-4" style={{ borderLeftColor: theme.color, borderLeftWidth: '3px' }}>
        <Label className="text-base text-slate-900 font-medium block mb-1">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {question.description && (
          <p className="text-sm text-slate-500 mb-3">{question.description}</p>
        )}
        <div className="mt-2">{renderInput(question, false, theme.color)}</div>
      </div>
    );
  };

  const renderInput = (question: Question, forChat: boolean = false, accentColor?: string) => {
    const isChat = forChat || isChatView;
    const inputClass = isChat 
      ? "bg-white/10 border-white/30 text-white placeholder:text-white/60" 
      : "w-full h-11 px-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all hover:border-slate-300";
    const labelClass = isChat ? "text-white" : "text-slate-900";
    const accent = accentColor || theme.color;
    
    switch (question.type) {
      case 'text':
        return <Input className={inputClass} style={!isChat ? { borderColor: `${accent}30` } : {}} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="Your answer" />;
      case 'textarea':
        return <Textarea className={inputClass.replace('h-11', 'min-h-[100px]').replace('py-2', 'py-3')} style={!isChat ? { borderColor: `${accent}30` } : {}} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="Your answer" rows={4} />;
      case 'number':
        return <Input type="number" className={inputClass} style={!isChat ? { borderColor: `${accent}30` } : {}} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="Your answer" />;
      case 'email':
        return <Input type="email" className={inputClass} style={!isChat ? { borderColor: `${accent}30` } : {}} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="your@email.com" />;
      case 'date':
        return <Input type="date" className={inputClass} style={!isChat ? { borderColor: `${accent}30` } : {}} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} />;
      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                <Checkbox checked={(answers[question.id] || []).includes(option)} onCheckedChange={(checked) => {
                  const current = answers[question.id] || [];
                  if (checked) handleAnswerChange(question.id, [...current, option]);
                  else handleAnswerChange(question.id, current.filter((o: string) => o !== option));
                }} className="border-slate-300" style={{ '--accent': accent } as any} />
                <Label className={`${labelClass} cursor-pointer font-normal`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'radio':
        return (
          <RadioGroup value={answers[question.id] || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                <RadioGroupItem value={option} id={`${question.id}_${idx}`} className={isChat ? "border-white" : "border-slate-300"} style={{ accentColor: accent }} />
                <Label htmlFor={`${question.id}_${idx}`} className={`${labelClass} cursor-pointer font-normal`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'select':
        return (
          <Select value={answers[question.id] || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <SelectTrigger className={inputClass} style={!isChat ? { borderColor: `${accent}30` } : {}}><SelectValue placeholder="Select an option" /></SelectTrigger>
            <SelectContent>
              {question.options?.map((option, idx) => (<SelectItem key={idx} value={option}>{option}</SelectItem>))}
            </SelectContent>
          </Select>
        );
      default:
        return <Input className={inputClass} style={!isChat ? { borderColor: `${accent}30` } : {}} placeholder="Your answer" />;
    }
  };

  const progress = form.questions?.length 
    ? (Object.keys(answers).filter(k => answers[k]).length / form.questions.length) * 100 
    : 0;

  return (
    <div className={`min-h-screen py-10 px-4 ${isChatView ? 'bg-gradient-to-b from-slate-100 to-slate-200' : ''}`} style={{ backgroundColor: isChatView ? undefined : '#f1f5f9' }}>
      <div className="max-w-3xl mx-auto">
        <Card className={`overflow-hidden ${isCardView ? 'shadow-xl' : 'shadow-lg'}`} style={{ borderRadius: '16px' }}>
          {/* Header with theme color */}
          <div className="relative">
            <div className="h-3 w-full" style={{ backgroundColor: theme.color }}></div>
            <CardHeader className="text-center pb-2 pt-6">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${theme.color}15` }}>
                <svg className="w-8 h-8" style={{ color: theme.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">{form.title}</CardTitle>
              {form.description && <CardDescription className="text-base text-slate-600 mt-2">{form.description}</CardDescription>}
            </CardHeader>
          </div>
          
          <CardContent className="pt-4 px-6 pb-8">
            {form.settings?.showProgressBar && (
              <div className="mb-8">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${progress}%`, backgroundColor: theme.color }} />
                </div>
                <p className="text-sm text-slate-500 mt-2 text-right">{Math.round(progress)}% complete</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {form.settings?.collectEmail && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <Label className="text-sm font-semibold text-slate-700 block mb-2">Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="h-11 border-slate-200 focus:border-[#025864]" />
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
                <div className="space-y-2">
                  {form.questions?.map((question, idx) => renderQuestion(question, idx))}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                style={{ backgroundColor: theme.color }}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
                Submit Response
              </Button>

              {theme.showPoweredBy && (
                <p className="text-center text-sm text-slate-400 mt-4">
                  Powered by <span className="font-medium" style={{ color: theme.color }}>Sokostack</span>
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