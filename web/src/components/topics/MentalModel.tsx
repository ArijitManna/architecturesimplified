import type { TopicSection } from '../../types';
import './MentalModel.css';

export function MentalModel({ section }: { section: TopicSection }) {
  return (
    <section id="mental-model" className="mental-model card">
      <div className="mental-model-visual" aria-hidden>
        <div className="mm-illustration">
          <div className="mm-building" />
          <div className="mm-glow" />
        </div>
      </div>
      <div className="mental-model-body">
        <p className="mm-label">The Mental Model</p>
        <h2>{section.subtitle || section.title}</h2>
        <div className="prose">
          {section.content.split('\n').map((line, i) =>
            line.trim() ? <p key={i}>{line}</p> : <br key={i} />
          )}
        </div>
      </div>
    </section>
  );
}
