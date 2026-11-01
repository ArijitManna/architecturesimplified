import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

interface Stats {
  total_categories: number;
  total_topics: number;
  published_topics: number;
  draft_topics: number;
  total_diagrams: number;
  total_resources: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<{ stats: Stats }>('/admin/dashboard').then((res) => setStats(res.stats));
  }, []);

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <Stat label="Categories" value={stats?.total_categories} />
        <Stat label="Topics" value={stats?.total_topics} />
        <Stat label="Published" value={stats?.published_topics} />
        <Stat label="Drafts" value={stats?.draft_topics} />
        <Stat label="Diagrams" value={stats?.total_diagrams} />
        <Stat label="Resources" value={stats?.total_resources} />
      </div>
      <div className="admin-toolbar" style={{ marginTop: '1.5rem' }}>
        <Link to="/admin/topics/new" className="btn btn-primary">
          Create Topic
        </Link>
        <Link to="/admin/categories" className="btn btn-ghost">
          Manage Categories
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="stat-card">
      <strong>{value ?? '—'}</strong>
      <span>{label}</span>
    </div>
  );
}
