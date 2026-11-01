import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useSeo } from '../hooks/useSeo';

interface SearchResults {
  topics: Array<{
    id: string;
    title: string;
    slug: string;
    short_description: string | null;
    category_slug: string;
    category_name: string;
  }>;
  categories: Array<{ id: string; name: string; slug: string; description: string | null }>;
  tags: Array<{ id: string; name: string; slug: string }>;
  resources: Array<{
    id: string;
    title: string;
    description: string | null;
    topic_slug: string;
    category_slug: string;
  }>;
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<SearchResults | null>(null);

  useSeo({ title: q ? `Search: ${q} | Architecture Simplified` : 'Search' });

  useEffect(() => {
    if (!q) {
      setResults(null);
      return;
    }
    api.get<SearchResults>(`/search?q=${encodeURIComponent(q)}`).then(setResults);
  }, [q]);

  return (
    <div className="container" style={{ padding: '2rem 0 3rem' }}>
      <section className="hero-panel">
        <h1>Search</h1>
        <p>{q ? `Results for “${q}”` : 'Use the header search to find topics, categories, tags, and resources.'}</p>
      </section>

      {results && (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <ResultGroup title="Topics">
            {results.topics.map((t) => (
              <Link key={t.id} to={`/${t.category_slug}/${t.slug}`} className="card" style={{ padding: '1rem', display: 'block' }}>
                <strong>{t.title}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.category_name}</div>
              </Link>
            ))}
          </ResultGroup>
          <ResultGroup title="Categories">
            {results.categories.map((c) => (
              <Link key={c.id} to={`/topics?category=${c.slug}`} className="card" style={{ padding: '1rem', display: 'block' }}>
                <strong>{c.name}</strong>
              </Link>
            ))}
          </ResultGroup>
          <ResultGroup title="Resources">
            {results.resources.map((r) => (
              <Link key={r.id} to={`/${r.category_slug}/${r.topic_slug}`} className="card" style={{ padding: '1rem', display: 'block' }}>
                <strong>{r.title}</strong>
              </Link>
            ))}
          </ResultGroup>
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  if (!items.filter(Boolean).length) return null;
  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <div style={{ display: 'grid', gap: '0.75rem' }}>{children}</div>
    </section>
  );
}
