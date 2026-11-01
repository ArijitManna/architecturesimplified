import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>Architecture Simplified</strong>
          <p>Complex Technology Through Simple Mental Models</p>
        </div>
        <div className="footer-links">
          <Link to="/topics">Topics</Link>
          <Link to="/learning-paths">Learning Paths</Link>
          <Link to="/challenges">Challenges</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
