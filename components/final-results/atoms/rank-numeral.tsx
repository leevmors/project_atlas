interface RankNumeralProps {
  rank: number;
}

export function RankNumeral({ rank }: RankNumeralProps) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
    >
      <span className="text-[20rem] md:text-[28rem] font-bold text-white animate-numeral leading-none">
        {rank}
      </span>
    </div>
  );
}
