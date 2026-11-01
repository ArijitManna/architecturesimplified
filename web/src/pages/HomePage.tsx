import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { TopicCard } from '../components/topics/TopicCard';
import { useSeo } from '../hooks/useSeo';
import type { Category, Challenge, LearningPath, Topic } from '../types';
import './HomePage.css';

export function HomePage() {
  useSeo({
    title: 'Architecture Simplified — Complex Technology Through Simple Mental Models',
    description:
      'Learn AWS, system design, and cloud architecture through real-world analogies, mental models, and visual diagrams.',
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<{ topics: Topic[] }>('/topics?limit=6'),
      api.get<{ categories: Category[] }>('/categories'),
      api.get<{ learning_paths: LearningPath[] }>('/learning-paths'),
      api.get<{ challenges: Challenge[] }>('/challenges'),
    ]).then(([t, c, p, ch]) => {
      setTopics(t.topics);
      setCategories(c.categories);
      setPaths(p.learning_paths);
      setChallenges(ch.challenges);
    });
  }, []);

  return (
    <div className="home-page">
      <div className="container">
        <section className="home-hero hero-panel">
          <div className="home-hero-copy">
            <p className="eyebrow">Architecture Simplified</p>
            <h1>Complex Technology Through Simple Mental Models</h1>
            <p>
              Learn cloud architecture with real-world analogies, visual diagrams, scenarios, and
              exam shortcuts — starting with AWS.
            </p>
            <div className="hero-actions">
              <Link to="/topics" className="btn btn-primary">
                Explore Topics
              </Link>
              <Link to="/learning-paths" className="btn btn-secondary">
                Learning Paths
              </Link>
            </div>
          </div>
          <div className="home-hero-art" aria-hidden>
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="hero-card-stack">
              <div className="mini-card">Mental Model</div>
              <div className="mini-card">Architecture</div>
              <div className="mini-card">Exam Shortcut</div>
            </div>
          </div>
        </section>

        <h2 className="section-title">Featured Topics</h2>
        <div className="grid-cards">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>

        <h2 className="section-title">Explore Categories</h2>
        <div className="category-row">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/topics?category=${cat.slug}`} className="category-chip">
              <strong>{cat.name}</strong>
              <span>{cat.description?.slice(0, 80)}</span>
            </Link>
          ))}
        </div>

        {(paths.length > 0 || challenges.length > 0) && (
          <div className={`home-split${paths.length === 0 || challenges.length === 0 ? ' home-split-single' : ''}`}>
            {paths.length > 0 && (
              <div>
                <h2 className="section-title">Learning Paths</h2>
                <div className="home-list">
                  {paths.map((path) => (
                    <Link key={path.id} to={`/learning-paths/${path.slug}`} className="card home-list-item">
                      <strong>{path.title}</strong>
                      <span>{path.topic_count ?? 0} topics · {path.difficulty}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {challenges.length > 0 && (
              <div>
                <h2 className="section-title">Architecture Challenges</h2>
                <div className="home-list">
                  {challenges.map((ch) => (
                    <Link key={ch.id} to={`/challenges/${ch.slug}`} className="card home-list-item">
                      <strong>
                        {ch.challenge_number ? `#${String(ch.challenge_number).padStart(2, '0')} ` : ''}
                        {ch.title}
                      </strong>
                      <span>{ch.difficulty}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
