import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { COURSE_NAMES, isCourseUnlocked, type CourseSlug } from '../services/payment';

const VALID_SLUGS: CourseSlug[] = ['dataviz', 'sql', 'kpi'];

export function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug || !VALID_SLUGS.includes(slug as CourseSlug)) {
    return <Navigate to="/" replace />;
  }
  const courseSlug = slug as Exclude<CourseSlug, 'bundle'>;

  if (!isCourseUnlocked(courseSlug)) {
    return (
      <div className="page">
        <div className="page-icon page-icon-err">🔒</div>
        <h1 className="page-h">Accès verrouillé</h1>
        <p className="page-p">
          Cette formation nécessite un paiement valide. Retournez à l'accueil pour
          souscrire à <strong>{COURSE_NAMES[courseSlug]}</strong>.
        </p>
        <button className="page-btn" onClick={() => navigate('/')}>← Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <>
      <div className="course-bar">
        <button className="course-back" onClick={() => navigate('/')}>← Accueil</button>
        <div className="course-title">{COURSE_NAMES[courseSlug]}</div>
        <div style={{ width: 70 }}></div>
      </div>
      <iframe
        title={COURSE_NAMES[courseSlug]}
        src={`/courses/${courseSlug}.html`}
        className="course-frame course-frame-with-bar"
      />
    </>
  );
}
