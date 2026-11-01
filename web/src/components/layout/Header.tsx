import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Header.css';

export function Header() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 40 40" width="36" height="36">
              <defs>
                <linearGradient id="brandG" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <path
                d="M20 6c-5 0-9 2.5-10 6.5C6.5 13 4 16 4 20c0 4.5 3.5 8 8 8.5h16c4.5 0 9-3.2 9-8.5 0-4.2-3.2-7.2-7.5-8C28.5 8 24 6 20 6z"
                fill="url(#brandG)"
              />
              <circle cx="20" cy="24" r="3.2" fill="#0B1220" />
            </svg>
          </span>
          <span className="brand-text">Architecture Simplified</span>
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`site-nav ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/topics" onClick={() => setOpen(false)}>
            Topics
          </NavLink>
          <NavLink to="/learning-paths" onClick={() => setOpen(false)}>
            Learning Paths
          </NavLink>
          <NavLink to="/challenges" onClick={() => setOpen(false)}>
            Challenges
          </NavLink>
          <form className="header-search" onSubmit={onSearch}>
            <input
              type="search"
              placeholder="Search topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
            />
          </form>
        </nav>
      </div>
    </header>
  );
}
