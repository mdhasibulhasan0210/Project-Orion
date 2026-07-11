export function OrionLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Central Node */}
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      {/* Outer Nodes */}
      <circle cx="4" cy="6" r="2" fill="currentColor" />
      <circle cx="20" cy="8" r="2" fill="currentColor" />
      <circle cx="16" cy="20" r="2" fill="currentColor" />
      <circle cx="6" cy="18" r="2" fill="currentColor" />
      
      {/* Connecting Lines */}
      <path 
        d="M4 6L12 12L20 8M12 12L16 20M12 12L6 18" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
