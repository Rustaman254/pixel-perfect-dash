import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, ChevronLeft, Link, Check } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  type: string;
  question: string;
  required: boolean;
  options?: string[];
  description?: string;
  imageUrl?: string;
}

interface Form {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  settings: any;
  theme: any;
  slug: string;
  email?: string;
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
  const [inputFocused, setInputFocused] = useState<Record<string, boolean>>({});

  const [screen, setScreen] = useState<"welcome" | "questions" | "thankyou">("welcome");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const themeColor = form?.theme?.color || '#025864';

  useEffect(() => {
    fetchForm();
  }, [formId]);

  useEffect(() => {
    if (screen === "questions" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, screen]);

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

  const handleStart = () => {
    setScreen("questions");
    setCurrentIndex(0);
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const goToNextQuestion = useCallback(() => {
    if (!form) return;
    const currentQ = form.questions[currentIndex];
    
    if (currentQ.required && !answers[currentQ.id] && currentQ.type !== 'checkbox') {
      toast.error('This question is required');
      return;
    }

    if (currentIndex < form.questions.length - 1) {
      setDirection("forward");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      handleSubmit();
    }
  }, [form, currentIndex, answers]);

  const goToPrevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setDirection("backward");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const currentQ = form?.questions[currentIndex];
      if (currentQ?.type === 'text' || currentQ?.type === 'textarea' || currentQ?.type === 'email' || currentQ?.type === 'number') {
        if (answers[currentQ.id]) {
          goToNextQuestion();
        }
      }
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      const currentQ = form?.questions[currentIndex];
      if (currentQ?.type === 'radio' || currentQ?.type === 'select') {
        goToNextQuestion();
      }
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      goToPrevQuestion();
    }
  };

  const handleOptionSelect = (option: string) => {
    const currentQ = form?.questions[currentIndex];
    if (!currentQ) return;

    if (currentQ.type === 'radio' || currentQ.type === 'select') {
      handleAnswerChange(currentQ.id, option);
      setTimeout(() => goToNextQuestion(), 300);
    } else if (currentQ.type === 'checkbox') {
      const current = answers[currentQ.id] || [];
      if (current.includes(option)) {
        handleAnswerChange(currentQ.id, current.filter((o: string) => o !== option));
      } else {
        handleAnswerChange(currentQ.id, [...current, option]);
      }
    }
  };

