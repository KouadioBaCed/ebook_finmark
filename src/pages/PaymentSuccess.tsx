import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  COURSE_NAMES,
  verifyCoursePayment,
  type CourseSlug,
  PaymentApiError,
} from '../services/payment';
import { useAuth } from '../contexts/AuthContext';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; slug: CourseSlug }
  | { kind: 'pending'; slug?: CourseSlug }
  | { kind: 'error'; message: string };

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { appUser, addUnlockedCourse, loading: authLoading } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (authLoading) return; // attendre que l'auth soit chargée

    const courseParam = params.get('course') as CourseSlug | null;
    const urlRef = params.get('reference') || '';
    let storedRef = '';
    let storedSlug: CourseSlug | null = null;
    try {
      storedRef = localStorage.getItem('finmark.lastPaymentReference') || '';
      storedSlug = (localStorage.getItem('finmark.lastPaymentSlug') as CourseSlug | null) || null;
    } catch { /* ignore */ }
    const ref = urlRef || storedRef;
    const slug = courseParam || storedSlug;

    if (!ref) {
      setState({ kind: 'error', message: 'Référence de paiement introuvable.' });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // storedRef (MTX-…) est passé comme merchant_ref pour le cas où l'URL ref soit
        // un TXN-… que GeniusPay ne reconnaît pas sur /payments/{id}.
        const tx = await verifyCoursePayment(ref, storedRef);
        if (cancelled) return;
        const status = String(tx.status || '').toLowerCase();
        if (status === 'completed' || status === 'succeeded' || status === 'success') {
          const finalSlug = (tx.metadata?.course_slug as CourseSlug) || slug || 'dataviz';
          // Si l'utilisateur est connecté → on débloque dans Firestore.
          if (appUser) {
            try { await addUnlockedCourse(finalSlug); } catch { /* on continue, l'utilisateur peut rafraîchir */ }
          }
          try {
            localStorage.removeItem('finmark.lastPaymentReference');
            localStorage.removeItem('finmark.lastPaymentSlug');
          } catch { /* ignore */ }
          setState({ kind: 'ok', slug: finalSlug });
        } else if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          navigate('/paiement/erreur', { replace: true });
        } else {
          setState({ kind: 'pending', slug: slug || undefined });
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof PaymentApiError ? err.message : 'Erreur lors de la vérification du paiement.';
        setState({ kind: 'error', message: msg });
      }
    })();
    return () => { cancelled = true; };
  }, [params, navigate, appUser, addUnlockedCourse, authLoading]);

  if (state.kind === 'loading' || authLoading) {
    return (
      <div className="page">
        <div className="page-icon page-icon-loading">⏳</div>
        <h1 className="page-h">Vérification de votre paiement…</h1>
        <p className="page-p">Cela ne prend que quelques secondes.</p>
      </div>
    );
  }
  if (state.kind === 'pending') {
    return (
      <div className="page">
        <div className="page-icon page-icon-loading">⏳</div>
        <h1 className="page-h">Paiement en cours de traitement</h1>
        <p className="page-p">
          Votre paiement n'est pas encore confirmé. Cela peut prendre quelques instants.
        </p>
        <button className="page-btn" onClick={() => window.location.reload()}>Rafraîchir</button>
        <button className="page-btn page-btn-outline" onClick={() => navigate('/')}>Accueil</button>
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="page">
        <div className="page-icon page-icon-err">!</div>
        <h1 className="page-h">Une erreur est survenue</h1>
        <p className="page-p">{state.message}</p>
        <button className="page-btn" onClick={() => navigate('/')}>← Retour à l'accueil</button>
      </div>
    );
  }

  // ok
  const isBundle = state.slug === 'bundle';
  return (
    <div className="page">
      <div className="page-icon page-icon-ok">✓</div>
      <h1 className="page-h">Paiement confirmé !</h1>
      <p className="page-p">
        Merci pour votre achat. Vous avez maintenant accès {isBundle ? 'à toutes les formations' : `à la formation ${COURSE_NAMES[state.slug]}`}.
      </p>
      {isBundle ? (
        <button className="page-btn" onClick={() => navigate('/mon-compte')}>Voir mes formations →</button>
      ) : (
        <button className="page-btn" onClick={() => navigate(`/cours/${state.slug}`)}>Accéder à la formation →</button>
      )}
      <button className="page-btn page-btn-outline" onClick={() => navigate('/mon-compte')}>Mon compte</button>
    </div>
  );
}
