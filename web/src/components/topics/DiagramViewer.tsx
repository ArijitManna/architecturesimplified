import { useState } from 'react';
import type { Diagram } from '../../types';
import { assetUrl } from '../../api/client';
import './DiagramViewer.css';

export function DiagramViewer({ diagrams }: { diagrams: Diagram[] }) {
  const withFiles = diagrams.filter((d) => d.file_path);
  const placeholders = diagrams.filter((d) => !d.file_path);
  const [active, setActive] = useState(0);
  const all = [...withFiles, ...placeholders];
  if (!all.length) return null;

  const current = all[Math.min(active, all.length - 1)];

  return (
    <section id="diagrams" className="diagram-viewer card">
      <div className="diagram-viewer-head">
        <h2>Architecture Diagrams</h2>
        <p>Explore multiple visuals for this topic</p>
      </div>
      <div className="diagram-tabs">
        {all.map((d, i) => (
          <button
            key={d.id}
            className={`pill ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
            type="button"
          >
            {d.title}
          </button>
        ))}
      </div>
      <div className="diagram-stage">
        {current.file_path ? (
          current.diagram_type === 'HTML' ? (
            <iframe
              title={current.title}
              src={assetUrl(current.file_path)}
              sandbox=""
              className="diagram-frame"
            />
          ) : (
            <img src={assetUrl(current.file_path)} alt={current.title} className="diagram-image" />
          )
        ) : (
          <div className="diagram-placeholder">
            <ArchitecturePlaceholder title={current.title} />
            <p>{current.description || 'Diagram placeholder — upload from Admin Panel'}</p>
          </div>
        )}
      </div>
      {current.description && current.file_path && (
        <p className="diagram-caption">{current.description}</p>
      )}
    </section>
  );
}

function ArchitecturePlaceholder({ title }: { title: string }) {
  return (
    <svg viewBox="0 0 560 220" className="arch-svg" role="img" aria-label={title}>
      <defs>
        <linearGradient id="nodeG" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="560" height="220" rx="16" fill="#0B1220" />
      <Node x={40} y={80} label="Users" />
      <Arrow x1={130} y1={110} x2={180} y2={110} />
      <Node x={190} y={80} label="Edge / CDN" />
      <Arrow x1={280} y1={110} x2={330} y2={110} />
      <Node x={340} y={80} label="Origin" />
      <Arrow x1={430} y1={110} x2={470} y2={70} />
      <Arrow x1={430} y1={110} x2={470} y2={150} />
      <SmallNode x={480} y={40} label="Hot" />
      <SmallNode x={480} y={120} label="Archive" />
      <text x="280" y="200" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="DM Sans">
        {title}
      </text>
    </svg>
  );
}

function Node({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={90} height={60} rx="12" fill="url(#nodeG)" />
      <text x={x + 45} y={y + 35} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

function SmallNode({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={60} height={40} rx="10" fill="#1a2744" stroke="#8B5CF6" />
      <text x={x + 30} y={y + 25} textAnchor="middle" fill="#c4b5fd" fontSize="11">
        {label}
      </text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#60a5fa" strokeWidth="2" markerEnd="url(#arrow)" />
  );
}
