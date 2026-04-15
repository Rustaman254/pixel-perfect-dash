import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, ArrowLeft, BarChart3, Filter, CheckSquare, Circle, List, Type, AlignLeft, Hash, Calendar, Mail, User } from "lucide-react";
import { toast } from "sonner";

interface Response {
  id: number;
  email?: string;
  answers: Record<string, any>;
  submittedAt: string;
}

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
  theme: any;
  responses: Response[];
}

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
  const [viewMode, setViewMode] = useState<'summary' | 'responses'>('summary');
  const [filterEmail, setFilterEmail] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

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

  const exportCSV = () => {
    if (!form?.responses?.length) return;

    const headers = ['Email', ...form.questions?.map(q => q.question), 'Submitted At'];
    const rows = filteredResponses.map(response => [
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

  const filteredResponses = form?.responses?.filter(r => {
    if (filterEmail && r.email && !r.email.toLowerCase().includes(filterEmail.toLowerCase())) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  }) || [];

  const getAnswerStats = (questionId: string) => {
    const answers = form?.responses?.map(r => r.answers[questionId]).filter(a => a !== undefined && a !== null && a !== '') || [];
    return answers;
  };

  const getAnswerCount = (questionId: string, value: string) => {
    return form?.responses?.filter(r => {
      const answer = r.answers[questionId];
      if (Array.isArray(answer)) return answer.includes(value);
      return answer === value;
    }).length || 0;
  };

  const formatAnswer = (answer: any) => {
    if (answer === undefined || answer === null || answer === '') return '-';
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer);
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
            <div className="flex items-center gap-2">
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
            {/* View Toggle & Filters */}
            <Card className="border-slate-200/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'summary' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('summary')}
                      style={viewMode === 'summary' ? { backgroundColor: theme.color } : {}}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Summary
                    </Button>
                    <Button
                      variant={viewMode === 'responses' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('responses')}
                      style={viewMode === 'responses' ? { backgroundColor: theme.color } : {}}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Individual Responses
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Filter by email..."
                        value={filterEmail}
                        onChange={(e) => setFilterEmail(e.target.value)}
                        className="h-8 w-40 border-slate-200"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'oldest')}>
                      <SelectTrigger className="h-8 w-32 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary View - Like Google Forms */}
            {viewMode === 'summary' && (
              <div className="grid grid-cols-1 gap-6">
                {form?.questions?.map((question, qIndex) => {
                  const stats = getAnswerStats(question.id);
                  const totalAnswers = stats.length;
                  const answeredCount = totalAnswers;
                  const unansweredCount = totalResponses - answeredCount;
                  
                  return (
                    <Card key={question.id} className="border-slate-200/50 shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-slate-500">Question {qIndex + 1}</span>
                              <Badge variant="outline" className="text-xs">{questionTypeLabels[question.type]}</Badge>
                            </div>
                            <CardTitle className="text-base font-medium text-slate-800">{question.question}</CardTitle>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: theme.color }}>{answeredCount}</p>
                            <p className="text-xs text-slate-500">responses</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Bar chart for options */}
                        {(question.type === 'radio' || question.type === 'select') && question.options && (
                          <div className="space-y-3">
                            {question.options.map((option, optIdx) => {
                              const count = getAnswerCount(question.id, option);
                              const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                              
                              return (
                                <div key={optIdx} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-700">{option}</span>
                                    <span className="text-slate-500">{count} ({percentage}%)</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${percentage}%`, backgroundColor: theme.color }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Checkbox stats */}
                        {question.type === 'checkbox' && question.options && (
                          <div className="space-y-3">
                            {question.options.map((option, optIdx) => {
                              const count = getAnswerCount(question.id, option);
                              const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                              
                              return (
                                <div key={optIdx} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-700">{option}</span>
                                    <span className="text-slate-500">{count} ({percentage}%)</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${percentage}%`, backgroundColor: theme.color }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Text/Textarea - Show sample responses */}
                        {(question.type === 'text' || question.type === 'textarea') && (
                          <div className="space-y-2">
                            {stats.slice(0, 5).map((answer, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700">
                                {String(answer)}
                              </div>
                            ))}
                            {stats.length > 5 && (
                              <p className="text-xs text-slate-500 text-center">+ {stats.length - 5} more responses</p>
                            )}
                          </div>
                        )}
                        
                        {/* Date/Number - Simple stats */}
                        {(question.type === 'date' || question.type === 'number' || question.type === 'email') && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg text-center">
                              <p className="text-2xl font-bold" style={{ color: theme.color }}>{answeredCount}</p>
                              <p className="text-xs text-slate-500">Answered</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg text-center">
                              <p className="text-2xl font-bold text-slate-400">{unansweredCount}</p>
                              <p className="text-xs text-slate-500">Skipped</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Individual Responses - Like Google Forms Table */}
            {viewMode === 'responses' && (
              <Card className="border-slate-200/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left p-3 font-medium text-slate-600 text-sm w-16">#</th>
                        {form?.settings?.collectEmail && (
                          <th className="text-left p-3 font-medium text-slate-600 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </div>
                          </th>
                        )}
                        {form?.questions?.map((q) => (
                          <th key={q.id} className="text-left p-3 font-medium text-slate-600 text-sm min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{q.question}</span>
                            </div>
                          </th>
                        ))}
                        <th className="text-left p-3 font-medium text-slate-600 text-sm w-32">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Timestamp
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResponses.map((response, rIndex) => (
                        <tr key={response.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3 text-sm text-slate-500">{rIndex + 1}</td>
                          {form?.settings?.collectEmail && (
                            <td className="p-3 text-sm">
                              {response.email ? (
                                <span className="text-[#025864]">{response.email}</span>
                              ) : (
                                <span className="text-slate-400 italic">Not specified</span>
                              )}
                            </td>
                          )}
                          {form?.questions?.map((q) => (
                            <td key={q.id} className="p-3 text-sm text-slate-700 max-w-[300px]">
                              {q.type === 'checkbox' ? (
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(response.answers[q.id]) ? (
                                    response.answers[q.id].map((v, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                                    ))
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </div>
                              ) : (
                                <span className="line-clamp-2">{formatAnswer(response.answers[q.id])}</span>
                              )}
                            </td>
                          ))}
                          <td className="p-3 text-sm text-slate-500">
                            {new Date(response.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredResponses.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No responses match your filters.
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FormResponses;