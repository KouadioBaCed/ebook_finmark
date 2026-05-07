import { useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { COURSE_NAMES, type CourseSlug } from '../services/payment';
import { useAuth } from '../contexts/AuthContext';
import type { CourseProgress } from '../contexts/AuthContext';

const VALID_SLUGS: CourseSlug[] = ['dataviz', 'sql', 'kpi', 'python', 'scoring', 'recrutement'];

// Format des messages que les fichiers de cours peuvent envoyer au parent :
// window.parent.postMessage({
//   type: 'finmark.progress',
//   chapter?: 'string',           → ajoute à chaptersDone
//   exercise?: 'string',          → ajoute à exercisesDone
//   quiz?: { score: 7, total: 10 } → enregistre comme quizScore
// }, '*');
interface ProgressMsg {
  type: 'finmark.progress';
  chapter?: string;
  exercise?: string;
  quiz?: { score: number; total: number };
}

export function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { appUser, loading, recordProgress } = useAuth();

  const isValid = !!slug && VALID_SLUGS.includes(slug as CourseSlug);
  const courseSlug = slug as Exclude<CourseSlug, 'bundle'>;
  const isUnlocked = !!(appUser && isValid && appUser.unlockedCourses.includes(courseSlug));

  // Track l'ouverture du cours (lastOpenedAt + startedAt si première fois).
  useEffect(() => {
    if (!isUnlocked) return;
    const now = new Date().toISOString();
    const existing = appUser?.progress?.[courseSlug];
    const patch: Partial<CourseProgress> = { lastOpenedAt: now };
    if (!existing?.startedAt) patch.startedAt = now;
    recordProgress(courseSlug, patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, courseSlug]);

  // Écoute les events postMessage envoyés par l'iframe du cours.
  useEffect(() => {
    if (!isUnlocked) return;
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object' || data.type !== 'finmark.progress') return;
      const msg = data as ProgressMsg;
      const patch: Partial<CourseProgress> = {};
      if (typeof msg.chapter === 'string' && msg.chapter) patch.chaptersDone = [msg.chapter];
      if (typeof msg.exercise === 'string' && msg.exercise) patch.exercisesDone = [msg.exercise];
      if (msg.quiz && typeof msg.quiz.score === 'number' && typeof msg.quiz.total === 'number') {
        patch.quizScore = { score: msg.quiz.score, total: msg.quiz.total, at: new Date().toISOString() };
      }
      if (Object.keys(patch).length > 0) {
        recordProgress(courseSlug, patch);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isUnlocked, courseSlug, recordProgress]);

  if (!isValid) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="page">
        <div className="page-icon page-icon-loading">⏳</div>
        <p className="page-p">Vérification de l'accès…</p>
      </div>
    );
  }

  if (!appUser) {
    const redirect = encodeURIComponent(`/cours/${courseSlug}`);
    return (
      <div className="page">
        <div className="page-icon page-icon-err">🔒</div>
        <h1 className="page-h">Connexion requise</h1>
        <p className="page-p">Connectez-vous pour accéder à <strong>{COURSE_NAMES[courseSlug]}</strong>.</p>
        <Link to={`/connexion?redirect=${redirect}`} className="page-btn">Se connecter</Link>
        <Link to={`/inscription?redirect=${redirect}`} className="page-btn page-btn-outline">Créer un compte</Link>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="page">
        <div className="page-icon page-icon-err">🔒</div>
        <h1 className="page-h">Accès verrouillé</h1>
        <p className="page-p">
          Cette formation nécessite un paiement valide. Retournez à l'accueil pour
          souscrire à <strong>{COURSE_NAMES[courseSlug]}</strong>.
        </p>
        <button className="page-btn" onClick={() => navigate('/')}>← Retour à l'accueil</button>
        <Link to="/parcours" className="page-btn page-btn-outline">Mon parcours</Link>
      </div>
    );
  }

  return (
    <>
      <div className="course-bar">
        <button className="course-back" onClick={() => navigate('/')}>← Accueil</button>
        <div className="course-title">{COURSE_NAMES[courseSlug]}</div>
        <Link to="/parcours" className="course-back" style={{ textDecoration: 'none' }}>Parcours</Link>
      </div>
      <iframe
        title={COURSE_NAMES[courseSlug]}
        src={`/courses/${courseSlug}.html`}
        className="course-frame course-frame-with-bar"
      />
    </>
  );
}
