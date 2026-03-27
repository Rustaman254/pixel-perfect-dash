import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LoginModal from '@/components/LoginModal'
import { ShoppingCart, Plus, Trash2, Pencil, Eye, LogOut, Clock } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projects, user, isLoggedIn, deleteProject, canCreateProject, logout } = useStore();
  const [showLogin, setShowLogin] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleNewProject = () => {
    if (!canCreateProject()) {
      setShowLogin(true);
      return;
    }
    navigate('/gallery');
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setDeleteConfirm(null);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold">Shopalize</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2">
                  {user?.avatar && <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />}
                  <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
                  <Badge variant="secondary" className="text-xs">{user?.provider}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-1" /> Sign Out
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowLogin(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLoggedIn ? 'Unlimited projects' : `${projects.length}/3 projects used`}
            </p>
          </div>
          <Button onClick={handleNewProject} disabled={!canCreateProject() && !isLoggedIn}>
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>

        {!isLoggedIn && projects.length >= 3 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="py-4 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-medium text-amber-900">Project limit reached</p>
                <p className="text-sm text-amber-700">Sign in to create unlimited projects and unlock publishing.</p>
              </div>
              <Button size="sm" onClick={() => setShowLogin(true)}>Sign In to Upgrade</Button>
            </CardContent>
          </Card>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">Create your first store to get started</p>
            <Button onClick={handleNewProject}>
              <Plus className="w-4 h-4 mr-2" /> Create Your First Store
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.sort((a, b) => b.updatedAt - a.updatedAt).map(project => (
              <Card key={project.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs mt-1">
                        <Clock className="w-3 h-3" /> {formatDate(project.updatedAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-1 mb-3">
                    {[project.theme.primaryColor, project.theme.secondaryColor, project.theme.accentColor].map((c, i) => (
                      <div key={i} className="w-3 h-3 rounded-full border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => navigate(`/editor/${project.id}`)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/preview/${project.id}`)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                    {deleteConfirm === project.id ? (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(project.id)}>
                        Confirm
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteConfirm(project.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <LoginModal open={showLogin} onOpenChange={setShowLogin} />
    </div>
  );
}
