interface TeamQuoteProps {
  text: string;
  attribution: string;
  className?: string;
}

export function TeamQuote({ text, attribution, className = '' }: TeamQuoteProps) {
  return (
    <blockquote className={`text-center ${className}`}>
      <p className="font-cursive italic text-white/50 text-lg md:text-xl leading-relaxed">
        &ldquo;{text}&rdquo;
      </p>
      <footer className="mt-2 text-white/30 text-sm tracking-wider uppercase">
        — {attribution}
      </footer>
    </blockquote>
  );
}
