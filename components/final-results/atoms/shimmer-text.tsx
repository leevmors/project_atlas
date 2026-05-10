interface ShimmerTextProps {
  tier: 'gold' | 'silver' | 'bronze';
  children: React.ReactNode;
  className?: string;
}

const GRADIENTS = {
  gold: 'from-yellow-200 via-amber-300 to-yellow-100',
  silver: 'from-slate-200 via-zinc-100 to-slate-300',
  bronze: 'from-orange-300 via-amber-400 to-orange-200',
};

export function ShimmerText({ tier, children, className = '' }: ShimmerTextProps) {
  return (
    <span
      className={`bg-gradient-to-r ${GRADIENTS[tier]} bg-clip-text text-transparent animate-shimmer ${className}`}
    >
      {children}
    </span>
  );
}
