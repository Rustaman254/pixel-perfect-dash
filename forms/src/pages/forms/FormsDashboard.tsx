import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, 
  FileText, 
  Copy, 
  BarChart3, 
  Settings, 
  Trash2, 
  Edit, 
  Eye,
  MoreVertical,
  Search,
  LogOut,
  Loader2,
  QrCode,
  ExternalLink,
  List,
  LayoutGrid
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import AIAssistant from "@/components/ai/AIAssistant";

interface Form {
  id: number;
  title: string;
  description: string;
  slug: string;
  questions: any[];
  settings: any;
  theme?: { view: string; color: string };
  responses: number;
  createdAt: string;
  updatedAt: string;
}

const FormsDashboard = () => {
  const { userProfile, logout } = useAppContext();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormCreated = (formId: number, formSlug: string) => {
    setRefreshKey((prev) => prev + 1);
    fetchForms();
    setTimeout(() => {
      navigate(`/forms/edit/${formId}`);
    }, 500);
  };

  useEffect(() => {
    fetchForms();
    
    // Listen for AI form creation to refresh
    const handleAIFormCreated = () => {
      fetchForms();
      toast.success("Form created by AI assistant");
    };
    window.addEventListener('ai-form-created', handleAIFormCreated);
    return () => window.removeEventListener('ai-form-created', handleAIFormCreated);
  }, [refreshKey]);

  const fetchForms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/forms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setForms(data.forms || data);
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId: number) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) return;
    
    setDeleteLoading(formId);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setForms(forms.filter(f => f.id !== formId));
        toast.success('Form deleted successfully');
      } else {
        toast.error('Failed to delete form');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete form');
    } finally {
      setDeleteLoading(null);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const openShareDialog = (form: Form) => {
    setSelectedForm(form);
    setShareDialogOpen(true);
  };

  const getFormUrl = (slug: string) => {
    return `${window.location.origin}/f/${slug}`;
  };

  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-[#025864]">Sokostack Forms</h1>
              <span className="text-sm text-slate-500">|</span>
              <span className="text-sm text-slate-600">Welcome, {userProfile?.fullName || userProfile?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => navigate('/forms/new')}
                className="bg-[#025864] hover:bg-[#025864]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Form
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Empty State */}
        {forms.length === 0 && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No forms yet</h3>
              <p className="text-slate-500 text-center mb-6">
                Create your first form to start collecting responses
              </p>
              <Button 
                onClick={() => navigate('/forms/new')}
                className="bg-[#025864] hover:bg-[#025864]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first form
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Forms Grid */}
        {filteredForms.length > 0 && (
          viewMode === 'card' ? (
            <div className="space-y-4">
              {filteredForms.map((form) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0" onClick={() => navigate(`/forms/edit/${form.id}`)}>
                        <h3 className="text-lg font-semibold truncate">{form.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1">{form.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-slate-500">{form.responses || 0} responses</span>
                        <Button variant="outline" size="sm" onClick={() => openShareDialog(form)}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/forms/edit/${form.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{form.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {form.description || 'No description'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/forms/edit/${form.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLink(form.slug)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/forms/responses/${form.id}`)}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Responses
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteForm(form.id)}
                          className="text-red-600"
                          disabled={deleteLoading === form.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteLoading === form.id ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{form.responses || 0} responses</span>
                    </div>
                    <span>{formatDate(form.updatedAt || form.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => copyLink(form.slug)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/forms/edit/${form.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openShareDialog(form)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )
        )}
      </main>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Form</DialogTitle>
            <DialogDescription>
              Share your form with others using the link below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Form Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={selectedForm ? getFormUrl(selectedForm.slug) : ''} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  onClick={() => selectedForm && copyLink(selectedForm.slug)}
                  size="icon"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1 bg-[#025864]"
                onClick={() => selectedForm && window.open(getFormUrl(selectedForm.slug), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Form
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => selectedForm && copyLink(selectedForm.slug)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-slate-500">Or share this QR code:</p>
              <div className="mt-2 p-4 bg-white inline-block rounded-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedForm ? encodeURIComponent(getFormUrl(selectedForm.slug)) : ''}`}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIAssistant service="forms" productName="Forms" />
    </div>
  );
};

export default FormsDashboard;