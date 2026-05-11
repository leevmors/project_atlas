interface TeamQuoteProps {
  text: string;
  attribution: string;
  className?: string;
}

export function TeamQuote({ text, attribution, className = '' }: TeamQuoteProps) {
  return (
    <blockquote className={`text-center ${className}`}>
      <p className="font-cursive italic text-slate-500 text-base sm:text-lg leading-relaxed">
        &ldquo;{text}&rdquo;
      </p>
      <footer className="mt-2 text-slate-400 text-xs font-semibold tracking-[0.16em] uppercase">
        - {attribution}
      </footer>
    </blockquote>
  );
}
