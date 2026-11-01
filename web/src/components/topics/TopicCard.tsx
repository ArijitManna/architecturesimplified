import { Link } from 'react-router-dom';
import type { Topic } from '../../types';
import './TopicCard.css';

const ICONS = ['📦', '🌐', '⚡', '🗄️', '🚀', '🔐', '☁️', '🧩'];

export function TopicCard({ topic }: { topic: Topic }) {
  const num = topic.topic_number ? String(topic.topic_number).padStart(2, '0') : '••';
  const icon = ICONS[(topic.topic_number || 0) % ICONS.length];
  const href = `/${topic.category_slug}/${topic.slug}`;

  return (
    <Link to={href} className="topic-card card">
      <div className="topic-card-icon" aria-hidden>
        {icon}
      </div>
      <div className="topic-card-meta">#{num}</div>
      <h3>{topic.title}</h3>
      <p>{topic.short_description}</p>
    </Link>
  );
}
