import { Link } from "react-router-dom";
import { Twitter, Facebook, Youtube, Linkedin, Instagram } from "lucide-react";
import { Logo } from "./Logo";

const cols = [
  {
    title: "Apps & Extensions",
    items: ["Mobile Apps", "Desktop Apps", "Developer Center", "Workspace Integrations", "Microsoft 365", "Apple Watch Apps", "Product Integrations", "Compare Alternatives"],
  },
  {
    title: "Learn",
    items: ["Training & Certification", "Academy", "Blog", "Knowledge Base", "FAQ", "The Long Game", "Newsletter"],
  },
  {
    title: "Community",
    items: ["User Community", "Customer Stories", "Work With a Partner", "SokoStack for Startups", "Affiliate Program", "Humans of SokoStack"],
  },
  {
    title: "Company",
    items: ["About Us", "Our Story", "Press", "Events", "Branding Assets", "SokoStack Schools", "Service Status", "Careers"],
  },
];

export const SiteFooter = () => (
  <footer className="border-t border-border bg-surface-soft">
    <div className="container py-14">
      <div className="grid gap-10 md:grid-cols-4">
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold text-brand-dark">{c.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {c.items.map((i) => (
                <li key={i}>
                  <Link to="/products" className="text-sm text-muted-foreground hover:text-brand-red">
                    {i}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container flex flex-col items-center gap-4 py-6">
        <div className="flex gap-5 text-muted-foreground">
          {[Twitter, Facebook, Youtube, Linkedin, Instagram].map((I, i) => (
            <a key={i} href="#" aria-label="social" className="hover:text-brand-red">
              <I className="h-4 w-4" />
            </a>
          ))}
        </div>
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {["Contact Us", "Security", "Compliance", "IPR Complaints", "Anti‑spam Policy", "Terms of Service", "Privacy Policy", "Cookie Policy", "Trademark Policy"].map((x) => (
            <li key={x}><Link to="/products" className="hover:text-brand-red">{x}</Link></li>
          ))}
        </ul>
      </div>
    </div>
    <div className="bg-brand-dark py-5 text-center text-xs text-white/70">
      <div className="container flex flex-col items-center gap-2">
        <Logo />
        <span>© 2026, SokoStack Corporation Pvt. Ltd. All Rights Reserved.</span>
      </div>
    </div>
  </footer>
);
