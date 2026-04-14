import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, ArrowLeft, BarChart3 } from "lucide-react";
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
  questions: any[];
  responses: Response[];
}

const FormResponses = () => {
  const { userProfile } = useAppContext();
  const navigate = useNavigate();
  const { formId } = useParams();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/forms')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{form?.title}</h1>
                <p className="text-sm text-slate-500">{totalResponses} responses</p>
              </div>
            </div>
            <Button 
              onClick={exportCSV}
              disabled={totalResponses === 0}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#025864]/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#025864]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalResponses}</p>
                  <p className="text-sm text-slate-500">Total Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {totalResponses === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No responses yet. Share your form to start collecting responses.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {form?.settings?.collectEmail && (
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
                      )}
                      {form?.questions?.map((q: any) => (
                        <th key={q.id} className="text-left py-3 px-4 font-medium text-slate-600">
                          {q.question}
                        </th>
                      ))}
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form?.responses?.map((response) => (
                      <tr key={response.id} className="border-b hover:bg-slate-50">
                        {form?.settings?.collectEmail && (
                          <td className="py-3 px-4">{response.email || '-'}</td>
                        )}
                        {form?.questions?.map((q: any) => {
                          const answer = response.answers[q.id];
                          return (
                            <td key={q.id} className="py-3 px-4">
                              {Array.isArray(answer) ? answer.join(', ') : answer || '-'}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-slate-500 text-sm">
                          {new Date(response.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FormResponses;