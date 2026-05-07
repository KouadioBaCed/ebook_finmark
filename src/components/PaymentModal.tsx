import { useState, type FormEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  COURSE_NAMES,
  COURSE_PRICES,
  createCoursePayment,
  formatPriceXof,
  isSafeRedirectUrl,
  PaymentApiError,
  type CourseSlug,
} from '../services/payment';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  slug: CourseSlug;
  onClose: () => void;
}

export function PaymentModal({ slug, onClose }: Props) {
  const { appUser, loading } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!appUser) return;
    const trimmedPhone = phone.trim() || appUser.phone || '';
    if (trimmedPhone && !/^\+?\d[\d\s.-]{6,}$/.test(trimmedPhone)) {
      setError('Numéro de téléphone invalide.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createCoursePayment({
        courseSlug: slug,
        uid: appUser.uid,
        email: appUser.email,
        displayName: appUser.displayName,
        phone: trimmedPhone || undefined,
      });
      // Sauvegarde la ref marchand (MTX-…) : GeniusPay redirige avec un id checkout (TXN-…)
      // que leur API ne reconnaît pas. La page success utilisera cette ref-ci.
      try {
        localStorage.setItem('finmark.lastPaymentReference', res.reference);
        localStorage.setItem('finmark.lastPaymentSlug', slug);
      } catch { /* ignore */ }
      const target = res.checkout_url || res.payment_url;
      if (!target || !isSafeRedirectUrl(target)) throw new Error('URL de redirection invalide.');
      window.location.href = target;
    } catch (err) {
      const message = err instanceof PaymentApiError ? err.message : "Impossible d'initier le paiement. Réessayez.";
      setError(message);
      setSubmitting(false);
    }
  }

  // ─── Pas connecté → propose login/register ───────────────────────────────
  if (!loading && !appUser) {
    const redirect = encodeURIComponent(`/?slug=${slug}`);
    return (
      <div className="pm-overlay" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="pm-card" onClick={(e: MouseEvent) => e.stopPropagation()}>
          <div className="pm-head">
            <button type="button" className="pm-close" onClick={onClose} aria-label="Fermer">✕</button>
            <div className="pm-title">Connexion requise</div>
            <div className="pm-sub">{COURSE_NAMES[slug]} — {formatPriceXof(COURSE_PRICES[slug])}</div>
          </div>
          <div className="pm-body">
            <div className="pm-info">
              Pour acheter une formation, vous devez avoir un compte FinMark.
              C'est rapide — on vous envoie ensuite directement vers le paiement.
            </div>
          </div>
          <div className="pm-actions">
            <button className="pm-btn pm-btn-cancel" onClick={() => navigate(`/connexion?redirect=${redirect}`)}>
              Se connecter
            </button>
            <button className="pm-btn pm-btn-pay" onClick={() => navigate(`/inscription?redirect=${redirect}`)}>
              Créer un compte →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Connecté → formulaire de paiement ───────────────────────────────────
  return (
    <div className="pm-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="pm-card" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div className="pm-head">
          <button type="button" className="pm-close" onClick={onClose} disabled={submitting} aria-label="Fermer">✕</button>
          <div className="pm-title">S'inscrire à cette formation</div>
          <div className="pm-sub">{COURSE_NAMES[slug]}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pm-body">
            <div className="pm-row">
              <div className="pm-stat">
                <div className="pm-stat-l">Montant</div>
                <div className="pm-stat-v">{formatPriceXof(COURSE_PRICES[slug])}</div>
              </div>
              <div className="pm-stat">
                <div className="pm-stat-l">Accès</div>
                <div className="pm-stat-v">À vie</div>
              </div>
            </div>

            <div className="pm-info">
              Connecté en tant que <strong>{appUser?.email}</strong>.
            </div>

            <div className="pm-field">
              <label className="pm-label" htmlFor="pm-phone">Téléphone (optionnel)</label>
              <input
                id="pm-phone"
                type="tel"
                className="pm-input"
                placeholder={appUser?.phone || '+225 0700000000'}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <div className="pm-info">
              Vous serez redirigé vers GeniusPay pour choisir votre moyen de paiement
              (Wave, Orange Money, MTN, Moov, carte bancaire) et finaliser en toute sécurité.
            </div>

            {error && <div className="pm-error">{error}</div>}
          </div>

          <div className="pm-actions">
            <button type="button" className="pm-btn pm-btn-cancel" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="submit" className="pm-btn pm-btn-pay" disabled={submitting || loading}>
              {submitting ? 'Création du paiement…' : `Payer ${formatPriceXof(COURSE_PRICES[slug])}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
