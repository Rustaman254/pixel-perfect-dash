import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StorePreview from '@/components/StorePreview';
import { Loader2, Store } from 'lucide-react';
import type { Project } from '@/types';

function transformApiResponse(apiData: any): Project {
  const themeData = apiData.theme || {};
  const colors = themeData.colors || {};
  const fonts = themeData.fonts || {};

  const transformed: Project = {
    id: String(apiData.id),
    name: apiData.name,
    slug: apiData.slug || '',
    templateId: apiData.templateId || 'default',
    domain: apiData.domain,
    theme: {
      fontFamily: fonts.body || fonts.heading || themeData.fontFamily || 'Inter',
      primaryColor: colors.primary || themeData.primaryColor || '#000000',
      secondaryColor: colors.secondary || themeData.secondaryColor || '#666666',
      accentColor: colors.accent || themeData.accentColor || '#D4F655',
      backgroundColor: colors.background || themeData.backgroundColor || '#FFFFFF',
      textColor: colors.text || themeData.textColor || '#0A0A0A',
      isPublished: themeData.isPublished || false,
      logoUrl: themeData.logoUrl || undefined,
      borderRadius: themeData.borderRadius ?? 0,
      spacing: themeData.spacing || 'normal',
      animationStyle: themeData.animationStyle || 'none',
    },
    pages: (apiData.pages || []).map((page: any) => ({
      id: String(page.id),
      name: page.name,
      slug: page.slug,
      sections: (page.sections || []).map((section: any) => ({
        id: section.id || `section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: section.type || 'hero',
        props: section.settings || section.props || {},
        blocks: section.blocks || [],
        styleConfig: section.styleConfig || undefined,
      })),
    })),
    products: (apiData.products || []).map((p: any) => ({
      ...p,
      id: String(p.id),
      price: parseFloat(p.price) || 0,
      image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      images: p.images || [],
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return transformed;
}

export default function StoreViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStore() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/shopalize/store/${slug}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Store not found');
          throw new Error('Failed to load store');
        }
        const data = await res.json();
        const project = transformApiResponse(data);
        if (!project.pages || project.pages.length === 0) {
          project.pages = [{
            id: 'default-home',
            name: 'Home',
            slug: 'home',
            sections: [
              { id: 's1', type: 'header', props: { storeName: project.name, navLinks: ['Collections', 'New Arrivals', 'About', 'Contact'], showCart: true, sticky: false }, blocks: [] },
              { id: 's2', type: 'hero', props: { title: project.name, subtitle: 'Welcome to our store', cta: 'Shop Now' }, blocks: [] },
              { id: 's3', type: 'footer', props: { storeName: project.name, text: `© ${new Date().getFullYear()} ${project.name}`, links: [] }, blocks: [] },
            ],
          }];
        }
        setProject(project);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStore();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#0A0A0A] mb-4" />
          <p className="text-[14px] font-bold text-gray-500 uppercase tracking-widest">Entering Store...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Unavailable</h1>
          <p className="text-gray-600 mb-8">{error || "This store is either offline or doesn't exist."}</p>
          <a href="/" className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-all">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StorePreview project={project} interactive={true} />
    </div>
  );
}
