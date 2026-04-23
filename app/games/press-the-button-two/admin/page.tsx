export default function PressTheButtonTwoAdminPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#030405',
      }}
    >
      <iframe
        src="/games/press-the-button-two/index.html?admin"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: '#030405',
        }}
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
