'use client';

import React from 'react';
import ScoreBoard from '@/components/ScoreBoard';
import useSWR from 'swr';
import { useParams } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ClientMatchPage() {
  const { id } = useParams();

  const { data: match, error } = useSWR(id ? `/api/match/${id}` : null, fetcher, {
    refreshInterval: 1500, // Re-fetch every 1.5 seconds for "live" feel
    revalidateOnFocus: true
  });

  if (error) return <div className="premium-container"><h1>Match introuvable</h1></div>;
  if (!match) return <div className="premium-container"><h1>Chargement du match en direct...</h1></div>;

  return (
    <div className="premium-container">
      <ScoreBoard match={match} isAdmin={false} />
    </div>
  );
}
