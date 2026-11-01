import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useSeo } from '../hooks/useSeo';
import type { Challenge, ChallengeOption } from '../types';
import './ChallengeDetailPage.css';

export function ChallengeDetailPage() {
  const { slug = '' } = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [options, setOptions] = useState<ChallengeOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    explanation: string | null;
    correct_option_ids: string[];
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ challenge: Challenge; options: ChallengeOption[] }>(`/challenges/${slug}`)
      .then((res) => {
        setChallenge(res.challenge);
        setOptions(res.options);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  useSeo({
    title: challenge ? `${challenge.title} | Architecture Simplified` : 'Challenge',
    description: challenge?.description || undefined,
  });

  async function submit() {
    if (!selected) return;
    const res = await api.post<{
      correct: boolean;
      explanation: string | null;
      correct_option_ids: string[];
    }>(`/challenges/${slug}/submit`, { option_id: selected });
    setResult(res);
  }

  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!challenge) return <div className="container"><p className="muted-on-dark">Loading…</p></div>;

  return (
    <div className="challenge-detail">
      <div className="container">
        <section className="hero-panel">
          <h1>Architecture Challenge</h1>
          <p>
            {challenge.challenge_number
              ? `Challenge #${String(challenge.challenge_number).padStart(2, '0')}: `
              : ''}
            {challenge.title}
          </p>
        </section>

        <div className="challenge-layout">
          <div className="card challenge-panel">
            <div className="challenge-head">
              <h2>{challenge.title}</h2>
              <span className={`badge badge-${challenge.difficulty.toLowerCase()}`}>
                {challenge.difficulty}
              </span>
            </div>
            <p>{challenge.description}</p>
            {challenge.scenario && (
              <>
                <h3>Scenario</h3>
                <p>{challenge.scenario}</p>
              </>
            )}
            <h3>Requirements</h3>
            <ul className="req-list">
              {(challenge.requirements || []).map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="card challenge-panel">
            <h3>Your Task</h3>
            <p>Choose the architecture approach that best satisfies the requirements.</p>
            <div className="option-list">
              {options.map((opt) => {
                const isSelected = selected === opt.id;
                const showCorrect = result?.correct_option_ids.includes(opt.id);
                const showWrong = result && isSelected && !result.correct;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`option-card ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''}`}
                    onClick={() => !result && setSelected(opt.id)}
                    disabled={!!result}
                  >
                    <strong>{opt.title}</strong>
                    <span>{opt.description}</span>
                  </button>
                );
              })}
            </div>
            {!result ? (
              <button className="btn btn-primary" type="button" disabled={!selected} onClick={submit}>
                Submit Answer
              </button>
            ) : (
              <div className={`alert ${result.correct ? 'alert-success' : 'alert-error'}`}>
                <strong>{result.correct ? 'Correct!' : 'Not quite.'}</strong>
                <p style={{ margin: '0.4rem 0 0' }}>{result.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
