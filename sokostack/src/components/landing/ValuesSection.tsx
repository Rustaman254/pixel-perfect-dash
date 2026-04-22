import { Handshake, HeartHandshake, ShieldCheck, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

const values = [
  {
    Icon: Handshake,
    title: "Long‑term commitment",
    body: "We believe running a profitable organization gives us a sound sense of challenge and a stronger business focus. We stay private to keep building a sustainable business that's powered by, and for, our customers.",
  },
  {
    Icon: HeartHandshake,
    title: "Customer‑first philosophy",
    body: "In all these years, it is our customers' trust and goodwill that has helped us build a lasting position in the market. No matter the size of your business, we're here to help you grow.",
  },
  {
    Icon: ShieldCheck,
    title: "Privacy & security as a priority",
    body: "We do not own or sell your data, and we never contract ad networks or advertising‑based business models. The only way we make money is from the software licenses you pay us.",
  },
  {
    Icon: FlaskConical,
    title: "Focus on research and development",
    body: "Software is our craft, and we look beyond the obvious to deliver investments in R&D. We curate expertise to own the entire technology stack — including running our own data centers globally.",
  },
];

// 12-tile collage using gradients only (no copyrighted imagery)
const tileGradients = [
  "from-brand-red/80 to-brand-yellow/70",
  "from-brand-blue/70 to-brand-purple/80",
  "from-brand-yellow/80 to-brand-red/60",
  "from-brand-purple/80 to-brand-blue/70",
  "from-emerald-500/70 to-brand-blue/70",
  "from-brand-red/70 to-brand-purple/70",
  "from-brand-blue/80 to-emerald-400/60",
  "from-brand-yellow/70 to-emerald-500/60",
  "from-brand-purple/70 to-brand-red/80",
  "from-brand-blue/60 to-brand-yellow/60",
  "from-brand-red/60 to-brand-blue/70",
  "from-brand-purple/60 to-brand-yellow/70",
];

export const ValuesSection = () => (
  <section className="relative bg-background py-20">
    {/* Collage background */}
    <div className="absolute inset-x-0 top-0 grid h-[420px] grid-cols-6 gap-1 overflow-hidden md:grid-cols-12">
      {tileGradients.concat(tileGradients).map((g, i) => (
        <div key={i} className={`bg-gradient-to-br ${g}`} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
    </div>

    <div className="container relative">
      <div className="mx-auto mt-40 max-w-4xl rounded-2xl border border-border bg-card p-10 shadow-card md:p-14">
        <h2 className="text-center text-3xl font-semibold text-brand-dark">
          The core values and principles that drive us
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {values.map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-brand-blue">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-brand-dark">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/products" className="text-xs font-semibold uppercase tracking-widest text-brand-blue hover:underline">
            Read our story ›
          </Link>
        </div>
      </div>
    </div>
  </section>
);
