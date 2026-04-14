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

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">{form.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {form.settings?.showProgressBar && (
              <div className="mb-6">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#025864] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1 text-right">{Math.round(progress)}% complete</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {form.settings?.collectEmail && (
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              )}

              {form.questions?.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-base">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {question.description && (
                    <p className="text-sm text-slate-500">{question.description}</p>
                  )}

                  {question.type === 'text' && (
                    <Input
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Your answer"
                    />
                  )}

                  {question.type === 'textarea' && (
                    <Textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Your answer"
                      rows={4}
                    />
                  )}

                  {question.type === 'number' && (
                    <Input
                      type="number"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Your answer"
                    />
                  )}

                  {question.type === 'email' && (
                    <Input
                      type="email"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="your@email.com"
                    />
                  )}

                  {question.type === 'date' && (
                    <Input
                      type="date"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                  )}

                  {question.type === 'checkbox' && (
                    <div className="space-y-2">
                      {question.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            id={`${question.id}_${index}`}
                            checked={(answers[question.id] || []).includes(option)}
                            onCheckedChange={(checked) => {
                              const current = answers[question.id] || [];
                              if (checked) {
                                handleAnswerChange(question.id, [...current, option]);
                              } else {
                                handleAnswerChange(question.id, current.filter((o: string) => o !== option));
                              }
                            }}
                          />
                          <Label htmlFor={`${question.id}_${index}`}>{option}</Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'radio' && (
                    <RadioGroup
                      value={answers[question.id] || ''}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      {question.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <RadioGroupItem value={option} id={`${question.id}_${index}`} />
                          <Label htmlFor={`${question.id}_${index}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === 'select' && (
                    <Select
                      value={answers[question.id] || ''}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options?.map((option, index) => (
                          <SelectItem key={index} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              <Button 
                type="submit" 
                className="w-full bg-[#025864] hover:bg-[#025864]/90"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormView;