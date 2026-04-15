import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  Eye,
  Loader2,
  Type,
  List,
  CheckSquare,
  Circle,
  Calendar,
  AlignLeft,
  Hash
} from "lucide-react";
import { toast } from "sonner";

type QuestionType = 'text' | 'textarea' | 'number' | 'email' | 'date' | 'checkbox' | 'radio' | 'select';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  options?: string[];
  description?: string;
}

interface FormSettings {
  collectEmail: boolean;
  showProgressBar: boolean;
  shuffleQuestions: boolean;
  limitResponses: boolean;
  maxResponses?: number;
}

interface FormTheme {
  view: 'list' | 'chat' | 'card';
  color: string;
  showPoweredBy: boolean;
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

const FormBuilder = () => {
  const { userProfile } = useAppContext();
  const navigate = useNavigate();
  const { formId } = useParams();
  const isEditing = !!formId;

  const [title, setTitle] = useState('Untitled Form');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<FormSettings>({
    collectEmail: false,
    showProgressBar: true,
    shuffleQuestions: false,
    limitResponses: false,
  });
  const [theme, setTheme] = useState<FormTheme>({
    view: 'list',
    color: '#025864',
    showPoweredBy: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isEditing) {
      fetchForm();
    }
  }, [formId]);

  const fetchForm = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/forms/${formId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description || '');
        setQuestions(data.questions || []);
        setSettings(data.settings || {});
        setTheme(data.theme || { view: 'list', color: '#025864', showPoweredBy: true });
      }
    } catch (error) {
      console.error('Failed to fetch form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type,
      question: '',
      required: false,
      options: type === 'checkbox' || type === 'radio' || type === 'select' ? ['Option 1', 'Option 2'] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const saveForm = async () => {
    if (!title.trim()) {
      toast.error('Please enter a form title');
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = isEditing ? `/api/forms/${formId}` : '/api/forms';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          questions,
          settings,
          theme,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(isEditing ? 'Form updated!' : 'Form created!');
        navigate(`/forms/edit/${data.id || formId}`);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to save form');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const previewForm = () => {
    if (questions.length === 0) {
      toast.error('Add some questions first');
      return;
    }
    setPreviewAnswers({});
    setPreviewOpen(true);
  };

  const handlePreviewAnswerChange = (questionId: string, value: any) => {
    setPreviewAnswers({ ...previewAnswers, [questionId]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#025864]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/forms')}>
                ← Back
              </Button>
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold border-none outline-none bg-transparent focus:ring-0"
                  placeholder="Form title"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={previewForm}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={saveForm} 
                disabled={saving}
                className="bg-[#025864] hover:bg-[#025864]/90"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Details */}
            <Card>
              <CardHeader>
                <CardTitle>Form Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter form title"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this form is for"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No questions yet. Add a question from the panel on the right.
                  </div>
                )}

                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {questionTypes.find(t => t.type === question.type)?.label}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={question.required}
                              onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                            />
                            <Label className="text-sm">Required</Label>
                          </div>
                        </div>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                          placeholder="Enter your question"
                        />
                        <Input
                          value={question.description || ''}
                          onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                          placeholder="Help text (optional)"
                          className="text-sm"
                        />

                        {/* Options for multiple choice questions */}
                        {(question.type === 'checkbox' || question.type === 'radio' || question.type === 'select') && (
                          <div className="space-y-2">
                            <Label className="text-sm">Options</Label>
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                {question.type === 'radio' && <Circle className="h-4 w-4 text-slate-400" />}
                                {question.type === 'checkbox' && <div className="h-4 w-4 border rounded" />}
                                {question.type === 'select' && <span className="text-xs text-slate-400">↓</span>}
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(question.options || [])];
                                    newOptions[optIndex] = e.target.value;
                                    updateQuestion(question.id, { options: newOptions });
                                  }}
                                  placeholder={`Option ${optIndex + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const newOptions = question.options?.filter((_, i) => i !== optIndex);
                                    updateQuestion(question.id, { options: newOptions });
                                  }}
                                  disabled={(question.options?.length || 0) <= 2}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                                updateQuestion(question.id, { options: newOptions });
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Option
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            

            {/* Add Questions Manually */}
            <Card>
              <CardHeader>
                <CardTitle>Add Question Manually</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {questionTypes.map(({ type, label, icon: Icon }) => (
                    <Button
                      key={type}
                      variant="outline"
                      className="justify-start"
                      onClick={() => addQuestion(type as QuestionType)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Collect email</Label>
                  <Switch
                    checked={settings.collectEmail}
                    onCheckedChange={(checked) => setSettings({ ...settings, collectEmail: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show progress bar</Label>
                  <Switch
                    checked={settings.showProgressBar}
                    onCheckedChange={(checked) => setSettings({ ...settings, showProgressBar: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Shuffle questions</Label>
                  <Switch
                    checked={settings.shuffleQuestions}
                    onCheckedChange={(checked) => setSettings({ ...settings, shuffleQuestions: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Limit responses</Label>
                  <Switch
                    checked={settings.limitResponses}
                    onCheckedChange={(checked) => setSettings({ ...settings, limitResponses: checked })}
                  />
                </div>
                {settings.limitResponses && (
                  <div>
                    <Label>Max responses</Label>
                    <Input
                      type="number"
                      value={settings.maxResponses || ''}
                      onChange={(e) => setSettings({ ...settings, maxResponses: parseInt(e.target.value) })}
                      placeholder="100"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">View Style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'list', label: 'List' },
                      { value: 'chat', label: 'Chat' },
                      { value: 'card', label: 'Card' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={theme.view === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme({ ...theme, view: option.value as any })}
                        style={theme.view === option.value ? { backgroundColor: theme.color } : {}}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Theme Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={theme.color}
                      onChange={(e) => setTheme({ ...theme, color: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={theme.color}
                      onChange={(e) => setTheme({ ...theme, color: e.target.value })}
                      className="flex-1"
                      placeholder="#025864"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show "Powered by"</Label>
                  <Switch
                    checked={theme.showPoweredBy}
                    onCheckedChange={(checked) => setTheme({ ...theme, showPoweredBy: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title || 'Form Preview'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {description && <p className="text-slate-600">{description}</p>}
            
            {settings.collectEmail && (
              <div>
                <Label>Email *</Label>
                <Input type="email" placeholder="Enter your email" />
              </div>
            )}

            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label className="text-base">
                  {question.question || 'Untitled Question'}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {question.description && (
                  <p className="text-sm text-slate-500">{question.description}</p>
                )}

                {question.type === 'text' && (
                  <Input
                    value={previewAnswers[question.id] || ''}
                    onChange={(e) => handlePreviewAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                  />
                )}

                {question.type === 'textarea' && (
                  <Textarea
                    value={previewAnswers[question.id] || ''}
                    onChange={(e) => handlePreviewAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                    rows={3}
                  />
                )}

                {question.type === 'number' && (
                  <Input
                    type="number"
                    value={previewAnswers[question.id] || ''}
                    onChange={(e) => handlePreviewAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                  />
                )}

                {question.type === 'email' && (
                  <Input
                    type="email"
                    value={previewAnswers[question.id] || ''}
                    onChange={(e) => handlePreviewAnswerChange(question.id, e.target.value)}
                    placeholder="your@email.com"
                  />
                )}

                {question.type === 'date' && (
                  <Input
                    type="date"
                    value={previewAnswers[question.id] || ''}
                    onChange={(e) => handlePreviewAnswerChange(question.id, e.target.value)}
                  />
                )}

                {(question.type === 'checkbox' || question.type === 'radio' || question.type === 'select') && (
                  <div className="space-y-2">
                    {question.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type={question.type === 'checkbox' ? 'checkbox' : 'radio'}
                          name={question.id}
                          value={option}
                          checked={(previewAnswers[question.id] || []).includes(option) || previewAnswers[question.id] === option}
                          onChange={(e) => {
                            if (question.type === 'checkbox') {
                              const current = previewAnswers[question.id] || [];
                              if (e.target.checked) {
                                handlePreviewAnswerChange(question.id, [...current, option]);
                              } else {
                                handlePreviewAnswerChange(question.id, current.filter((o: string) => o !== option));
                              }
                            } else {
                              handlePreviewAnswerChange(question.id, option);
                            }
                          }}
                        />
                        <Label>{option}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Button className="w-full bg-[#025864]" onClick={() => toast.success('Preview saved!')}>
              Submit (Preview)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder;