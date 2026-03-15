import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  text?: string;
  textColor?: string;
  textClassName?: string;
  iconColor?: string;
}

const Logo = ({ 
  className, 
  size = 32, 
  showText = true, 
  text = "Watchtower",
  textColor = "#1e293b", 
  textClassName,
  iconColor = "#8b5cf6" // Vibrant Purple
}: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg 
        width={typeof size === 'number' ? (size * 40 / 48) : size} 
        height={size} 
        viewBox="0 0 40 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <circle cx="20" cy="24" r="18.5" stroke={iconColor} strokeWidth="3"/>
        <circle cx="15.75" cy="19.75" r="12.5" stroke={iconColor} strokeWidth="3"/>
        <circle cx="20" cy="24" r="6.5" stroke={iconColor} strokeWidth="3"/>
      </svg>
      {showText && (
        <span 
          className={cn("font-bold text-lg tracking-tight", textClassName)} 
          style={{ color: textColor }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default Logo;
