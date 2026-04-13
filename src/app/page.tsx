'use client';

export default function HomePage() {
  return (
    <main className="premium-container" style={{ textAlign: 'center', marginTop: '10vh' }}>
      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(90deg, var(--accent-red), var(--accent-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          IAI Genius Scoreboard
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          La solution ultime pour la gestion de vos matchs et compétitions en direct.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="/admin" className="btn-primary" style={{ textDecoration: 'none' }}>ADMINISTRATION</a>
          {/* <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent-blue)' }} onClick={() => alert('Entrez l\'ID du match fourni par l\'admin')}>
            REJOINDRE UN MATCH
          </button> */}
        </div>
      </div>
    </main>
  );
}
