import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, assetUrl } from '../../api/client';
import type { Category, Diagram, Resource, Topic, TopicSection } from '../../types';
import './TopicEditorPage.css';

const SECTION_TYPES = [
  'MENTAL_MODEL',
  'INTRODUCTION',
  'ARCHITECTURE',
  'CONCEPT',
  'DEEP_DIVE',
  'SCENARIO',
  'EXAM_TIP',
  'KEY_TAKEAWAY',
  'CUSTOM',
];

export function TopicEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [topicId, setTopicId] = useState<string | null>(isNew ? null : id!);
  const [form, setForm] = useState({
    category_id: '',
    title: '',
    slug: '',
    short_description: '',
    subtitle: '',
    topic_number: '',
    reading_time: '10',
    difficulty: 'BEGINNER',
    status: 'DRAFT',
    display_order: '0',
    tags: '',
  });
  const [sections, setSections] = useState<TopicSection[]>([]);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sectionForm, setSectionForm] = useState({
    section_type: 'CONCEPT',
    title: '',
    subtitle: '',
    content: '',
    display_order: '0',
  });
  const [editingSection, setEditingSection] = useState<TopicSection | null>(null);
  const [diagramForm, setDiagramForm] = useState({ title: '', description: '', diagram_type: 'IMAGE' });
  const [diagramFile, setDiagramFile] = useState<File | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    resource_type: 'OFFICIAL_DOC',
    url: '',
  });

  useEffect(() => {
    api.get<{ categories: Category[] }>('/admin/categories').then((res) => {
      setCategories(res.categories);
      if (!form.category_id && res.categories[0]) {
        setForm((f) => ({ ...f, category_id: res.categories[0].id }));
      }
    });
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    api
      .get<{ topic: Topic; sections: TopicSection[]; diagrams: Diagram[]; resources: Resource[] }>(
        `/admin/topics/${id}`
      )
      .then((res) => {
        setTopicId(res.topic.id);
        setForm({
          category_id: res.topic.category_id,
          title: res.topic.title,
          slug: res.topic.slug,
          short_description: res.topic.short_description || '',
          subtitle: res.topic.subtitle || '',
          topic_number: res.topic.topic_number?.toString() || '',
          reading_time: String(res.topic.reading_time ?? 10),
          difficulty: res.topic.difficulty,
          status: res.topic.status,
          display_order: String(res.topic.display_order ?? 0),
          tags: (res.topic.tags || []).map((t) => t.name).join(', '),
        });
        setSections(res.sections);
        setDiagrams(res.diagrams);
        setResources(res.resources);
      })
      .catch((err) => setError(err.message));
  }, [id, isNew]);

  async function refreshTopic(tid: string) {
    const res = await api.get<{
      topic: Topic;
      sections: TopicSection[];
      diagrams: Diagram[];
      resources: Resource[];
    }>(`/admin/topics/${tid}`);
    setSections(res.sections);
    setDiagrams(res.diagrams);
    setResources(res.resources);
    setForm((f) => ({
      ...f,
      status: res.topic.status,
      tags: (res.topic.tags || []).map((t) => t.name).join(', '),
    }));
  }

  async function saveTopic(publish = false) {
    setError('');
    setMessage('');
    const payload = {
      category_id: form.category_id,
      title: form.title,
      slug: form.slug || undefined,
      short_description: form.short_description,
      subtitle: form.subtitle,
      topic_number: form.topic_number ? Number(form.topic_number) : null,
      reading_time: Number(form.reading_time) || 10,
      difficulty: form.difficulty,
      status: publish ? 'PUBLISHED' : form.status,
      display_order: Number(form.display_order) || 0,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (!topicId) {
        const res = await api.post<{ topic: Topic }>('/admin/topics', payload);
        setTopicId(res.topic.id);
        setMessage(publish ? 'Topic created and published' : 'Draft saved');
        navigate(`/admin/topics/${res.topic.id}`, { replace: true });
      } else {
        await api.put(`/admin/topics/${topicId}`, payload);
        if (publish) await api.post(`/admin/topics/${topicId}/publish`);
        await refreshTopic(topicId);
        setMessage(publish ? 'Published' : 'Draft saved');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function saveSection(e: React.FormEvent) {
    e.preventDefault();
    if (!topicId) {
      setError('Save the topic draft first, then add sections.');
      return;
    }
    const payload = {
      ...sectionForm,
      display_order: Number(sectionForm.display_order) || 0,
    };
    if (editingSection) {
      await api.put(`/admin/sections/${editingSection.id}`, payload);
    } else {
      await api.post(`/admin/topics/${topicId}/sections`, payload);
    }
    setSectionForm({ section_type: 'CONCEPT', title: '', subtitle: '', content: '', display_order: '0' });
    setEditingSection(null);
    await refreshTopic(topicId);
  }

  async function deleteSection(sectionId: string) {
    if (!topicId || !confirm('Delete section?')) return;
    await api.delete(`/admin/sections/${sectionId}`);
    await refreshTopic(topicId);
  }

  async function addDiagram(e: React.FormEvent) {
    e.preventDefault();
    if (!topicId) {
      setError('Save the topic draft first.');
      return;
    }
    const body = new FormData();
    body.append('title', diagramForm.title);
    body.append('description', diagramForm.description);
    body.append('diagram_type', diagramForm.diagram_type);
    if (diagramFile) body.append('file', diagramFile);
    await api.post(`/admin/topics/${topicId}/diagrams`, body);
    setDiagramForm({ title: '', description: '', diagram_type: 'IMAGE' });
    setDiagramFile(null);
    await refreshTopic(topicId);
  }

  async function deleteDiagram(diagramId: string) {
    if (!topicId || !confirm('Delete diagram?')) return;
    await api.delete(`/admin/diagrams/${diagramId}`);
    await refreshTopic(topicId);
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!topicId) {
      setError('Save the topic draft first.');
      return;
    }
    await api.post(`/admin/topics/${topicId}/resources`, resourceForm);
    setResourceForm({ title: '', description: '', resource_type: 'OFFICIAL_DOC', url: '' });
    await refreshTopic(topicId);
  }

  async function deleteResource(resourceId: string) {
    if (!topicId || !confirm('Delete resource?')) return;
    await api.delete(`/admin/resources/${resourceId}`);
    await refreshTopic(topicId);
  }

  return (
    <div className="admin-page topic-editor">
      <div className="admin-toolbar">
        <div>
          <Link to="/admin/topics">← Topics</Link>
          <h1 style={{ marginTop: '0.5rem' }}>{isNew ? 'Create Topic' : `Edit: ${form.title}`}</h1>
        </div>
        <div className="row-actions">
          <button className="btn btn-ghost" type="button" onClick={() => saveTopic(false)}>
            Save Draft
          </button>
          <button className="btn btn-primary" type="button" onClick={() => saveTopic(true)}>
            Publish
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-card">
        <h2>Topic Details</h2>
        <div className="editor-grid">
          <div className="form-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Slug</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" />
          </div>
          <div className="form-field">
            <label>Subtitle / Mental model line</label>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field full">
            <label>Short description</label>
            <textarea
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Topic number</label>
            <input value={form.topic_number} onChange={(e) => setForm({ ...form, topic_number: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Reading time (min)</label>
            <input value={form.reading_time} onChange={(e) => setForm({ ...form, reading_time: e.target.value })} />
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
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="form-field full">
            <label>Tags (comma separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Content Sections</h2>
        <div className="builder-list">
          {sections.map((s, i) => (
            <div key={s.id} className="builder-item">
              <div>
                <strong>
                  {i + 1}. {s.title}
                </strong>
                <span>{s.section_type}</span>
              </div>
              <div className="row-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setEditingSection(s);
                    setSectionForm({
                      section_type: s.section_type,
                      title: s.title,
                      subtitle: s.subtitle || '',
                      content: s.content,
                      display_order: String(s.display_order),
                    });
                  }}
                >
                  Edit
                </button>
                <button className="btn btn-danger" type="button" onClick={() => deleteSection(s.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={saveSection} className="nested-form">
          <h3>{editingSection ? 'Edit Section' : 'Add Section'}</h3>
          <div className="editor-grid">
            <div className="form-field">
              <label>Type</label>
              <select
                value={sectionForm.section_type}
                onChange={(e) => setSectionForm({ ...sectionForm, section_type: e.target.value })}
              >
                {SECTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Title</label>
              <input
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Subtitle</label>
              <input
                value={sectionForm.subtitle}
                onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Order</label>
              <input
                value={sectionForm.display_order}
                onChange={(e) => setSectionForm({ ...sectionForm, display_order: e.target.value })}
              />
            </div>
            <div className="form-field full">
              <label>Content</label>
              <textarea
                value={sectionForm.content}
                onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
                rows={8}
                required
              />
            </div>
          </div>
          <div className="row-actions">
            <button className="btn btn-primary" type="submit">
              {editingSection ? 'Update Section' : '+ Add Section'}
            </button>
            {editingSection && (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setEditingSection(null);
                  setSectionForm({
                    section_type: 'CONCEPT',
                    title: '',
                    subtitle: '',
                    content: '',
                    display_order: '0',
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2>Diagrams</h2>
        <div className="builder-list">
          {diagrams.map((d) => (
            <div key={d.id} className="builder-item">
              <div>
                <strong>{d.title}</strong>
                <span>
                  {d.diagram_type}
                  {d.file_path ? ` · ${d.file_path}` : ' · no file'}
                </span>
                {d.file_path && d.diagram_type !== 'HTML' && (
                  <img src={assetUrl(d.file_path)} alt={d.title} className="diagram-thumb" />
                )}
              </div>
              <button className="btn btn-danger" type="button" onClick={() => deleteDiagram(d.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addDiagram} className="nested-form">
          <h3>+ Add Diagram</h3>
          <div className="editor-grid">
            <div className="form-field">
              <label>Title</label>
              <input
                value={diagramForm.title}
                onChange={(e) => setDiagramForm({ ...diagramForm, title: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Type</label>
              <select
                value={diagramForm.diagram_type}
                onChange={(e) => setDiagramForm({ ...diagramForm, diagram_type: e.target.value })}
              >
                <option value="IMAGE">IMAGE (PNG/JPG/WebP)</option>
                <option value="SVG">SVG</option>
                <option value="HTML">HTML</option>
              </select>
            </div>
            <div className="form-field full">
              <label>Description</label>
              <input
                value={diagramForm.description}
                onChange={(e) => setDiagramForm({ ...diagramForm, description: e.target.value })}
              />
            </div>
            <div className="form-field full">
              <label>Upload file</label>
              <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.html" onChange={(e) => setDiagramFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">
            Save Diagram
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h2>Resources</h2>
        <div className="builder-list">
          {resources.map((r) => (
            <div key={r.id} className="builder-item">
              <div>
                <strong>{r.title}</strong>
                <span>
                  {r.resource_type}
                  {r.url ? ` · ${r.url}` : ''}
                </span>
              </div>
              <button className="btn btn-danger" type="button" onClick={() => deleteResource(r.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addResource} className="nested-form">
          <h3>+ Add Resource</h3>
          <div className="editor-grid">
            <div className="form-field">
              <label>Title</label>
              <input
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Type</label>
              <select
                value={resourceForm.resource_type}
                onChange={(e) => setResourceForm({ ...resourceForm, resource_type: e.target.value })}
              >
                {['OFFICIAL_DOC', 'VIDEO', 'ARTICLE', 'PDF', 'GITHUB', 'CHEAT_SHEET', 'REFERENCE', 'OTHER'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="form-field full">
              <label>URL</label>
              <input
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
              />
            </div>
            <div className="form-field full">
              <label>Description</label>
              <input
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">
            Save Resource
          </button>
        </form>
      </div>
    </div>
  );
}
