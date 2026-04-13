export default function DungeonPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#000' }}>
      <iframe
        src="/games/dungeon.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="autoplay"
        title="Dungeon - 12 Doors of Death"
      />
    </div>
  );
}
