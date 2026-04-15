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
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye,
  Loader2,
  Type,
  List,
  CheckSquare,
  Circle,
  Calendar,
  AlignLeft,
  Hash,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings,
  X,
  Pencil,
  Link,
  Send
} from "lucide-react";
import { toast } from "sonner";
import AIAssistant from "@/components/ai/AIAssistant";

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
  { type: 'text', label: 'Short Answer', icon: Type, desc: 'One line text response' },
  { type: 'textarea', label: 'Paragraph', icon: AlignLeft, desc: 'Multi-line text response' },
  { type: 'number', label: 'Number', icon: Hash, desc: 'Numeric input' },
  { type: 'email', label: 'Email', icon: List, desc: 'Email address input' },
  { type: 'date', label: 'Date', icon: Calendar, desc: 'Date picker' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, desc: 'Multiple selections' },
  { type: 'radio', label: 'Multiple Choice', icon: Circle, desc: 'Single selection' },
  { type: 'select', label: 'Dropdown', icon: List, desc: 'Dropdown selection' },
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
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [aiTrigger, setAiTrigger] = useState(0);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchForm();
    }
  }, [formId]);

  useEffect(() => {
    const handleAiFormUpdate = (e: CustomEvent) => {
      const formData = e.detail;
      if (formData) {
        if (formData.title) setTitle(formData.title);
        if (formData.description !== undefined) setDescription(formData.description);
        if (formData.questions) {
          setQuestions(formData.questions);
          setExpandedQuestions(new Set(formData.questions.map((q: Question) => q.id)));
        }
        toast.success("Form updated by AI Assistant!");
        setAiTrigger(prev => prev + 1);
      }
    };
    
    window.addEventListener('ai-form-updated', handleAiFormUpdate as any);
    return () => window.removeEventListener('ai-form-updated', handleAiFormUpdate as any);
  }, []);

  const handleFormUpdateFromAI = (form: any) => {
    if (form) {
      if (form.title) setTitle(form.title);
      if (form.description !== undefined) setDescription(form.description);
      if (form.questions) {
        setQuestions(form.questions);
        setExpandedQuestions(new Set(form.questions.map((q: Question) => q.id)));
      }
      setAiTrigger(prev => prev + 1);
    }
  };

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
        setExpandedQuestions(new Set(data.questions?.map((q: Question) => q.id) || []));
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
    setExpandedQuestions(prev => new Set([...prev, newQuestion.id]));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleQuestionExpand = (id: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
    navigate(`/forms/preview/${formId || 'new'}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#025864]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/forms')} className="text-slate-600 hover:text-[#025864] hover:bg-slate-100">
                ← Back
              </Button>
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#025864] to-[#038a9c] flex items-center justify-center">
                  <Type className="h-4 w-4 text-white" />
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold border-none outline-none bg-transparent focus:ring-0 text-slate-800 placeholder:text-slate-400 w-64"
                  placeholder="Form title"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={previewForm} className="h-9 w-9 p-0 text-slate-600 hover:text-[#025864] hover:bg-slate-100">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => setShowSettingsDialog(true)} className="h-9 w-9 p-0 text-slate-600 hover:text-[#025864] hover:bg-slate-100">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                onClick={saveForm} 
                disabled={saving}
                className="bg-gradient-to-r from-[#025864] to-[#038a9c] hover:from-[#025864]/90 hover:to-[#038a9c]/90 text-white shadow-md"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Form Builder */}
          <div className="lg:col-span-8 space-y-6">
            {/* Form Details Card */}
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter form title"
                    className="h-11 border-slate-200 focus:border-[#025864] focus:ring-[#025864]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this form is for"
                    rows={3}
                    className="border-slate-200 focus:border-[#025864] focus:ring-[#025864]/20 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#025864]"></div>
                  Questions ({questions.length})
                </h2>
              </div>

              {questions.length === 0 && (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Type className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No questions yet</h3>
                    <p className="text-slate-500 mb-4">Add your first question from the panel on the right</p>
                  </CardContent>
                </Card>
              )}

              {questions.map((question, index) => (
                <Card 
                  key={question.id} 
                  className={`border-slate-200/50 shadow-sm hover:shadow-md transition-all ${expandedQuestions.has(question.id) ? 'ring-1 ring-[#025864]/20' : ''}`}
                >
                  <CardContent className="p-0">
                    {/* Question Header */}
                    <div 
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => toggleQuestionExpand(question.id)}
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-slate-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveQuestion(index, 'up');
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-slate-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveQuestion(index, 'down');
                          }}
                          disabled={index === questions.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      
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

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.required}
                          onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-[#025864]"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(question.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedQuestions.has(question.id) && (
                      <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/30">
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                          placeholder="Enter your question"
                          className="h-10 border-slate-200 focus:border-[#025864] focus:ring-[#025864]/20 font-medium"
                        />
                        <Input
                          value={question.description || ''}
                          onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                          placeholder="Help text (optional) - shown below the question"
                          className="text-sm border-slate-200 focus:border-[#025864] focus:ring-[#025864]/20"
                        />

                        {/* Options for multiple choice questions */}
                        {(question.type === 'checkbox' || question.type === 'radio' || question.type === 'select') && (
                          <div className="space-y-3 pt-2">
                            <Label className="text-sm font-medium text-slate-700">Response Options</Label>
                            <div className="space-y-2">
                              {question.options?.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded flex items-center justify-center">
                                    {question.type === 'radio' && <Circle className="h-4 w-4 text-slate-300" />}
                                    {question.type === 'checkbox' && <div className="h-4 w-4 border-2 border-slate-300 rounded-sm" />}
                                    {question.type === 'select' && <List className="h-4 w-4 text-slate-300" />}
                                  </div>
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(question.options || [])];
                                      newOptions[optIndex] = e.target.value;
                                      updateQuestion(question.id, { options: newOptions });
                                    }}
                                    placeholder={`Option ${optIndex + 1}`}
                                    className="flex-1 h-9 border-slate-200 focus:border-[#025864] focus:ring-[#025864]/20"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => {
                                      const newOptions = question.options?.filter((_, i) => i !== optIndex);
                                      updateQuestion(question.id, { options: newOptions });
                                    }}
                                    disabled={(question.options?.length || 0) <= 2}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#025864] border-[#025864]/30 hover:bg-[#025864]/5"
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
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Add Questions */}
            <Card className="border-slate-200/50 shadow-sm hover:shadow-md transition-shadow sticky top-24">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#025864]"></div>
                  Add Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {questionTypes.map(({ type, label, icon: Icon, desc }) => (
                    <Button
                      key={type}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4 border-slate-200 hover:border-[#025864] hover:bg-[#025864]/5 transition-all text-left"
                      onClick={() => addQuestion(type as QuestionType)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#025864]/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-[#025864]" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{label}</p>
                          <p className="text-xs text-slate-500">{desc}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AIAssistant 
        productName="Forms" 
        formContext={{
          formId: isEditing ? parseInt(formId || '0') : undefined,
          title,
          description,
          questions
        }}
        onFormUpdated={handleFormUpdateFromAI}
      />

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings & Appearance
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#025864]"></div>
                Form Settings
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Collect email</Label>
                    <p className="text-xs text-slate-500">Require respondents to provide email</p>
                  </div>
                  <Switch
                    checked={settings.collectEmail}
                    onCheckedChange={(checked) => setSettings({ ...settings, collectEmail: checked })}
                    className="data-[state=checked]:bg-[#025864]"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Show progress bar</Label>
                    <p className="text-xs text-slate-500">Display completion progress</p>
                  </div>
                  <Switch
                    checked={settings.showProgressBar}
                    onCheckedChange={(checked) => setSettings({ ...settings, showProgressBar: checked })}
                    className="data-[state=checked]:bg-[#025864]"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Shuffle questions</Label>
                    <p className="text-xs text-slate-500">Randomize question order</p>
                  </div>
                  <Switch
                    checked={settings.shuffleQuestions}
                    onCheckedChange={(checked) => setSettings({ ...settings, shuffleQuestions: checked })}
                    className="data-[state=checked]:bg-[#025864]"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Limit responses</Label>
                    <p className="text-xs text-slate-500">Set maximum response count</p>
                  </div>
                  <Switch
                    checked={settings.limitResponses}
                    onCheckedChange={(checked) => setSettings({ ...settings, limitResponses: checked })}
                    className="data-[state=checked]:bg-[#025864]"
                  />
                </div>
                {settings.limitResponses && (
                  <div className="p-3 rounded-lg bg-slate-50/50 space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Max responses</Label>
                    <Input
                      type="number"
                      value={settings.maxResponses || ''}
                      onChange={(e) => setSettings({ ...settings, maxResponses: parseInt(e.target.value) })}
                      placeholder="100"
                      className="h-9 border-slate-200 focus:border-[#025864] focus:ring-[#025864]/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Appearance Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#025864]"></div>
                Appearance
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">Theme Color</Label>
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <input
                        type="color"
                        value={theme.color}
                        onChange={(e) => setTheme({ ...theme, color: e.target.value })}
                        className="w-12 h-12 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
                      />
                      <div 
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{ backgroundColor: theme.color, opacity: 0.1 }}
                      ></div>
                    </div>
                    <Input
                      value={theme.color}
                      onChange={(e) => setTheme({ ...theme, color: e.target.value })}
                      className="flex-1 h-12 border-slate-200 focus:border-[#025864] focus:ring-[#025864]/20 font-mono"
                      placeholder="#025864"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Show "Powered by"</Label>
                    <p className="text-xs text-slate-500">Display brand attribution</p>
                  </div>
                  <Switch
                    checked={theme.showPoweredBy}
                    onCheckedChange={(checked) => setTheme({ ...theme, showPoweredBy: checked })}
                    className="data-[state=checked]:bg-[#025864]"
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder;