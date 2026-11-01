import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useSeo } from '../hooks/useSeo';
import type { LearningPath, LearningPathTopic } from '../types';
import './LearningPathDetailPage.css';

export function LearningPathDetailPage() {
  const { slug = '' } = useParams();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [topics, setTopics] = useState<LearningPathTopic[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ learning_path: LearningPath; topics: LearningPathTopic[] }>(`/learning-paths/${slug}`)
      .then((res) => {
        setPath(res.learning_path);
        setTopics(res.topics);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  useSeo({
    title: path ? `${path.title} | Architecture Simplified` : 'Learning Path',
    description: path?.description || undefined,
  });

  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!path) return <div className="container"><p className="muted-on-dark">Loading…</p></div>;

  return (
    <div className="path-detail">
      <div className="container">
        <section className="hero-panel">
          <h1>Learning Path</h1>
          <p>{path.title}</p>
        </section>

        <div className="path-layout">
          <div className="card path-overview">
            <h2>{path.title}</h2>
            <p>{path.description}</p>
            <div className="path-stats">
              <span>{topics.length} Topics</span>
              <span>{path.difficulty}</span>
            </div>
            {topics[0] && (
              <Link className="btn btn-primary" to={`/${topics[0].category_slug}/${topics[0].slug}`}>
                Start Learning
              </Link>
            )}
          </div>

          <ol className="path-timeline">
            {topics.map((topic, index) => (
              <li key={topic.id} className="card path-step">
                <div className="step-num">{index + 1}</div>
                <div>
                  <Link to={`/${topic.category_slug}/${topic.slug}`}>
                    <strong>{topic.title}</strong>
                  </Link>
                  <p>{topic.short_description}</p>
                  {topic.reading_time && <span className="step-meta">{topic.reading_time} min</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
