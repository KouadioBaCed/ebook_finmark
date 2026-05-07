import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { COURSE_NAMES, type CourseSlug } from '../services/payment';

const COURSES: Exclude<CourseSlug, 'bundle'>[] = ['dataviz', 'sql', 'kpi', 'python', 'scoring', 'recrutement'];

const COLOR: Record<Exclude<CourseSlug, 'bundle'>, string> = {
  dataviz: '#1DBF73',
  sql: '#3b82f6',
  kpi: '#8b5cf6',
  python: '#f59e0b',
  scoring: '#6366f1',
  recrutement: '#a78bfa',
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtRelative(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `il y a ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `il y a ${day} j`;
  return fmtDate(iso);
}

export function ParcoursPage() {
  const { appUser, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="page"><div className="page-icon page-icon-loading">⏳</div><p className="page-p">Chargement…</p></div>;
  }
  if (!appUser) return <Navigate to="/connexion?redirect=/parcours" replace />;

  const unlocked = new Set(appUser.unlockedCourses);
  const totalUnlocked = COURSES.filter(s => unlocked.has(s)).length;
  const totalChapters = COURSES.reduce((sum, s) => sum + (appUser.progress?.[s]?.chaptersDone?.length || 0), 0);
  const totalExercises = COURSES.reduce((sum, s) => sum + (appUser.progress?.[s]?.exercisesDone?.length || 0), 0);
  const totalQuizzes = COURSES.filter(s => appUser.progress?.[s]?.quizScore).length;

  return (
    <div className="page" style={{ marginTop: 40, maxWidth: 880 }}>
      <h1 className="page-h">Mon parcours</h1>
      <p className="page-p">Bonjour {appUser.displayName} — voici votre progression sur les formations FinMark.</p>

      {/* Stats globales */}
      <div className="parc-stats">
        <Stat label="Formations débloquées" value={`${totalUnlocked}/${COURSES.length}`} />
        <Stat label="Chapitres terminés" value={totalChapters} />
        <Stat label="Exercices résolus" value={totalExercises} />
        <Stat label="QCM passés" value={totalQuizzes} />
      </div>

      {/* Liste des cours */}
      <h2 className="parc-h2">Formations</h2>
      <div className="parc-list">
        {COURSES.map(slug => {
          const ok = unlocked.has(slug);
          const p = appUser.progress?.[slug];
          const color = COLOR[slug];
          return (
            <div key={slug} className="parc-card" style={{ borderLeftColor: ok ? color : 'var(--border)' }}>
              <div className="parc-card-head">
                <div className="parc-card-title">
                  {ok ? '✅' : '🔒'} {COURSE_NAMES[slug]}
                </div>
                {ok && (
                  <button className="parc-open" onClick={() => navigate(`/cours/${slug}`)} style={{ background: color }}>
                    Ouvrir →
                  </button>
                )}
                {!ok && (
                  <Link to="/" className="parc-open" style={{ background: 'var(--bg)', color: 'var(--t2)', border: '1px solid var(--border)' }}>
                    S'inscrire
                  </Link>
                )}
              </div>

              {ok && (
                <div className="parc-meta">
                  <ParcMeta label="Débuté" value={p?.startedAt ? fmtDate(p.startedAt) : 'Pas encore'} />
                  <ParcMeta label="Dernière visite" value={fmtRelative(p?.lastOpenedAt) || '—'} />
                  <ParcMeta label="Chapitres faits" value={p?.chaptersDone?.length ?? 0} />
                  <ParcMeta label="Exercices" value={p?.exercisesDone?.length ?? 0} />
                  <ParcMeta
                    label="QCM"
                    value={
                      p?.quizScore
                        ? `${p.quizScore.score}/${p.quizScore.total}`
                        : 'Non passé'
                    }
                  />
                </div>
              )}

              {ok && p?.quizScore && (
                <div className="parc-quiz" style={{
                  background: p.quizScore.score >= Math.ceil(p.quizScore.total * 0.7) ? '#ecfdf5' : '#fef2f2',
                  borderColor: p.quizScore.score >= Math.ceil(p.quizScore.total * 0.7) ? 'rgba(29,191,115,.3)' : 'rgba(239,68,68,.3)',
                  color: p.quizScore.score >= Math.ceil(p.quizScore.total * 0.7) ? '#065f46' : '#991b1b',
                }}>
                  {p.quizScore.score >= Math.ceil(p.quizScore.total * 0.7) ? '🏆 Réussi' : '📝 Repassez le QCM'} · score : <strong>{p.quizScore.score}/{p.quizScore.total}</strong>
                  <span style={{ opacity: .6, marginLeft: 8 }}>· {fmtDate(p.quizScore.at)}</span>
                </div>
              )}

              {ok && (!p?.chaptersDone?.length && !p?.exercisesDone?.length && !p?.quizScore) && (
                <div className="parc-empty">
                  Pas encore de progression enregistrée. Ouvrez le cours pour commencer.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="page-btn page-btn-outline">← Accueil</Link>
        <Link to="/mon-compte" className="page-btn page-btn-outline">Mon compte</Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="parc-stat">
      <div className="parc-stat-v">{value}</div>
      <div className="parc-stat-l">{label}</div>
    </div>
  );
}

function ParcMeta({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="parc-meta-cell">
      <div className="parc-meta-l">{label}</div>
      <div className="parc-meta-v">{value}</div>
    </div>
  );
}
