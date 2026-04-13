'use client';

import React, { useEffect, useState } from 'react';
import styles from './ScoreBoard.module.css';
import { Match, Rubrique } from '@/lib/db';
import { clsx } from 'clsx';

interface ScoreBoardProps {
  match: Match & { rubriques: Rubrique[] };
  isAdmin?: boolean;
  onUpdate?: (rubriqueId: string, data: Partial<Rubrique>) => void;
  selectedRubriqueId?: string | null;
  onSelect?: (id: string) => void;
}

export default function ScoreBoard({ match, isAdmin, onUpdate, selectedRubriqueId, onSelect }: ScoreBoardProps) {
  const [animatingScore, setAnimatingScore] = useState<string | null>(null);
  const [localRubriques, setLocalRubriques] = useState(match.rubriques);
  
  const activeRubrique = localRubriques.find(r => r.id === (selectedRubriqueId || localRubriques[0]?.id));

  useEffect(() => {
    setLocalRubriques(match.rubriques);
  }, [match.rubriques]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalRubriques(prev => prev.map(r => {
        if (r.is_running && r.timer_seconds > 0) {
          return { ...r, timer_seconds: r.timer_seconds - 1 };
        }
        return r;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setAnimatingScore('total');
    const timer = setTimeout(() => setAnimatingScore(null), 300);
    return () => clearTimeout(timer);
  }, [match.score_a_total, match.score_b_total]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const Content = (
    <div className={styles.mainContent}>
      <header className={styles.header}>
        <h3>IAI Genius</h3>
        <h1>{match.title}</h1>
      </header>

      <main className={styles.mainDisplay}>
        <div className={styles.team}>
          <span className={styles.teamName}>{match.team_a_name}</span>
          <span className={clsx(styles.score, animatingScore === 'total' && styles.scoreAnimating)}>
            {match.score_a_total}
          </span>
        </div>

        <div className={styles.vsContainer}>
          <span className={styles.vs}>VS</span>
          <div className={styles.timer}>
            {formatTime(activeRubrique?.timer_seconds ?? 0)}
          </div>
        </div>

        <div className={styles.team}>
          <span className={styles.teamName}>{match.team_b_name}</span>
          <span className={clsx(styles.score, animatingScore === 'total' && styles.scoreAnimating)}>
            {match.score_b_total}
          </span>
        </div>
      </main>

      {/* Admin Panel */}
      {isAdmin && activeRubrique && onUpdate && (
        <section className={styles.controlPanel}>
          <div className={styles.activeRubriqueTitle}>
            Contrôle : {activeRubrique.name}
          </div>
          
          <div className={styles.controlsGrid}>
            <div className={styles.teamControls}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontWeight: 'bold' }}>{match.team_a_name}</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => onUpdate(activeRubrique.id, { score_a: activeRubrique.score_a + activeRubrique.points_per_click })}
                  className={clsx("btn-primary", styles.bigBtn)}>
                  + <span>{activeRubrique.points_per_click}</span>
                </button>
                <button 
                  onClick={() => onUpdate(activeRubrique.id, { score_a: activeRubrique.score_a - activeRubrique.points_per_click })}
                  className={clsx("btn-danger", styles.bigBtn)}>
                  - <span>{activeRubrique.points_per_click}</span>
                </button>
              </div>
            </div>

            <div className={styles.teamControls}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontWeight: 'bold' }}>{match.team_b_name}</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => onUpdate(activeRubrique.id, { score_b: activeRubrique.score_b + activeRubrique.points_per_click })}
                  className={clsx("btn-primary", styles.bigBtn)}>
                  + <span>{activeRubrique.points_per_click}</span>
                </button>
                <button 
                  onClick={() => onUpdate(activeRubrique.id, { score_b: activeRubrique.score_b - activeRubrique.points_per_click })}
                  className={clsx("btn-danger", styles.bigBtn)}>
                  - <span>{activeRubrique.points_per_click}</span>
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onUpdate(activeRubrique.id, { is_running: !activeRubrique.is_running, timer_seconds: activeRubrique.timer_seconds })}
            className="btn-primary" style={{ width: '100%', padding: '1rem', background: activeRubrique.is_running ? 'var(--accent-red)' : 'var(--accent-blue)', fontWeight: 'bold' }}>
            {activeRubrique.is_running ? 'PAUSER LE CHRONO' : 'LANCER LE CHRONO'}
          </button>
        </section>
      )}

      {/* Grid of rubriques (Client View or Admin secondary info) */}
      {!isAdmin && (
        <section className={styles.rubriquesGrid}>
          {localRubriques.map((rubrique) => (
            <div key={rubrique.id} className={styles.rubrique}>
              <div className={styles.rubriqueHeader}>
                <span className={styles.rubriqueName}>{rubrique.name}</span>
                <span className={styles.rubriqueTimer}>{formatTime(rubrique.timer_seconds)}</span>
              </div>

              <div className={styles.rubriqueScores}>
                <div className={styles.rubriqueValue}>
                  <span>{rubrique.score_a}</span>
                </div>
                <span className={styles.vs}>-</span>
                <div className={styles.rubriqueValue}>
                  <span>{rubrique.score_b}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );

  if (isAdmin) {
    return (
      <div className={styles.adminLayout}>
        <aside className={styles.sidebar}>
          <h4 style={{ padding: '0.5rem', opacity: 0.6, fontSize: '0.8rem' }}>RUBRIQUES</h4>
          {localRubriques.map(r => (
            <div 
              key={r.id} 
              className={clsx(styles.sidebarItem, selectedRubriqueId === r.id && styles.sidebarItemActive)}
              onClick={() => onSelect?.(r.id)}
            >
              <span>{r.name}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{r.score_a - r.score_b}</span>
            </div>
          ))}
        </aside>
        {Content}
      </div>
    );
  }

  return Content;
}
