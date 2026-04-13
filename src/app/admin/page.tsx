'use client';

import React, { useState, useEffect } from 'react';
import ScoreBoard from '@/components/ScoreBoard';
import useSWR from 'swr';
import { Match, Rubrique } from '@/lib/db';
import { Plus, Trash2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [selectedRubriqueId, setSelectedRubriqueId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: 'Match de Génie',
    team_a_name: 'Équipe A',
    team_b_name: 'Équipe B',
    rubriques: [
      { name: 'ECLAIRS', timer_seconds: 0, points_per_click: 10 },
    ]
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: match, mutate } = useSWR(matchId ? `/api/match/${matchId}` : null, fetcher, {
    refreshInterval: 1500
  });

  // Set default selected rubrique when match is loaded
  useEffect(() => {
    if (match && !selectedRubriqueId && match.rubriques.length > 0) {
      setSelectedRubriqueId(match.rubriques[0].id);
    }
  }, [match, selectedRubriqueId]);

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

  const addRubrique = () => {
    setFormData({
      ...formData,
      rubriques: [...formData.rubriques, { name: 'Nouvelle Rubrique', timer_seconds: 300, points_per_click: 5 }]
    });
  };

  const removeRubrique = (index: number) => {
    setFormData({
      ...formData,
      rubriques: formData.rubriques.filter((_, i) => i !== index)
    });
  };

  const updateRubriqueForm = (index: number, field: string, value: string) => {
    const newRubriques = [...formData.rubriques];
    let parsedValue: any = value;
    
    if (field === 'timer_seconds' || field === 'points_per_click') {
      parsedValue = value === '' ? 0 : parseInt(value);
      if (isNaN(parsedValue)) parsedValue = 0;
    }
    
    newRubriques[index] = { ...newRubriques[index], [field]: parsedValue };
    setFormData({ ...formData, rubriques: newRubriques });
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
          <h1>Configuration du Match</h1>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Titre du Match</label>
              <input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Nom Équipe A</label>
                <input
                  value={formData.team_a_name}
                  onChange={e => setFormData({ ...formData, team_a_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Nom Équipe B</label>
                <input
                  value={formData.team_b_name}
                  onChange={e => setFormData({ ...formData, team_b_name: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <h3>Rubriques du Match</h3>
              <button type="button" onClick={addRubrique} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <Plus size={18} /> Ajouter
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {formData.rubriques.map((r, i) => (
                <div key={i} className="glass-card" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '0.5rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Nom</label>
                    <input value={r.name} onChange={e => updateRubriqueForm(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Secondes</label>
                    <input type="number" value={r.timer_seconds.toString()} onChange={e => updateRubriqueForm(i, 'timer_seconds', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Points / Clic</label>
                    <input type="number" value={r.points_per_click.toString()} onChange={e => updateRubriqueForm(i, 'points_per_click', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeRubrique(i)} className="btn-danger" style={{ padding: '0.7rem', display: 'flex', justifyContent: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', fontSize: '1.2rem', padding: '1rem' }}>
              LANCER LE MATCH EN DIRECT
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-container">
      {mounted && (
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Lien public pour les clients :</p>
          <code style={{ background: '#000', padding: '0.5rem 1rem', borderRadius: '5px', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)' }}>
            {typeof window !== 'undefined' ? `${window.location.origin}/match/${matchId}` : ''}
          </code>
        </div>
      )}
      {match ? (
        <ScoreBoard
          match={match}
          isAdmin={true}
          onUpdate={handleUpdate}
          selectedRubriqueId={selectedRubriqueId}
          onSelect={setSelectedRubriqueId}
        />
      ) : (
        <p>Chargement du dashboard...</p>
      )}
    </div>
  );
}
