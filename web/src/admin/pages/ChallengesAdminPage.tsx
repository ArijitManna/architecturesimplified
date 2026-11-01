import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Challenge } from '../../types';

export function ChallengesAdminPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scenario: '',
    difficulty: 'INTERMEDIATE',
    challenge_number: '',
    requirements: '',
    status: 'DRAFT',
    options: [
      { title: '', description: '', is_correct: true, explanation: '' },
      { title: '', description: '', is_correct: false, explanation: '' },
    ],
  });

  async function load() {
    const res = await api.get<{ challenges: Challenge[] }>('/admin/challenges');
    setChallenges(res.challenges);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/admin/challenges', {
      title: form.title,
      description: form.description,
      scenario: form.scenario,
      difficulty: form.difficulty,
      challenge_number: form.challenge_number ? Number(form.challenge_number) : null,
      requirements: form.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
      status: form.status,
      options: form.options.filter((o) => o.title.trim()),
    });
    setForm({
      title: '',
      description: '',
      scenario: '',
      difficulty: 'INTERMEDIATE',
      challenge_number: '',
      requirements: '',
      status: 'DRAFT',
      options: [
        { title: '', description: '', is_correct: true, explanation: '' },
        { title: '', description: '', is_correct: false, explanation: '' },
      ],
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete challenge?')) return;
    await api.delete(`/admin/challenges/${id}`);
    await load();
  }

  return (
    <div className="admin-page">
      <h1>Challenges</h1>
      <form className="admin-card" onSubmit={save}>
        <h2>Create Challenge</h2>
        <div className="form-field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="form-field">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Scenario</label>
          <textarea value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Requirements (one per line)</label>
          <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
        <h3>Options</h3>
        {form.options.map((opt, idx) => (
          <div key={idx} className="admin-card" style={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
            <div className="form-field">
              <label>Option title</label>
              <input
                value={opt.title}
                onChange={(e) => {
                  const options = [...form.options];
                  options[idx] = { ...options[idx], title: e.target.value };
                  setForm({ ...form, options });
                }}
              />
            </div>
            <div className="form-field">
              <label>Description</label>
              <input
                value={opt.description}
                onChange={(e) => {
                  const options = [...form.options];
                  options[idx] = { ...options[idx], description: e.target.value };
                  setForm({ ...form, options });
                }}
              />
            </div>
            <div className="form-field">
              <label>Explanation</label>
              <input
                value={opt.explanation}
                onChange={(e) => {
                  const options = [...form.options];
                  options[idx] = { ...options[idx], explanation: e.target.value };
                  setForm({ ...form, options });
                }}
              />
            </div>
            <label style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={opt.is_correct}
                onChange={(e) => {
                  const options = [...form.options];
                  options[idx] = { ...options[idx], is_correct: e.target.checked };
                  setForm({ ...form, options });
                }}
              />
              Correct answer
            </label>
          </div>
        ))}
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() =>
            setForm({
              ...form,
              options: [...form.options, { title: '', description: '', is_correct: false, explanation: '' }],
            })
          }
        >
          + Option
        </button>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" type="submit">
            Create Challenge
          </button>
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {challenges.map((c) => (
            <tr key={c.id}>
              <td>{c.challenge_number ?? '—'}</td>
              <td>{c.title}</td>
              <td>{c.status}</td>
              <td>
                <button className="btn btn-danger" type="button" onClick={() => remove(c.id)}>
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
