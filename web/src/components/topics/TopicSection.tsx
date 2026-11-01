import type { TopicSection as Section } from '../../types';
import './TopicSectionView.css';

const TYPE_CLASS: Record<string, string> = {
  EXAM_TIP: 'section-exam',
  SCENARIO: 'section-scenario',
  KEY_TAKEAWAY: 'section-takeaway',
  ARCHITECTURE: 'section-architecture',
};

function renderMarkdownLite(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    const [header, ...rest] = tableRows.filter((r) => !r.every((c) => /^[-:]+$/.test(c)));
    elements.push(
      <table key={`t-${elements.length}`}>
        <thead>
          <tr>
            {header.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rest.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => (
                <td key={ci}>{formatInline(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
    tableRows = [];
    inTable = false;
  };

  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      inTable = true;
      tableRows.push(
        line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );
      continue;
    }
    if (inTable) flushTable();

    if (!line.trim()) {
      elements.push(<br key={`b-${elements.length}`} />);
      continue;
    }
    if (line.startsWith('- ')) {
      elements.push(
        <li key={`li-${elements.length}`}>{formatInline(line.slice(2))}</li>
      );
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={`oli-${elements.length}`}>{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
      );
      continue;
    }
    elements.push(<p key={`p-${elements.length}`}>{formatInline(line)}</p>);
  }
  if (inTable) flushTable();

  return elements;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function TopicSectionView({ section }: { section: Section }) {
  const extra = TYPE_CLASS[section.section_type] || '';
  const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <section id={id} className={`topic-section card ${extra}`}>
      <div className="topic-section-head">
        <span className="section-type-pill">{section.section_type.replace(/_/g, ' ')}</span>
        <h2>{section.title}</h2>
        {section.subtitle && <p className="section-sub">{section.subtitle}</p>}
      </div>
      <div className="prose">{renderMarkdownLite(section.content)}</div>
    </section>
  );
}
