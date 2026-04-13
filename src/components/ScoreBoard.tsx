'use client';

import React, { useEffect, useState } from 'react';
import styles from './ScoreBoard.module.css';
import { Match, Rubrique } from '@/lib/db';
import { clsx } from 'clsx';

interface ScoreBoardProps {
  match: Match & { rubriques: Rubrique[] };
  isAdmin?: boolean;
  onUpdate?: (rubriqueId: string, data: Partial<Rubrique>) => void;
}

export default function ScoreBoard({ match, isAdmin, onUpdate }: ScoreBoardProps) {
  const [animatingScore, setAnimatingScore] = useState<string | null>(null);
  const [localRubriques, setLocalRubriques] = useState(match.rubriques);

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
    // Trigger animation when total scores change
    setAnimatingScore('total');
    const timer = setTimeout(() => setAnimatingScore(null), 300);
    return () => clearTimeout(timer);
  }, [match.score_a_total, match.score_b_total]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.scoreboard}>
      <header className={styles.header}>
        <h3>IAI Genius Scoreboard</h3>
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
            {/* Display the timer of the first running rubrique or the first one in general */}
            {formatTime(localRubriques.find(r => r.is_running)?.timer_seconds ?? localRubriques[0]?.timer_seconds ?? 0)}
          </div>
        </div>

        <div className={styles.team}>
          <span className={styles.teamName}>{match.team_b_name}</span>
          <span className={clsx(styles.score, animatingScore === 'total' && styles.scoreAnimating)}>
            {match.score_b_total}
          </span>
        </div>
      </main>

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
                <span className={styles.rubriqueLabel}>{match.team_a_name}</span>
              </div>
              <span className={styles.vs}>-</span>
              <div className={styles.rubriqueValue}>
                <span>{rubrique.score_b}</span>
                <span className={styles.rubriqueLabel}>{match.team_b_name}</span>
              </div>
            </div>

            {isAdmin && onUpdate && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  <button 
                  onClick={() => onUpdate(rubrique.id, { score_a: rubrique.score_a + rubrique.points_per_click })}
                  className="btn-primary" style={{ padding: '0.5rem' }}>+A</button>
                  <button 
                  onClick={() => onUpdate(rubrique.id, { score_a: Math.max(0, rubrique.score_a - rubrique.points_per_click) })}
                  className="btn-danger" style={{ padding: '0.5rem' }}>-A</button>
                </div>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  <button 
                  onClick={() => onUpdate(rubrique.id, { score_b: rubrique.score_b + rubrique.points_per_click })}
                  className="btn-primary" style={{ padding: '0.5rem' }}>+B</button>
                  <button 
                  onClick={() => onUpdate(rubrique.id, { score_b: Math.max(0, rubrique.score_b - rubrique.points_per_click) })}
                  className="btn-danger" style={{ padding: '0.5rem' }}>-B</button>
                </div>
                <button 
                  onClick={() => onUpdate(rubrique.id, { is_running: !rubrique.is_running, timer_seconds: rubrique.timer_seconds })}
                  className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                  {rubrique.is_running ? 'PAUSE' : 'START'} TIMER
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
