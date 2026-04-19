import { Link } from "react-router-dom";

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2" aria-label="Sokostack home">
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="hsl(var(--brand-primary))"/>
      <path d="M8 16C8 12.6863 10.6863 10 14 10H18V14H14C12.8954 14 12 14.8954 12 16C12 17.1046 12.8954 18 14 18H22V22H14C10.6863 22 8 19.3137 8 16Z" fill="white"/>
    </svg>
    <span className="text-lg font-semibold tracking-tight text-brand-dark">Sokostack</span>
  </Link>
);