  const handleSubmit = async () => {
    if (form?.settings?.collectEmail && !email) {
      toast.error('Please enter your email');
      return;
    }

    for (const question of form?.questions || []) {
      if (question.required && !answers[question.id] && question.type !== 'checkbox') {
        toast.error(`Please answer: ${question.question}`);
        return;
      }
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 500);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/f/${form?.slug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const progress = form ? ((currentIndex + 1) / form.questions.length) * 100 : 0;
  const currentQ = form?.questions[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColor + '08' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: themeColor }} />
          <p className="text-slate-500">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColor + '08' }}>
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Form not found</h2>
          <Button onClick={() => navigate('/forms')}>Back to Forms</Button>
        </div>
      </div>
    );
  }

  if (screen === "welcome") {
    return (
      <>
        <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="w-full max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/forms/edit/${formId}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <span className="text-sm font-medium text-slate-600">Preview mode</span>
            </div>
            <button
              onClick={copyLink}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
            >
              {linkCopied ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Link className="w-4 h-4" /> Copy link
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: themeColor + '08' }}>
          <div className="w-full max-w-2xl text-center">
            {form.questions[0]?.imageUrl && (
              <img 
                src={form.questions[0].imageUrl} 
                alt="" 
                className="w-full max-h-64 object-cover rounded-lg mb-6 mx-auto"
              />
            )}
            <h1 className="text-4xl md:text-5xl font-light text-slate-900 mb-4">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
                {form.description}
              </p>
            )}
            
            {form.settings?.collectEmail && (
              <div className="max-w-sm mx-auto mb-8">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-2 py-3 text-xl border-b-2 border-slate-300 focus:outline-none focus:border-transparent transition-colors bg-transparent"
                  style={{ borderColor: email ? themeColor : undefined }}
                />
              </div>
            )}

            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: themeColor }}
            >
              Start <ChevronRight className="w-5 h-5" />
            </button>

            <p className="text-sm text-slate-400 mt-8">
              {form.questions.length} questions • Estimated time: {Math.ceil(form.questions.length / 3)} min
            </p>
          </div>
        </div>
      </>
    );
  }

  if (screen === "thankyou") {
    return (
      <>
        <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="w-full max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/forms/edit/${formId}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <span className="text-sm font-medium text-slate-600">Preview mode</span>
            </div>
          </div>
        </div>

        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: themeColor + '08' }}>
          <div className="w-full max-w-xl text-center">
            <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
              <svg className="w-12 h-12" style={{ color: themeColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-light text-slate-900 mb-4">Thank you!</h1>
            <p className="text-lg text-slate-600 mb-8">Your responses have been recorded.</p>

            <button
              onClick={() => { setScreen("welcome"); setCurrentIndex(0); setAnswers({}); }}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Submit another response
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="w-full max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/forms/edit/${formId}`)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <span className="text-sm font-medium text-slate-600">Preview mode</span>
          </div>
        </div>
      </div>

      <div 
        className="min-h-screen flex flex-col" 
        style={{ backgroundColor: themeColor + '08' }}
        onKeyDown={handleKeyDown}
      >
        <div className="w-full max-w-2xl mx-auto pt-8 pb-24 px-6 flex-1 flex flex-col">
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>Question {currentIndex + 1} of {form.questions.length}</span>
              <span className="w-24 text-right">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%`, backgroundColor: themeColor }} 
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div 
              className={`w-full transition-all duration-500 ease-out ${
                isTransitioning 
                  ? direction === 'forward' 
                    ? '-translate-y-8 opacity-0' 
                    : 'translate-y-8 opacity-0'
                  : 'translate-y-0 opacity-100'
              }`}
            >
              <div className="text-center w-full">
                {currentQ?.imageUrl && (
                  <div className="mb-6">
                    <img src={currentQ.imageUrl} alt="" className="max-h-48 mx-auto rounded-lg object-contain" />
                  </div>
                )}

                <div className="text-left max-w-2xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-2">
                    {currentQ?.question}
                  </h2>
                  {currentQ?.description && (
                    <p className="text-slate-500 mb-6">{currentQ.description}</p>
                  )}
                  {currentQ?.required && (
                    <p className="text-xs text-slate-400 mb-6">Required</p>
                  )}
                </div>

                <div className="mt-8 max-w-2xl mx-auto text-left" onClick={() => inputRef.current?.focus()}>
                  {currentQ?.type === 'text' && (
                    <input
                      ref={inputRef as any}
                      type="text"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      onFocus={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: true }))}
                      onBlur={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: false }))}
                      className="w-full px-2 py-3 text-2xl border-b-2 border-slate-300 focus:outline-none focus:border-transparent transition-colors bg-transparent"
                      style={{ borderColor: inputFocused[currentQ.id] || answers[currentQ.id] ? themeColor : undefined }}
                      placeholder="Your answer"
                      autoFocus
                    />
                  )}

                  {currentQ?.type === 'textarea' && (
                    <textarea
                      ref={inputRef as any}
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      onFocus={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: true }))}
                      onBlur={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: false }))}
                      className="w-full px-2 py-3 text-xl border-b-2 border-slate-300 focus:outline-none focus:border-transparent transition-colors bg-transparent min-h-[120px]"
                      style={{ borderColor: inputFocused[currentQ.id] || answers[currentQ.id] ? themeColor : undefined }}
                      placeholder="Your answer"
                      autoFocus
                    />
                  )}

                  {currentQ?.type === 'email' && (
                    <input
                      ref={inputRef as any}
                      type="email"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      onFocus={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: true }))}
                      onBlur={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: false }))}
                      className="w-full px-2 py-3 text-2xl border-b-2 border-slate-300 focus:outline-none focus:border-transparent transition-colors bg-transparent"
                      style={{ borderColor: inputFocused[currentQ.id] || answers[currentQ.id] ? themeColor : undefined }}
                      placeholder="your@email.com"
                      autoFocus
                    />
                  )}

                  {currentQ?.type === 'number' && (
                    <input
                      ref={inputRef as any}
                      type="number"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      onFocus={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: true }))}
                      onBlur={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: false }))}
                      className="w-full px-2 py-3 text-2xl border-b-2 border-slate-300 focus:outline-none focus:border-transparent transition-colors bg-transparent"
                      style={{ borderColor: inputFocused[currentQ.id] || answers[currentQ.id] ? themeColor : undefined }}
                      placeholder="0"
                      autoFocus
                    />
                  )}

                  {currentQ?.type === 'date' && (
                    <input
                      ref={inputRef as any}
                      type="date"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      onFocus={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: true }))}
                      onBlur={() => setInputFocused(prev => ({ ...prev, [currentQ.id]: false }))}
                      className="w-full px-2 py-3 text-xl border-b-2 border-slate-300 focus:outline-none focus:border-transparent transition-colors bg-transparent"
                      style={{ borderColor: inputFocused[currentQ.id] || answers[currentQ.id] ? themeColor : undefined }}
                      autoFocus
                    />
                  )}

                  {(currentQ?.type === 'radio' || currentQ?.type === 'select') && currentQ.options && (
                    <div className="space-y-3 max-w-2xl">
                      {currentQ.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionSelect(option)}
                          className={`w-full px-6 py-4 text-lg rounded-lg border-2 transition-all text-left ${
                            answers[currentQ.id] === option
                              ? 'border-transparent text-white'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                          style={answers[currentQ.id] === option ? { backgroundColor: themeColor } : {}}
                        >
                          {option}
                          {answers[currentQ.id] === option && (
                            <span className="float-right">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQ?.type === 'checkbox' && currentQ.options && (
                    <div className="space-y-3 max-w-2xl">
                      {currentQ.options.map((option, idx) => {
                        const isChecked = (answers[currentQ.id] || []).includes(option);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleOptionSelect(option)}
                            className={`w-full px-6 py-4 text-lg rounded-lg border-2 transition-all text-left flex items-center gap-4 ${
                              isChecked ? 'border-transparent text-white' : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                            style={isChecked ? { backgroundColor: themeColor } : {}}
                          >
                            <span className={`w-6 h-6 rounded border-2 flex items-center justify-center ${isChecked ? 'border-white' : 'border-slate-300'}`}>
                              {isChecked && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {((currentQ?.type === 'text' || currentQ?.type === 'textarea' || currentQ?.type === 'email' || currentQ?.type === 'number' || currentQ?.type === 'date') && answers[currentQ?.id]) && (
                  <button
                    onClick={goToNextQuestion}
                    className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: themeColor, color: 'white' }}
                  >
                    OK <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <button
              onClick={goToPrevQuestion}
              disabled={currentIndex === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={goToNextQuestion}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-white transition-all hover:scale-105"
              style={{ backgroundColor: themeColor }}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentIndex === form.questions.length - 1 ? (
                <>Submit</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FormPreview;