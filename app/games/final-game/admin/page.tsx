export default function FinalGameAdminPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <iframe
        src="/games/final-game/index.html?admin"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: '#000',
        }}
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
