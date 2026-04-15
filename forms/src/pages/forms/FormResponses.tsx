import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download, ArrowLeft, BarChart3, ChevronDown, ChevronUp, CheckSquare, Circle, List, Type, AlignLeft, Hash, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Response {
  id: number;
  email?: string;
  answers: Record<string, any>;
  submittedAt: string;
}

interface Form {
  id: number;
  title: string;
  description: string;
  questions: any[];
  settings: any;
  theme: any;
  responses: Response[];
}

const questionTypeIcons: Record<string, any> = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  email: List,
  date: Calendar,
  checkbox: CheckSquare,
  radio: Circle,
  select: List,
};

const questionTypeLabels: Record<string, string> = {
  text: 'Short Answer',
  textarea: 'Paragraph',
  number: 'Number',
  email: 'Email',
  date: 'Date',
  checkbox: 'Checkbox',
  radio: 'Multiple Choice',
  select: 'Dropdown',
};

const FormResponses = () => {
  const { userProfile } = useAppContext();
  const navigate = useNavigate();
  const { formId } = useParams();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedResponses, setExpandedResponses] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/forms/${formId}/responses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        setExpandedResponses(new Set(data.responses?.map((r: Response) => r.id) || []));
      } else {
        toast.error('Failed to load form');
      }
    } catch (error) {
      console.error('Failed to fetch form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const toggleResponseExpand = (responseId: number) => {
    setExpandedResponses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(responseId)) {
        newSet.delete(responseId);
      } else {
        newSet.add(responseId);
      }
      return newSet;
    });
  };

  const formatAnswer = (question: any, answer: any) => {
    if (answer === undefined || answer === null || answer === '') {
      return <span className="text-slate-400 italic">No answer</span>;
    }
    
    if (Array.isArray(answer)) {
      return <span className="text-slate-700">{answer.join(', ')}</span>;
    }
    
    if (question.type === 'date' && answer) {
      return <span className="text-slate-700">{new Date(answer).toLocaleDateString()}</span>;
    }
    
    return <span className="text-slate-700">{String(answer)}</span>;
  };

  const exportCSV = () => {
    if (!form?.responses?.length) return;

    const headers = ['Email', ...form.questions?.map(q => q.question), 'Submitted At'];
    const rows = form.responses.map(response => [
      response.email || '',
      ...form.questions?.map(q => {
        const answer = response.answers[q.id];
        if (Array.isArray(answer)) return answer.join(', ');
        return answer || '';
      }),
      new Date(response.submittedAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title.replace(/\s+/g, '_')}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#025864]" />
      </div>
    );
  }

  const totalResponses = form?.responses?.length || 0;
  const theme = form?.theme || { color: '#025864' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/forms')} className="text-slate-600 hover:text-[#025864] hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#025864] to-[#038a9c] flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-800">{form?.title}</h1>
                  <p className="text-sm text-slate-500">{totalResponses} response{totalResponses !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={exportCSV}
              disabled={totalResponses === 0}
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {totalResponses === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No responses yet</h3>
              <p className="text-slate-500 mb-4">Share your form to start collecting responses.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {form?.responses?.map((response, responseIndex) => {
              const Icon = questionTypeIcons['text'] || Type;
              
              return (
                <Card 
                  key={response.id} 
                  className={`border-slate-200/50 shadow-sm hover:shadow-md transition-all ${expandedResponses.has(response.id) ? 'ring-1 ring-[#025864]/20' : ''}`}
                >
                  <CardContent className="p-0">
                    {/* Response Header - Same style as question cards */}
                    <div 
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => toggleResponseExpand(response.id)}
                    >
                      <div className="flex-1 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#025864]/10 flex items-center justify-center text-[#025864] font-semibold text-sm">
                          {responseIndex + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 line-clamp-1">
                            {response.email || 'Anonymous Response'}
                          </p>
                          <p className="text-xs text-slate-500">
                            <Icon className="inline h-3 w-3 mr-1" />
                            {new Date(response.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-600"
                      >
                        {expandedResponses.has(response.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Questions - Same style as question cards */}
                    {expandedResponses.has(response.id) && (
                      <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/30">
                        {form.questions?.map((question, qIndex) => {
                          const answer = response.answers[question.id];
                          const answerValue = answer !== undefined && answer !== null && answer !== '' 
                            ? (Array.isArray(answer) ? answer.join(', ') : String(answer))
                            : '';
                          const QIcon = questionTypeIcons[question.type] || Type;
                          
                          return (
                            <div 
                              key={question.id} 
                              className="border rounded-lg p-4 space-y-4 bg-white"
                            >
                              {/* Question Header - Same style as form builder */}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {questionTypeLabels[question.type] || 'Question'}
                                </Badge>
                                {question.required && <span className="text-xs text-red-500">• Required</span>}
                              </div>
                              
                              {/* Question Text - Read only input */}
                              <input
                                readOnly
                                className="flex w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-10 border-slate-200 font-medium text-slate-900"
                                value={question.question || 'Untitled Question'}
                              />
                              
                              {/* Question Description (if any) */}
                              {question.description && (
                                <input
                                  readOnly
                                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-sm border-slate-200 text-slate-500"
                                  value={question.description}
                                />
                              )}
                              
                              {/* Answer Input - Where user enters answer in form, show the answer here */}
                              <div>
                                <Label className="text-xs text-slate-500 mb-2 block">Answer:</Label>
                                {question.type === 'textarea' ? (
                                  <textarea
                                    readOnly
                                    className="flex w-full rounded-md border bg-slate-50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[80px] border-slate-200 text-slate-700"
                                    value={answerValue}
                                    placeholder="No answer"
                                  />
                                ) : question.type === 'checkbox' ? (
                                  <div className="space-y-2">
                                    {question.options?.map((option: string, optIndex: number) => {
                                      const isChecked = Array.isArray(answer) && answer.includes(option);
                                      return (
                                        <div key={optIndex} className="flex items-center gap-3 p-2 rounded bg-slate-50">
                                          <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${isChecked ? 'bg-[#025864] border-[#025864]' : 'border-slate-300'}`}>
                                            {isChecked && <CheckSquare className="h-3 w-3 text-white" />}
                                          </div>
                                          <span className={isChecked ? 'text-slate-900 font-medium' : 'text-slate-500'}>{option}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : question.type === 'radio' ? (
                                  <div className="space-y-2">
                                    {question.options?.map((option: string, optIndex: number) => {
                                      const isChecked = answer === option;
                                      return (
                                        <div key={optIndex} className="flex items-center gap-3 p-2 rounded bg-slate-50">
                                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isChecked ? 'border-[#025864]' : 'border-slate-300'}`}>
                                            {isChecked && <div className="w-2 h-2 rounded-full bg-[#025864]" />}
                                          </div>
                                          <span className={isChecked ? 'text-slate-900 font-medium' : 'text-slate-500'}>{option}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : question.type === 'select' ? (
                                  <div className="flex items-center gap-3 p-3 rounded bg-slate-50 border border-slate-200">
                                    <List className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-700">{answerValue || 'No answer'}</span>
                                  </div>
                                ) : (
                                  <input
                                    readOnly
                                    type={question.type === 'date' ? 'date' : question.type === 'email' ? 'email' : question.type === 'number' ? 'number' : 'text'}
                                    className="flex w-full rounded-md border bg-slate-50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-10 border-slate-200 text-slate-700"
                                    value={answerValue}
                                    placeholder="No answer"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default FormResponses;