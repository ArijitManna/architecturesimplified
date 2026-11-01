import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { LearningPath, Topic } from '../../types';

export function LearningPathsAdminPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'INTERMEDIATE',
    display_order: '0',
    is_active: true,
    topic_ids: [] as string[],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const [p, t] = await Promise.all([
      api.get<{ learning_paths: LearningPath[] }>('/admin/learning-paths'),
      api.get<{ topics: Topic[] }>('/admin/topics'),
    ]);
    setPaths(p.learning_paths);
    setTopics(t.topics);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      difficulty: form.difficulty,
      display_order: Number(form.display_order) || 0,
      is_active: form.is_active,
      topics: form.topic_ids.map((topic_id, display_order) => ({ topic_id, display_order, is_required: true })),
    };
    if (editingId) await api.put(`/admin/learning-paths/${editingId}`, payload);
    else await api.post('/admin/learning-paths', payload);
    setForm({ title: '', description: '', difficulty: 'INTERMEDIATE', display_order: '0', is_active: true, topic_ids: [] });
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete learning path?')) return;
    await api.delete(`/admin/learning-paths/${id}`);
    await load();
  }

  function toggleTopic(id: string) {
    setForm((f) => ({
      ...f,
      topic_ids: f.topic_ids.includes(id) ? f.topic_ids.filter((x) => x !== id) : [...f.topic_ids, id],
    }));
  }

  return (
    <div className="admin-page">
      <h1>Learning Paths</h1>
      <form className="admin-card" onSubmit={save}>
        <h2>{editingId ? 'Edit Path' : 'Create Path'}</h2>
        <div className="form-field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="form-field">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Difficulty</label>
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
        <div className="form-field">
          <label>Topics (order = selection order)</label>
          <div style={{ display: 'grid', gap: '0.35rem', maxHeight: 220, overflow: 'auto' }}>
            {topics.map((t) => (
              <label key={t.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="checkbox" checked={form.topic_ids.includes(t.id)} onChange={() => toggleTopic(t.id)} />
                {t.title}
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" type="submit">
          {editingId ? 'Update' : 'Create'}
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Topics</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paths.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.topic_count ?? 0}</td>
              <td>{p.is_active ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn btn-danger" type="button" onClick={() => remove(p.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
