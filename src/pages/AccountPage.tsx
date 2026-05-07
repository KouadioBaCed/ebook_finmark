import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { COURSE_NAMES, type CourseSlug } from '../services/payment';

const COURSES: Exclude<CourseSlug, 'bundle'>[] = ['dataviz', 'sql', 'kpi', 'python', 'scoring', 'recrutement'];

export function AccountPage() {
  const { appUser, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="page"><div className="page-icon page-icon-loading">⏳</div><p className="page-p">Chargement…</p></div>;
  }
  if (!appUser) return <Navigate to="/connexion?redirect=/mon-compte" replace />;

  const unlocked = new Set(appUser.unlockedCourses);

  return (
    <div className="page" style={{ marginTop: 60, maxWidth: 720 }}>
      <h1 className="page-h">Bonjour {appUser.displayName} 👋</h1>
      <p className="page-p">{appUser.email}</p>

      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginTop: 24, marginBottom: 14, textAlign: 'left' }}>Mes formations</h2>
      <div style={{ display: 'grid', gap: 10, textAlign: 'left' }}>
        {COURSES.map(slug => {
          const ok = unlocked.has(slug);
          return (
            <div key={slug} className="acc-row" style={{
              border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: ok ? 'var(--card)' : 'var(--bg)',
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 14 }}>
                  {ok ? '✅ ' : '🔒 '}{COURSE_NAMES[slug]}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                  {ok ? 'Accès débloqué' : 'Non débloqué'}
                </div>
              </div>
              {ok ? (
                <button className="page-btn" style={{ margin: 0, padding: '8px 16px', fontSize: 13 }} onClick={() => navigate(`/cours/${slug}`)}>
                  Ouvrir →
                </button>
              ) : (
                <Link to="/" className="page-btn page-btn-outline" style={{ margin: 0, padding: '8px 16px', fontSize: 13 }}>S'inscrire</Link>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="page-btn page-btn-outline">← Accueil</Link>
        <button className="page-btn page-btn-outline" onClick={async () => { await logout(); navigate('/'); }}>Se déconnecter</button>
      </div>
    </div>
  );
}
