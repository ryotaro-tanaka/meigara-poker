export function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Meigara Poker</p>
        <h1>Frontend scaffold is ready.</h1>
        <p className="description">
          Lobby, game, and result screens will be built on top of this React + Vite setup.
        </p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Lobby</h2>
          <p>Room creation and join flow will live here.</p>
        </article>

        <article className="panel">
          <h2>Game</h2>
          <p>Hand, board, players, and phase state will be rendered here.</p>
        </article>

        <article className="panel">
          <h2>Result</h2>
          <p>Winner and draw state will be shown here.</p>
        </article>
      </section>
    </main>
  );
}
