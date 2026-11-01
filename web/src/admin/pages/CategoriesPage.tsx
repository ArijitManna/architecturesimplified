import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Category } from '../../types';

const empty = {
  name: '',
  description: '',
  icon: '',
  display_order: 0,
  is_active: true,
};

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    const res = await api.get<{ categories: Category[] }>('/admin/categories');
    setCategories(res.categories);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, form);
      } else {
        await api.post('/admin/categories', form);
      }
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  function edit(cat: Category) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '',
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
  }

  async function remove(id: string) {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/admin/categories/${id}`);
    await load();
  }

  async function toggle(cat: Category) {
    await api.put(`/admin/categories/${cat.id}`, { is_active: !cat.is_active });
    await load();
  }

  return (
    <div className="admin-page">
      <h1>Categories</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <form className="admin-card" onSubmit={save}>
        <h2>{editingId ? 'Edit Category' : 'Create Category'}</h2>
        <div className="form-field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-field">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label>Icon key</label>
          <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Display order</label>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
          />
        </div>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active
        </label>
        <div className="row-actions">
          <button className="btn btn-primary" type="submit">
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(empty);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Order</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td>{cat.slug}</td>
              <td>{cat.display_order}</td>
              <td>{cat.is_active ? 'Active' : 'Inactive'}</td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => edit(cat)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => toggle(cat)}>
                    {cat.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn-danger" type="button" onClick={() => remove(cat.id)}>
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
