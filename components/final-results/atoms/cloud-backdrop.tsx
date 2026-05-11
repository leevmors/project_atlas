export function CloudBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #f8fbff 0%, #edf8ff 42%, #ffffff 100%)',
        }}
      />
      <div
        className="absolute -left-[18%] -right-[18%] -top-20 h-80 blur-3xl opacity-95"
        style={{
          background:
            'radial-gradient(ellipse 34% 42% at 18% 56%, rgba(255,255,255,0.96), transparent 70%), radial-gradient(ellipse 36% 46% at 47% 38%, rgba(219,242,255,0.92), transparent 68%), radial-gradient(ellipse 32% 40% at 76% 58%, rgba(255,255,255,0.9), transparent 70%)',
        }}
      />
      <div
        className="absolute -left-[12%] -right-[12%] top-[18%] h-96 blur-3xl opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 38% 36% at 24% 48%, rgba(186,230,253,0.48), transparent 72%), radial-gradient(ellipse 40% 38% at 64% 52%, rgba(224,242,254,0.62), transparent 72%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </div>
  );
}
