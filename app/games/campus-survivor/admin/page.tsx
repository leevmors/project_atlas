export default function CampusSurvivorAdminPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#111',
      }}
    >
      <iframe
        src="/games/campus-survivor/index.html?admin"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: '#111',
        }}
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
