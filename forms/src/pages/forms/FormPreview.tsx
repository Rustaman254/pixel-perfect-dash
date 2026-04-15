import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X, Send, Link, Copy, Check, ChevronDown } from "lucide-react";
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

const FormPreview = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar - Google Forms Style */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
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
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-8">
          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-normal text-slate-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-slate-600 whitespace-pre-wrap">{form.description}</p>
            )}
          </div>

          {/* Required indicator */}
          <div className="text-sm text-slate-500 mb-8">
            <span className="text-red-500">*</span> Indicates required question
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email if collecting */}
            {form.settings?.collectEmail && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-base font-normal text-slate-900">
                    Email <span className="text-red-500">*</span>
                  </Label>
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your answer"
                  required
                  className="w-full h-12 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-0 bg-white"
                />
              </div>
            )}

            {/* Questions */}
            {form.questions?.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <div className="flex items-start gap-1">
                  <Label className="text-base font-normal text-slate-900">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>
                {question.description && (
                  <p className="text-sm text-slate-500">{question.description}</p>
                )}

                {/* Short Answer */}
                {question.type === 'text' && (
                  <Input
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                    required={question.required}
                    className="w-full h-12 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-0 bg-white"
                  />
                )}

                {/* Paragraph */}
                {question.type === 'textarea' && (
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                    required={question.required}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-0 bg-white resize-none"
                  />
                )}

                {/* Number */}
                {question.type === 'number' && (
                  <Input
                    type="number"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                    required={question.required}
                    className="w-full h-12 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-0 bg-white"
                  />
                )}

                {/* Email */}
                {question.type === 'email' && (
                  <Input
                    type="email"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                    required={question.required}
                    className="w-full h-12 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-0 bg-white"
                  />
                )}

                {/* Date */}
                {question.type === 'date' && (
                  <Input
                    type="date"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                    className="w-full h-12 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-0 bg-white"
                  />
                )}

                {/* Multiple Choice */}
                {question.type === 'radio' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optIdx) => {
                      const isSelected = answers[question.id] === option;
                      return (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-slate-500 bg-slate-50' 
                              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-slate-600' : 'border-slate-400'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />}
                          </div>
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(question.id, option)}
                            className="sr-only"
                          />
                          <span className="text-slate-700">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Checkbox */}
                {question.type === 'checkbox' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optIdx) => {
                      const isChecked = (answers[question.id] || []).includes(option);
                      return (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                            isChecked 
                              ? 'border-slate-500 bg-slate-50' 
                              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isChecked 
                              ? 'bg-slate-600 border-slate-600' 
                              : 'border-slate-400'
                          }`}>
                            {isChecked && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            value={option}
                            checked={isChecked}
                            onChange={(e) => {
                              const current = answers[question.id] || [];
                              if (e.target.checked) {
                                handleAnswerChange(question.id, [...current, option]);
                              } else {
                                handleAnswerChange(question.id, current.filter((o: string) => o !== option));
                              }
                            }}
                            className="sr-only"
                          />
                          <span className="text-slate-700">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown */}
                {question.type === 'select' && question.options && (
                  <div className="relative">
                    <select
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required}
                      className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 pr-10 text-slate-700 appearance-none focus:border-slate-500 focus:ring-0"
                    >
                      <option value="">Select an option</option>
                      {question.options.map((option, optIdx) => (
                        <option key={optIdx} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  </div>
                )}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="h-10 px-6 text-base bg-slate-900 hover:bg-slate-800 text-white rounded-full"
              >
                Submit Response
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Never submit passwords through RippliFy Forms.
            </p>
          </div>
        </div>

        {/* Powered by */}
        {form.theme?.showPoweredBy && (
          <div className="text-center mt-4">
            <p className="text-xs text-slate-400">
              Powered by <span style={{ color: theme.color }}>Sokostack</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormPreview;