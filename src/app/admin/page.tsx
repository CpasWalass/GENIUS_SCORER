'use client';

import React, { useState } from 'react';
import ScoreBoard from '@/components/ScoreBoard';
import useSWR from 'swr';
import { Match, Rubrique } from '@/lib/db';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminPage() {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: 'Match de Génie',
    team_a_name: 'Équipe A',
    team_b_name: 'Équipe B',
    rubriques: [
      { name: 'Slam', timer_seconds: 300, points_per_click: 5 },
      { name: 'Culture Générale', timer_seconds: 600, points_per_click: 10 },
      { name: 'Pitch', timer_seconds: 180, points_per_click: 20 },
    ]
  });

  const { data: match, mutate } = useSWR(matchId ? `/api/match/${matchId}` : null, fetcher, {
    refreshInterval: 1500
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    setMatchId(data.id);
  };

  const handleUpdate = async (rubriqueId: string, data: Partial<Rubrique>) => {
    if (!matchId) return;
    const res = await fetch(`/api/match/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rubriqueId, ...data })
    });
    const updated = await res.json();
    mutate(updated, false);
  };

  if (!matchId) {
    return (
      <div className="premium-container">
        <div className="glass-card">
          <h1>Créer un Nouveau Match</h1>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <input 
              placeholder="Titre du match" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input 
                placeholder="Équipe A" 
                value={formData.team_a_name}
                onChange={e => setFormData({...formData, team_a_name: e.target.value})}
              />
              <input 
                placeholder="Équipe B" 
                value={formData.team_b_name}
                onChange={e => setFormData({...formData, team_b_name: e.target.value})}
              />
            </div>
            <h3>Rubriques</h3>
            {formData.rubriques.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                <input value={r.name} disabled />
                <input value={r.timer_seconds} disabled />
                <input value={r.points_per_click} disabled />
              </div>
            ))}
            <button type="submit" className="btn-primary">LANCER LE MATCH</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-container">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p>Lien public pour les clients :</p>
        <code style={{ background: '#000', padding: '0.5rem', borderRadius: '5px' }}>
          {window.location.origin}/match/{matchId}
        </code>
      </div>
      {match ? (
        <ScoreBoard match={match} isAdmin={true} onUpdate={handleUpdate} />
      ) : (
        <p>Chargement...</p>
      )}
    </div>
  );
}
