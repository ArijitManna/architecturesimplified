import { NavLink, Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

export function AdminLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="admin-loading">Loading…</div>;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          Architecture Simplified
        </Link>
        <nav>
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/categories">Categories</NavLink>
          <NavLink to="/admin/topics">Topics</NavLink>
          <NavLink to="/admin/learning-paths">Learning Paths</NavLink>
          <NavLink to="/admin/challenges">Challenges</NavLink>
        </nav>
        <div className="admin-user">
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
