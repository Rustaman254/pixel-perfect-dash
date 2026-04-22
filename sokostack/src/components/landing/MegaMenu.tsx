import { Link } from "react-router-dom";
import {
  Mail, Users, BarChart3, MessageSquare, Calendar, FileText, Briefcase, ShoppingCart,
  CreditCard, Headphones, Layers, Cloud, Bot, Database, Globe2, ShieldCheck,
  GraduationCap, BookOpen, Newspaper, LifeBuoy, Building2, Handshake, Award, Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MenuItem = { label: string; desc?: string; icon: LucideIcon };
type MenuColumn = { title: string; items: MenuItem[] };
export type MegaMenuContent = {
  columns: MenuColumn[];
  featured?: { title: string; description: string; cta: string };
};

export const megaMenus: Record<string, MegaMenuContent> = {
  Products: {
    columns: [
      {
        title: "Sales & Marketing",
        items: [
          { label: "CRM", desc: "Pipeline & deals", icon: Users },
          { label: "Campaigns", desc: "Email marketing", icon: Mail },
          { label: "Commerce", desc: "Online storefronts", icon: ShoppingCart },
          { label: "Analytics", desc: "Reports & dashboards", icon: BarChart3 },
        ],
      },
      {
        title: "Communication",
        items: [
          { label: "Mail", desc: "Business email", icon: Mail },
          { label: "Chat", desc: "Team messaging", icon: MessageSquare },
          { label: "Meetings", desc: "Video conferencing", icon: Calendar },
          { label: "Helpdesk", desc: "Customer support", icon: Headphones },
        ],
      },
      {
        title: "Finance & HR",
        items: [
          { label: "Books", desc: "Accounting", icon: FileText },
          { label: "Payroll", desc: "Run payroll easily", icon: CreditCard },
          { label: "People", desc: "HR management", icon: Briefcase },
          { label: "Expense", desc: "Track spending", icon: CreditCard },
        ],
      },
      {
        title: "Platform",
        items: [
          { label: "Creator", desc: "Low-code builder", icon: Layers },
          { label: "Cloud", desc: "Infrastructure", icon: Cloud },
          { label: "AI Studio", desc: "Build agents", icon: Bot },
          { label: "DataPrep", desc: "Data pipelines", icon: Database },
        ],
      },
    ],
    featured: {
      title: "SokoStack One",
      description: "All 50+ apps for your entire business in one unified suite.",
      cta: "Try SokoStack One",
    },
  },
  Customers: {
    columns: [
      {
        title: "By Industry",
        items: [
          { label: "Retail", icon: ShoppingCart },
          { label: "Education", icon: GraduationCap },
          { label: "Healthcare", icon: Heart },
          { label: "Manufacturing", icon: Building2 },
        ],
      },
      {
        title: "By Size",
        items: [
          { label: "Startups", icon: Award },
          { label: "Small Business", icon: Briefcase },
          { label: "Mid-Market", icon: Building2 },
          { label: "Enterprise", icon: ShieldCheck },
        ],
      },
      {
        title: "Stories",
        items: [
          { label: "Case Studies", icon: FileText },
          { label: "Testimonials", icon: MessageSquare },
          { label: "Customer Awards", icon: Award },
          { label: "User Community", icon: Users },
        ],
      },
    ],
    featured: {
      title: "Customer Spotlight",
      description: "See how teams scale operations with SokoStack.",
      cta: "Read stories",
    },
  },
  Partners: {
    columns: [
      {
        title: "Programs",
        items: [
          { label: "Consulting Partners", icon: Handshake },
          { label: "Solution Providers", icon: Briefcase },
          { label: "Affiliate Program", icon: Award },
          { label: "Developer Program", icon: Layers },
        ],
      },
      {
        title: "Find a Partner",
        items: [
          { label: "Partner Directory", icon: Globe2 },
          { label: "Become a Partner", icon: Handshake },
          { label: "Partner Portal", icon: ShieldCheck },
          { label: "Training", icon: GraduationCap },
        ],
      },
      {
        title: "Marketplace",
        items: [
          { label: "Extensions", icon: Layers },
          { label: "Integrations", icon: Cloud },
          { label: "Themes", icon: Layers },
          { label: "Build Your Own", icon: Bot },
        ],
      },
    ],
    featured: {
      title: "Grow with SokoStack",
      description: "Join thousands of partners building on our platform.",
      cta: "Become a partner",
    },
  },
  Resources: {
    columns: [
      {
        title: "Learn",
        items: [
          { label: "Blog", icon: Newspaper },
          { label: "Knowledge Base", icon: BookOpen },
          { label: "Webinars", icon: Calendar },
          { label: "Academy", icon: GraduationCap },
        ],
      },
      {
        title: "Support",
        items: [
          { label: "Help Center", icon: LifeBuoy },
          { label: "Community Forum", icon: Users },
          { label: "Service Status", icon: ShieldCheck },
          { label: "Contact Support", icon: Headphones },
        ],
      },
      {
        title: "Company",
        items: [
          { label: "About Us", icon: Building2 },
          { label: "Careers", icon: Briefcase },
          { label: "Press", icon: Newspaper },
          { label: "Events", icon: Calendar },
        ],
      },
    ],
    featured: {
      title: "What's New",
      description: "Product updates, releases, and roadmap from SokoStack.",
      cta: "See changelog",
    },
  },
};

export const MegaMenuPanel = ({ content }: { content: MegaMenuContent }) => {
  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_280px]">
      <div className={`grid gap-6 ${content.columns.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        {content.columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {col.title}
            </h4>
            <ul className="space-y-1">
              {col.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      to="/products"
                      className="group flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-surface-soft"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-brand-red group-hover:bg-brand-red/10">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-brand-dark group-hover:text-brand-red">
                          {item.label}
                        </span>
                        {item.desc && (
                          <span className="block text-xs text-muted-foreground">{item.desc}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {content.featured && (
        <aside className="rounded-lg bg-gradient-to-br from-brand-red/10 via-brand-yellow/10 to-brand-blue/10 p-6">
          <h4 className="text-base font-semibold text-brand-dark">{content.featured.title}</h4>
          <p className="mt-2 text-sm text-muted-foreground">{content.featured.description}</p>
          <Link
            to="/products"
            className="mt-4 inline-flex text-sm font-medium text-brand-red hover:underline"
          >
            {content.featured.cta} →
          </Link>
        </aside>
      )}
    </div>
  );
};
