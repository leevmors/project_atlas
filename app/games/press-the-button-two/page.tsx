export default function PressTheButtonTwoPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#080806',
      }}
    >
      <iframe
        src="/games/press-the-button-two/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: '#080806',
        }}
        allow="autoplay"
      />
    </div>
  );
}
