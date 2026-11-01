import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Category, Topic } from '../../types';

export function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    if (categoryId) qs.set('category_id', categoryId);
    if (search) qs.set('search', search);
    const q = qs.toString() ? `?${qs}` : '';
    const res = await api.get<{ topics: Topic[] }>(`/admin/topics${q}`);
    setTopics(res.topics);
  }

  useEffect(() => {
    api.get<{ categories: Category[] }>('/admin/categories').then((res) => setCategories(res.categories));
  }, []);

  useEffect(() => {
    load();
  }, [status, categoryId]);

  async function publish(id: string) {
    await api.post(`/admin/topics/${id}/publish`);
    await load();
  }

  async function unpublish(id: string) {
    await api.post(`/admin/topics/${id}/unpublish`);
    await load();
  }

  async function archive(id: string) {
    await api.post(`/admin/topics/${id}/archive`);
    await load();
  }

  async function duplicate(id: string) {
    await api.post(`/admin/topics/${id}/duplicate`);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this topic?')) return;
    await api.delete(`/admin/topics/${id}`);
    await load();
  }

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <h1 style={{ margin: 0 }}>Topics</h1>
        <Link to="/admin/topics/new" className="btn btn-primary">
          Create Topic
        </Link>
      </div>

      <div className="admin-toolbar-filters" style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          style={{ padding: '0.55rem 0.8rem', borderRadius: 8, border: '1px solid #dbe3f0' }}
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ padding: '0.55rem' }}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '0.55rem' }}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button className="btn btn-ghost" type="button" onClick={load}>
          Apply
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <tr key={topic.id}>
              <td>{topic.topic_number ?? '—'}</td>
              <td>
                <Link to={`/admin/topics/${topic.id}`}>{topic.title}</Link>
              </td>
              <td>{topic.category_name}</td>
              <td>
                <span className={`badge badge-${topic.status.toLowerCase()}`}>{topic.status}</span>
              </td>
              <td>
                <div className="row-actions">
                  <Link className="btn btn-ghost" to={`/admin/topics/${topic.id}`}>
                    Edit
                  </Link>
                  {topic.status !== 'PUBLISHED' ? (
                    <button className="btn btn-ghost" type="button" onClick={() => publish(topic.id)}>
                      Publish
                    </button>
                  ) : (
                    <button className="btn btn-ghost" type="button" onClick={() => unpublish(topic.id)}>
                      Unpublish
                    </button>
                  )}
                  <button className="btn btn-ghost" type="button" onClick={() => archive(topic.id)}>
                    Archive
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => duplicate(topic.id)}>
                    Duplicate
                  </button>
                  <button className="btn btn-danger" type="button" onClick={() => remove(topic.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
