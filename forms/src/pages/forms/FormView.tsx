import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle, HelpCircle, Link, X } from "lucide-react";
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
  theme?: {
    color: string;
    showPoweredBy: boolean;
  };
  slug?: string;
  email?: string;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const lightenColor = (hex: string, percent: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#f5f3ff';
  const amount = Math.round(2.55 * percent);
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);
  return `rgb(${r}, ${g}, ${b})`;
};

const FormView = () => {
  const { slug } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const themeColor = form?.theme?.color || '#025864';
  const logoColor = form?.theme?.color || '#025864';
  const themeLight = lightenColor(themeColor, 90);
  const themeBg = lightenColor(themeColor, 96);

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

  const copyLink = () => {
    const link = `${window.location.origin}/f/${form?.slug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const clearForm = () => {
    setAnswers({});
    setEmail("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Form not found</h2>
          <p className="text-slate-500">This form may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const theme = form?.theme || { color: '#025864', showPoweredBy: true };
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
<div className="w-full max-w-[640px] mx-auto px-4 py-8" style={{ backgroundColor: 'transparent' }}>
          <div className="bg-white rounded-lg shadow-sm text-center p-8">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${theme.color}15` }}>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-normal text-slate-900 mb-2" dir="auto">Thank you!</h2>
            <p className="text-base text-slate-600 mb-6" dir="auto">Your response has been recorded.</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Submit another response
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Never submit passwords through RippliFy Forms.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const theme = form?.theme || { color: '#025864', showPoweredBy: true };
  const hasRequiredQuestion = form.questions?.some(q => q.required);

  const renderQuestion = (question: Question, index: number) => {
    const isSelected = (value: any) => value;

    return (
      <div className="Qr7Oae" role="listitem">
        <div className="geS5n" style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '8px', 
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          marginBottom: '16px',
          padding: '24px'
        }}>
          <div className="z12JJ">
            <div className="M4DNQ">
              <div id={`q-${question.id}`} className="HoXoMd D1wxyf RjsPE" role="heading" aria-level={3 as any}>
                <span className="M7eMe">
                  {question.question}
                  {question.required && (
                    <span className="vnumgf" id={`req-${question.id}`} aria-label="Required question">
                      {' '}
                      <span className="text-red-500">*</span>
                    </span>
                  )}
                </span>
              </div>
              <div className="gubaDc OIC90c RjsPE" id={`desc-${question.id}`}></div>
            </div>
          </div>

          <div className="AgroKb">
            {question.type === 'text' && (
              <div className="rFrNMe k3kHxc RdH0ib yqQS1 zKHdkd">
                <div className="aCsJod oJeWuf">
                  <div className="aXBtI Wic03c">
                    <div className="Xb9hP">
                      <input
                        type="text"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="whsOnd zHQkBf"
                        dir="auto"
                        required={question.required}
                      />
                      <div className="ndJi5d snByac">Your answer</div>
                    </div>
                    <div className="i9lrp mIZh1c"></div>
                    <div className="OabDMe cXrdqd"></div>
                  </div>
                </div>
                <div className="LXRPh">
                  <div className="ovnfwe Is7Fhb"></div>
                </div>
              </div>
            )}

            {question.type === 'textarea' && (
              <div className="rFrNMe k3kHxc RdH0ib yqQS1 zKHdkd">
                <div className="aCsJod oJeWuf">
                  <div className="F1pObe snByac">Your answer</div>
                  <div className="Pc9Gce Wic03c">
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="KHxj8b tL9Q4c"
                      dir="auto"
                      rows={3}
                      required={question.required}
                    />
                  </div>
                  <div className="z0oSpf mIZh1c"></div>
                  <div className="Bfurwb cXrdqd"></div>
                </div>
                <div className="jE8NUc">
                  <div className="YElZX Is7Fhb"></div>
                </div>
              </div>
            )}

            {question.type === 'number' && (
              <div className="rFrNMe k3kHxc RdH0ib yqQS1 zKHdkd">
                <div className="aCsJod oJeWuf">
                  <div className="aXBtI Wic03c">
                    <div className="Xb9hP">
                      <input
                        type="number"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="whsOnd zHQkBf"
                        dir="auto"
                        required={question.required}
                      />
                      <div className="ndJi5d snByac">Your answer</div>
                    </div>
                    <div className="i9lrp mIZh1c"></div>
                  </div>
                </div>
              </div>
            )}

            {question.type === 'email' && (
              <div className="rFrNMe k3kHxc RdH0ib yqQS1 zKHdkd">
                <div className="aCsJod oJeWuf">
                  <div className="aXBtI Wic03c">
                    <div className="Xb9hP">
                      <input
                        type="email"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="whsOnd zHQkBf"
                        dir="auto"
                        required={question.required}
                      />
                      <div className="ndJi5d snByac">your@email.com</div>
                    </div>
                    <div className="i9lrp mIZh1c"></div>
                  </div>
                </div>
              </div>
            )}

            {question.type === 'date' && (
              <div className="rFrNMe k3kHxc RdH0ib yqQS1 zKHdkd">
                <div className="aCsJod oJeWuf">
                  <div className="aXBtI Wic03c">
                    <div className="Xb9hP">
                      <input
                        type="date"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="whsOnd zHQkBf"
                        dir="auto"
                        required={question.required}
                      />
                    </div>
                    <div className="i9lrp mIZh1c"></div>
                  </div>
                </div>
              </div>
            )}

            {question.type === 'checkbox' && question.options && (
              <div className="lLfZXe fnxRtf cNDBpf">
                {question.options.map((option, optIdx) => {
                  const isChecked = (answers[question.id] || []).includes(option);
                  return (
                    <div key={optIdx} className="nWQGrd zwllIb">
                      <label className="docssharedWizToggleLabeledContainer ajBQVb">
                        <div className="bzfPab wFGF8">
                          <div className="d7L4fc bJNwt FXLARc aomaEc ECvBRb">
                            <div
                              className={`Od2TWd hYsg7c ${isChecked ? 'OJUttb' : ''}`}
                              style={isChecked ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                            >
                              <div className="x0k1lc MbhUzd"></div>
                              <div className="uyywbd"></div>
                              <div className="vd3tt">
                                <div className="AB7Lab Id5V1">
                                  {isChecked && (
                                    <div className="rseUEf nQOrEb">
                                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white">
                                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="YEVVod">
                            <div className="ulDsOb">
                              <span dir="auto" className="aDTYNe snByac OvPDhc OIC90c">{option}</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = answers[question.id] || [];
                            if (e.target.checked) {
                              handleAnswerChange(question.id, [...current, option]);
                            } else {
                              handleAnswerChange(question.id, current.filter((o: string) => o !== option));
                            }
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            {question.type === 'radio' && question.options && (
              <div className="lLfZXe fnxRtf cNDBpf">
                {question.options.map((option, optIdx) => {
                  const isSelected = answers[question.id] === option;
                  return (
                    <div key={optIdx} className="nWQGrd zwllIb">
                      <label className="docssharedWizToggleLabeledContainer ajBQVb">
                        <div className="bzfPab wFGF8">
                          <div className="d7L4fc bJNwt FXLARc aomaEc ECvBRb">
                            <div
                              className={`Od2TWd hYsg7c`}
                              style={isSelected ? { borderColor: themeColor } : {}}
                            >
                              <div className="x0k1lc MbhUzd"></div>
                              <div className="uyywbd"></div>
                              <div className="vd3tt">
                                <div className="AB7Lab Id5V1">
                                  {isSelected && (
                                    <div className="rseUEf nQOrEb">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="YEVVod">
                            <div className="ulDsOb">
                              <span dir="auto" className="aDTYNe snByac OvPDhc OIC90c">{option}</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name={question.id}
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => handleAnswerChange(question.id, option)}
                        />
                      </label>
                    </div>
                  );
                })}
                {answers[question.id] && (
                  <div className="Jwtjdfe">
                    <div className="dMALK bQXwDc">
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(question.id, '')}
                        className="uArJ5e UQuaGc kCyAyd"
                      >
                        <span className="NPEfkd RveJvd snByac">Clear selection</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {question.type === 'select' && question.options && (
              <div className="oyXaNc" style={{ position: 'relative' }}>
                <select
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full h-11 px-3 py-2 text-sm appearance-none"
                  style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dadce0',
                    color: '#202124',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                  required={question.required}
                >
                  <option value="">Select an option</option>
                  {question.options.map((option, optIdx) => (
                    <option key={optIdx} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Image preview for questions with image */}
            {question.imageUrl && (
              <div className="y6GzNb mt-2" style={{ width: '284px' }}>
                <img src={question.imageUrl} className="HxhGpf" style={{ width: '284px' }} alt="" />
              </div>
            )}
          </div>

          <div className="SL4Sz" role="alert"></div>
        </div>
      </div>
    );
  };

  const containerBg = themeBg;

  return (
    <div className="min-h-screen" style={{ backgroundColor: containerBg }}>
      <div className="w-full max-w-[640px] mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} id="mG61Hd" className="DqBBlb">
          <div className="mb-6">
            <div className="N0gd6">
              <div className="ahS2Le">
                <div className="F9yp7e ikZYwf LgNcQe" dir="auto" role="heading" aria-level={1 as any}>
                  <h1 className="text-[1.5rem] font-normal text-slate-900">{form.title}</h1>
                </div>
                {form.description && (
                  <div className="cBGGJ OIC90c text-base text-slate-600 mt-2" dir="auto">
                    {form.description}
                  </div>
                )}
              </div>
              <div className="F0H8Yc"></div>
            </div>

            {/* Email collector */}
            {form.settings?.collectEmail && (
              <div className="Oh1Vtf mt-4 p-3 bg-white border border-slate-200 rounded">
                <div className="ut7aeb">
                  <div className="eAQI0e flex items-center gap-2">
                    <span className="text-sm text-slate-900">{form.email || email || 'your@email.com'}</span>
                    <a href="#" className="text-xs text-blue-700 hover:underline">Switch account</a>
                  </div>
                </div>
                <div className="ut7aeb KA8vlc flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500" role="img" aria-label="Your email and Google account are not part of your response">
                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">Not shared</span>
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-11 px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-500 mt-2"
                  required
                />
              </div>
            )}

            {hasRequiredQuestion && (
              <div className="md0UAd text-sm text-slate-500 mt-4" dir="auto">
                * Indicates required question
              </div>
            )}
          </div>

          <div className="o3Dpx" role="list">
            {form.questions?.map((question, index) => (
              <div key={question.id}>
                {renderQuestion(question, index)}
              </div>
            ))}
          </div>

          <div className="ThHDze pt-6 flex items-center gap-3">
            <Button
              type="submit"
              className="uArJ5e UQuaGc Y5sE8d VkkpIf QvWxOd h-10 px-6 text-sm font-medium"
              disabled={submitting}
              style={{ backgroundColor: themeColor }}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              className="uArJ5e UQuaGc kCyAyd l3F1ye TFBnVe h-10 px-6 text-sm font-medium"
            >
              Clear form
            </Button>
          </div>

          <div className="T2dutf text-xs text-slate-500 py-2">
            Never submit passwords through Sokostack Forms.
          </div>
        </form>

        

        {theme.showPoweredBy && (
          <div className="I3zNcc yF4pU pt-3 flex items-center gap-1">
            <span className="text-xs text-slate-500">Powered by</span>
            <svg width={25} height={18} viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative -top-px">
              <path d="M0 7.5H28.8C31.3202 7.5 32.5804 7.5 33.543 7.99047C34.3897 8.4219 35.0781 9.11031 35.5095 9.95704C36 10.9196 36 12.1798 36 14.7V16.5H7.2C4.67976 16.5 3.41965 16.5 2.45704 16.0095C1.61031 15.5781 0.921901 14.8897 0.490471 14.043C0 13.0804 0 11.8202 0 9.3V7.5Z" fill={logoColor}/>
              <path d="M0 28.5H28.8C31.3202 28.5 32.5804 28.5 33.543 28.0095C34.3897 27.5781 35.0781 26.8897 35.5095 26.043C36 25.0804 36 23.8202 36 21.3V19.5H7.2C4.67976 19.5 3.41965 19.5 2.45704 19.9905C1.61031 20.4219 0.921901 21.1103 0.490471 21.957C0 22.9196 0 24.1798 0 26.7V28.5Z" fill={logoColor}/>
              <path d="M14 31.5H28.8C31.3202 31.5 32.5804 31.5 33.543 31.9905C34.3897 32.4219 35.0781 33.1103 35.5095 33.957C36 34.9196 36 36.1798 36 38.7V40.5H21.2C18.6798 40.5 17.4196 40.5 16.457 40.0095C15.6103 39.5781 14.9219 38.8897 14.4905 38.043C14 37.0804 14 35.8202 14 33.3V31.5Z" fill={logoColor}/>
            </svg>
            <span className="text-xs font-medium" style={{ color: logoColor }}>Sokostack</span>
          </div>
        )}
      </div>

      {/* Help button */}
      <div className="fixed bottom-4 right-4">
        <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50">
          <HelpCircle className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>
  );
};

export default FormView;