import { Link } from "react-router-dom";

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2" aria-label="SokoStack home">
    <div className="grid grid-cols-2 gap-0.5">
      <span className="h-2.5 w-2.5 rounded-sm bg-brand-red" />
      <span className="h-2.5 w-2.5 rounded-sm bg-brand-yellow" />
      <span className="h-2.5 w-2.5 rounded-sm bg-brand-blue" />
      <span className="h-2.5 w-2.5 rounded-sm bg-brand-purple" />
    </div>
    <span className="text-lg font-semibold tracking-tight text-brand-dark">SokoStack</span>
  </Link>
);
