import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store'
import { templates } from '@/data/templates'
import { ShoppingCart, ArrowLeft, Search, Loader2 } from 'lucide-react'

export default function GalleryPage() {
  const navigate = useNavigate();
  const { createProject } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(templates.map(t => t.category))];
    return cats.sort();
  }, []);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const handleSelect = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    setCreating(true);
    const project = await createProject(template);
    setCreating(false);
    if (project) {
      navigate(`/editor/${project.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold">Template Gallery</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          My Projects
        </Button>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Template</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pick from our professionally designed templates and start customizing your store.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(template => (
            <Card
              key={template.id}
              className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
              onClick={() => !creating && handleSelect(template.id)}
            >
              <div className="aspect-video overflow-hidden bg-muted relative">
                <img
                  src={template.image}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Button
                    className="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    size="sm"
                    disabled={creating}
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Use Template'}
                  </Button>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                </div>
                <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-1">
                  {[template.theme.primaryColor, template.theme.secondaryColor, template.theme.accentColor].map((c, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No templates found</p>
            <p className="text-sm">Try adjusting your search or filter</p>
          </div>
        )}
      </main>
    </div>
  );
}
