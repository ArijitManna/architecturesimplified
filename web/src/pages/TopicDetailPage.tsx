import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { MentalModel } from '../components/topics/MentalModel';
import { TopicSectionView } from '../components/topics/TopicSection';
import { DiagramViewer } from '../components/topics/DiagramViewer';
import { TopicCard } from '../components/topics/TopicCard';
import { useSeo } from '../hooks/useSeo';
import type { Diagram, Resource, Topic, TopicSection } from '../types';
import './TopicDetailPage.css';

export function TopicDetailPage() {
  const { categorySlug = '', topicSlug = '' } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [sections, setSections] = useState<TopicSection[]>([]);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [related, setRelated] = useState<Topic[]>([]);
  const [error, setError] = useState('');
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    setError('');
    api
      .get<{
        topic: Topic;
        sections: TopicSection[];
        diagrams: Diagram[];
        resources: Resource[];
        related: Topic[];
      }>(`/topics/${categorySlug}/${topicSlug}`)
      .then((res) => {
        setTopic(res.topic);
        setSections(res.sections);
        setDiagrams(res.diagrams);
        setResources(res.resources);
        setRelated(res.related);
      })
      .catch((err) => setError(err.message));
  }, [categorySlug, topicSlug]);

  const mental = sections.find((s) => s.section_type === 'MENTAL_MODEL');
  const otherSections = sections.filter((s) => s.section_type !== 'MENTAL_MODEL');

  const toc = useMemo(() => {
    const items = [];
    if (mental) items.push({ id: 'mental-model', title: 'Mental Model' });
    for (const s of otherSections) {
      items.push({
        id: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: s.title,
      });
    }
    if (diagrams.length) items.push({ id: 'diagrams', title: 'Diagrams' });
    if (resources.length) items.push({ id: 'resources', title: 'Resources' });
    return items;
  }, [mental, otherSections, diagrams, resources]);

  useSeo({
    title: topic
      ? `${topic.title}${topic.subtitle ? ` — ${topic.subtitle}` : ''} | Architecture Simplified`
      : 'Topic | Architecture Simplified',
    description: topic?.short_description || undefined,
    canonical: topic ? `${window.location.origin}/${categorySlug}/${topicSlug}` : undefined,
  });

  if (error) {
    return (
      <div className="container topic-detail">
        <div className="alert alert-error">{error}</div>
        <Link to="/topics" className="btn btn-secondary">
          Back to Topics
        </Link>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container topic-detail">
        <p className="muted-on-dark">Loading topic…</p>
      </div>
    );
  }

  const difficultyClass = `badge-${topic.difficulty.toLowerCase()}`;

  return (
    <div className="topic-detail">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to={`/topics?category=${topic.category_slug}`}>{topic.category_name}</Link>
          <span>/</span>
          <span>{topic.title}</span>
        </nav>

        <header className="topic-header card">
          <div className="topic-header-icon" aria-hidden>
            {topic.topic_number ? String(topic.topic_number).padStart(2, '0') : 'AS'}
          </div>
          <div className="topic-header-body">
            <h1>{topic.title}</h1>
            {topic.subtitle && <p className="topic-subtitle">{topic.subtitle}</p>}
            <div className="topic-meta">
              {topic.reading_time && <span>{topic.reading_time} min read</span>}
              <span className={`badge ${difficultyClass}`}>{topic.difficulty}</span>
              {topic.tags?.map((tag) => (
                <span key={tag.id} className="tag-chip">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="topic-layout">
          <aside className={`topic-toc card ${tocOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="toc-toggle"
              onClick={() => setTocOpen((v) => !v)}
            >
              On This Page
            </button>
            <div className="toc-list">
              <p className="toc-label">On This Page</p>
              {toc.map((item) => (
                <a key={item.id} href={`#${item.id}`} onClick={() => setTocOpen(false)}>
                  {item.title}
                </a>
              ))}
            </div>
          </aside>

          <div className="topic-content">
            {mental && <MentalModel section={mental} />}
            {otherSections.map((section) => (
              <TopicSectionView key={section.id} section={section} />
            ))}
            <DiagramViewer diagrams={diagrams} />

            {resources.length > 0 && (
              <section id="resources" className="card resources-panel">
                <h2>Resources</h2>
                <ul>
                  {resources.map((r) => (
                    <li key={r.id}>
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.title}
                        </a>
                      ) : (
                        <span>{r.title}</span>
                      )}
                      {r.description && <p>{r.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {related.length > 0 && (
              <section className="related-panel">
                <h2 className="section-title">Related Topics</h2>
                <div className="grid-cards">
                  {related.map((t) => (
                    <TopicCard key={t.id} topic={t} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
