import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { COURSE_NAMES, type CourseSlug } from '../services/payment';
import { useAuth } from '../contexts/AuthContext';

const VALID_SLUGS: CourseSlug[] = ['dataviz', 'sql', 'kpi', 'python', 'scoring', 'recrutement'];

export function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { appUser, loading } = useAuth();

  if (!slug || !VALID_SLUGS.includes(slug as CourseSlug)) {
    return <Navigate to="/" replace />;
  }
  const courseSlug = slug as Exclude<CourseSlug, 'bundle'>;

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

  if (!appUser.unlockedCourses.includes(courseSlug)) {
    return (
      <div className="page">
        <div className="page-icon page-icon-err">🔒</div>
        <h1 className="page-h">Accès verrouillé</h1>
        <p className="page-p">
          Cette formation nécessite un paiement valide. Retournez à l'accueil pour
          souscrire à <strong>{COURSE_NAMES[courseSlug]}</strong>.
        </p>
        <button className="page-btn" onClick={() => navigate('/')}>← Retour à l'accueil</button>
        <Link to="/mon-compte" className="page-btn page-btn-outline">Mon compte</Link>
      </div>
    );
  }

  return (
    <>
      <div className="course-bar">
        <button className="course-back" onClick={() => navigate('/')}>← Accueil</button>
        <div className="course-title">{COURSE_NAMES[courseSlug]}</div>
        <Link to="/mon-compte" className="course-back" style={{ textDecoration: 'none' }}>Mon compte</Link>
      </div>
      <iframe
        title={COURSE_NAMES[courseSlug]}
        src={`/courses/${courseSlug}.html`}
        className="course-frame course-frame-with-bar"
      />
    </>
  );
}
