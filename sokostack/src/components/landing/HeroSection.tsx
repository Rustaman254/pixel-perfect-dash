import { Mail, Users, BookOpen, Headphones, Globe2, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const apps = [
  { name: "CRM", desc: "Convert leads and close deals faster.", Icon: Briefcase },
  { name: "Mail", desc: "Secure email built for teams.", Icon: Mail },
  { name: "Books", desc: "Smart accounting for growing businesses.", Icon: BookOpen },
  { name: "Desk", desc: "Help‑desk software customers love.", Icon: Headphones },
  { name: "People", desc: "Streamline HR and people processes.", Icon: Users },
  { name: "Sites", desc: "Build sites with rich customization.", Icon: Globe2 },
];

export const HeroSection = () => {
  return (
    <section className="bg-gradient-hero">
      <div className="container py-20 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold leading-tight text-brand-dark md:text-5xl">
            Your life's work,
            <br />
            powered by <span className="relative inline-block">our life's work
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary rounded-full" />
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            A unified suite of business software designed for companies of every size — built by a team that values your privacy.
          </p>
          <div className="mt-8">
            <Button variant="default" size="lg" asChild>
              <Link to="/products">Get started for free</Link>
            </Button>
          </div>
        </div>

        {/* Featured apps card */}
        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
            {/* Promo tile */}
            <div className="relative flex flex-col justify-between bg-gradient-primary p-6 text-white">
              <div>
                <Sparkles className="h-6 w-6 text-white" />
                <h3 className="mt-6 text-xl font-semibold leading-snug">
                  Introducing
                  <br />
                  Agent Studio
                </h3>
                <p className="mt-2 text-sm text-white/75">
                  Build AI agents that quietly handle tickets, drafts, and more.
                </p>
              </div>
              <Link
                to="/products"
                className="mt-6 inline-flex w-fit items-center gap-1 rounded-full border border-white/40 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
              >
                Explore agents <ArrowRight className="h-3 w-3" />
              </Link>
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            </div>

            {/* App grid */}
            <div className="p-6 md:p-8">
              <div className="mb-5 flex items-center justify-between text-xs font-medium uppercase tracking-wide">
                <Link to="/products" className="text-primary hover:underline">Featured Apps ›</Link>
                <Link to="/products" className="text-primary hover:underline">Explore all 50+ products ›</Link>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
                {apps.map(({ name, desc, Icon }) => (
                  <Link key={name} to="/products" className="group flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary group-hover:bg-primary/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-dark group-hover:text-primary">{name}</div>
                      <div className="text-xs leading-snug text-muted-foreground">{desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};