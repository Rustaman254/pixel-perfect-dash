import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, Link, Check, ChevronDown, ChevronUp, Trash2, Plus, List, Circle, CheckSquare, Type, AlignLeft, Hash, Calendar } from "lucide-react";
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
  theme: any;
  slug: string;
}

const questionTypes = [
  { type: 'text', label: 'Short Answer', icon: Type },
  { type: 'textarea', label: 'Paragraph', icon: AlignLeft },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: List },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Multiple Choice', icon: Circle },
  { type: 'select', label: 'Dropdown', icon: List },
];

const FormPreview = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/forms/${formId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        setExpandedQuestions(new Set(data.questions?.map((q: Question) => q.id) || []));
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

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Form submitted successfully!');
    setSubmitted(true);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/f/${form?.slug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Form not found</h2>
          <Button onClick={() => navigate('/forms')}>Back to Forms</Button>
        </div>
      </div>
    );
  }

  const theme = form.theme || { color: '#025864', showPoweredBy: true };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-normal text-slate-900 mb-2">Your response has been recorded</h2>
          <p className="text-slate-600 mb-6">Thank you for submitting the form.</p>
          <Button 
            onClick={() => { setSubmitted(false); setAnswers({}); setEmail(""); }}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6"
          >
            Submit another response
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Top Bar - Google Forms Style */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/forms/edit/${formId}`)}
              className="h-9 w-9 rounded-full hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-600" />
            </Button>
            <div className="h-6 w-px bg-slate-200"></div>
            <span className="text-sm font-medium text-slate-600">Preview mode</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
              Not Published
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="h-9 rounded-full px-4 border-slate-300 hover:bg-slate-50"
            >
              {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
              {linkCopied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Form Header Card */}
          <Card className="border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#025864]"></div>
                Form Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Form Title</Label>
                <Input
                  value={form.title}
                  readOnly
                  className="h-11 border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Description (optional)</Label>
                <Textarea
                  value={form.description || ''}
                  readOnly
                  rows={3}
                  className="border-slate-200 bg-slate-50 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#025864]"></div>
                Questions ({form.questions?.length || 0})
              </h2>
            </div>

            {form.questions?.map((question, index) => {
              const Icon = questionTypes.find(t => t.type === question.type)?.icon || Type;
              
              return (
                <Card 
                  key={question.id} 
                  className={`border-slate-200/50 shadow-sm hover:shadow-md transition-all ${expandedQuestions.has(question.id) ? 'ring-1 ring-[#025864]/20' : ''}`}
                >
                  <CardContent className="p-0">
                    {/* Question Header */}
                    <div 
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => toggleExpand(question.id)}
                    >
                      <div className="flex-1 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#025864]/10 flex items-center justify-center text-[#025864] font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 line-clamp-1">
                            {question.question || 'Untitled Question'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {questionTypes.find(t => t.type === question.type)?.label}
                            {question.required && <span className="text-red-500 ml-1">• Required</span>}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-600"
                      >
                        {expandedQuestions.has(question.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Content - Answer Input */}
                    {expandedQuestions.has(question.id) && (
                      <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/30">
                        {/* Question Text */}
                        <Input
                          value={question.question || ''}
                          readOnly
                          placeholder="Enter your question"
                          className="h-10 border-slate-200 font-medium bg-white"
                        />
                        
                        {/* Description */}
                        <Input
                          value={question.description || ''}
                          readOnly
                          placeholder="Help text (optional)"
                          className="text-sm border-slate-200 bg-white"
                        />

                        {/* Answer Input */}
                        <div className="pt-2">
                          <Label className="text-sm font-medium text-slate-700 mb-2 block">Answer:</Label>
                          
                          {question.type === 'text' && (
                            <Input
                              value={answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              placeholder="Your answer"
                              className="h-11 border-slate-200 bg-white"
                            />
                          )}

                          {question.type === 'textarea' && (
                            <Textarea
                              value={answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              placeholder="Your answer"
                              rows={4}
                              className="border-slate-200 bg-white"
                            />
                          )}

                          {question.type === 'number' && (
                            <Input
                              type="number"
                              value={answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              placeholder="Your answer"
                              className="h-11 border-slate-200 bg-white"
                            />
                          )}

                          {question.type === 'email' && (
                            <Input
                              type="email"
                              value={answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              placeholder="Your answer"
                              className="h-11 border-slate-200 bg-white"
                            />
                          )}

                          {question.type === 'date' && (
                            <Input
                              type="date"
                              value={answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              className="h-11 border-slate-200 bg-white"
                            />
                          )}

                          {/* Radio/Checkbox Options */}
                          {(question.type === 'radio' || question.type === 'checkbox') && question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, optIdx) => {
                                const isSelected = question.type === 'checkbox' 
                                  ? (answers[question.id] || []).includes(option)
                                  : answers[question.id] === option;
                                
                                return (
                                  <label
                                    key={optIdx}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                      isSelected 
                                        ? 'border-[#025864] bg-[#025864]/5' 
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                                    }`}
                                  >
                                    {question.type === 'radio' ? (
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        isSelected ? 'border-[#025864]' : 'border-slate-300'
                                      }`}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#025864]" />}
                                      </div>
                                    ) : (
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        isSelected ? 'bg-[#025864] border-[#025864]' : 'border-slate-300'
                                      }`}>
                                        {isSelected && (
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                    )}
                                    <input
                                      type={question.type}
                                      className="sr-only"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (question.type === 'checkbox') {
                                          const current = answers[question.id] || [];
                                          if (e.target.checked) {
                                            handleAnswerChange(question.id, [...current, option]);
                                          } else {
                                            handleAnswerChange(question.id, current.filter((o: string) => o !== option));
                                          }
                                        } else {
                                          handleAnswerChange(question.id, option);
                                        }
                                      }}
                                    />
                                    <span className="text-slate-700">{option}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* Select Dropdown */}
                          {question.type === 'select' && (
                            <div className="relative">
                              <select
                                value={answers[question.id] || ''}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-full h-11 rounded-lg border border-slate-200 bg-white px-4 pr-10 text-slate-700 appearance-none"
                              >
                                <option value="">Select an option</option>
                                {question.options?.map((option, optIdx) => (
                                  <option key={optIdx} value={option}>{option}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              form="preview-form"
              className="h-12 px-8 text-base bg-gradient-to-r from-[#025864] to-[#038a9c] hover:from-[#025864]/90 hover:to-[#038a9c]/90 text-white rounded-full shadow-md"
            >
              Submit Response
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              Never submit passwords through RippliFy Forms.
            </p>
          </div>

          {/* Powered by */}
          {form.theme?.showPoweredBy && (
            <div className="text-center">
              <p className="text-xs text-slate-400">
                Powered by <span style={{ color: theme.color }}>Sokostack</span>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FormPreview;