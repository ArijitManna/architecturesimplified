import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSeo } from '../hooks/useSeo';
import type { LearningPath } from '../types';

export function LearningPathsPage() {
  useSeo({
    title: 'Learning Paths | Architecture Simplified',
    description: 'Structured learning paths through architecture topics.',
  });
  const [paths, setPaths] = useState<LearningPath[]>([]);

  useEffect(() => {
    api.get<{ learning_paths: LearningPath[] }>('/learning-paths').then((res) => {
      setPaths(res.learning_paths);
    });
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 0 3rem' }}>
      <section className="hero-panel">
        <h1>Learning Paths</h1>
        <p>Follow curated sequences of topics — from fundamentals to advanced architecture.</p>
      </section>
      <div className="grid-cards" style={{ marginTop: '1.5rem' }}>
        {paths.map((path) => (
          <Link key={path.id} to={`/learning-paths/${path.slug}`} className="card topic-card">
            <div className="topic-card-meta">{path.difficulty}</div>
            <h3>{path.title}</h3>
            <p>{path.description}</p>
            <p style={{ marginTop: '0.75rem', color: 'var(--purple-600)', fontWeight: 600 }}>
              {path.topic_count ?? 0} topics
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
