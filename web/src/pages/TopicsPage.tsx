import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { TopicCard } from '../components/topics/TopicCard';
import { useSeo } from '../hooks/useSeo';
import type { Category, Topic } from '../types';
import './TopicsPage.css';

export function TopicsPage() {
  useSeo({
    title: 'Explore Topics | Architecture Simplified',
    description: 'Browse technology topics explained through mental models and architecture diagrams.',
  });

  const [params, setParams] = useSearchParams();
  const selected = params.get('category') || 'all';
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((res) => setCategories(res.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = selected === 'all' ? '' : `?category=${selected}`;
    api
      .get<{ topics: Topic[] }>(`/topics${q}`)
      .then((res) => setTopics(res.topics))
      .finally(() => setLoading(false));
  }, [selected]);

  const title = useMemo(() => {
    if (selected === 'all') return `All Topics (${topics.length})`;
    const cat = categories.find((c) => c.slug === selected);
    return `${cat?.name || selected} Topics (${topics.length})`;
  }, [selected, topics, categories]);

  return (
    <div className="topics-page">
      <div className="container">
        <section className="hero-panel topics-hero">
          <div>
            <h1>Explore Topics</h1>
            <p>
              Dive into architecture concepts with analogies, diagrams, scenarios, and exam
              shortcuts — all configurable from the admin panel.
            </p>
          </div>
          <div className="topics-hero-art" aria-hidden>
            <div className="lamp" />
            <div className="books" />
          </div>
        </section>

        <div className="filter-bar">
          <button
            type="button"
            className={`pill ${selected === 'all' ? 'active' : ''}`}
            onClick={() => setParams({})}
          >
            All Topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pill ${selected === cat.slug ? 'active' : ''}`}
              onClick={() => setParams({ category: cat.slug })}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <h2 className="section-title">{title}</h2>
        {loading ? (
          <p className="muted-on-dark">Loading topics…</p>
        ) : topics.length === 0 ? (
          <p className="muted-on-dark">No published topics in this category yet.</p>
        ) : (
          <div className="grid-cards">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
