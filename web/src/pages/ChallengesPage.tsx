import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSeo } from '../hooks/useSeo';
import type { Challenge } from '../types';

export function ChallengesPage() {
  useSeo({
    title: 'Architecture Challenges | Architecture Simplified',
    description: 'Practice architecture design with interactive challenges.',
  });
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    api.get<{ challenges: Challenge[] }>('/challenges').then((res) => setChallenges(res.challenges));
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 0 3rem' }}>
      <section className="hero-panel">
        <h1>Architecture Challenges</h1>
        <p>Design systems against real requirements and validate your mental models.</p>
      </section>
      <div className="grid-cards" style={{ marginTop: '1.5rem' }}>
        {challenges.map((ch) => (
          <Link key={ch.id} to={`/challenges/${ch.slug}`} className="card topic-card">
            <div className="topic-card-meta">
              {ch.challenge_number ? `Challenge #${String(ch.challenge_number).padStart(2, '0')}` : 'Challenge'}
            </div>
            <h3>{ch.title}</h3>
            <p>{ch.description}</p>
            <span className={`badge badge-${ch.difficulty.toLowerCase()}`} style={{ marginTop: '0.75rem' }}>
              {ch.difficulty}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
