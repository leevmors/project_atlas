export default function PressTheButtonAdminPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe
        src="/games/press-the-button/index.html?admin"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="autoplay"
      />
    </div>
  );
}
