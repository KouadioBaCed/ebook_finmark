import { useState, type FormEvent, type MouseEvent } from 'react';
import {
  COURSE_NAMES,
  COURSE_PRICES,
  createCoursePayment,
  formatPriceXof,
  isSafeRedirectUrl,
  PaymentApiError,
  type CourseSlug,
} from '../services/payment';

interface Props {
  slug: CourseSlug;
  onClose: () => void;
}

export function PaymentModal({ slug, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Veuillez saisir un email valide.');
      return;
    }
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^\+?\d[\d\s.-]{6,}$/.test(trimmedPhone)) {
      setError('Numéro de téléphone invalide.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createCoursePayment({
        courseSlug: slug,
        email: email.trim(),
        displayName: name.trim() || undefined,
        phone: trimmedPhone || undefined,
      });
      // On garde la ref marchand (MTX-…) en local : GeniusPay redirige avec un id checkout
      // (TXN-…) que leur API ne reconnaît pas — la page success utilisera cette ref-ci.
      try {
        localStorage.setItem('finmark.lastPaymentReference', res.reference);
        localStorage.setItem('finmark.lastPaymentSlug', slug);
      } catch { /* storage may be unavailable */ }
      const target = res.checkout_url || res.payment_url;
      if (!target || !isSafeRedirectUrl(target)) {
        throw new Error('URL de redirection invalide.');
      }
      window.location.href = target;
    } catch (err) {
      const message = err instanceof PaymentApiError ? err.message : "Impossible d'initier le paiement. Réessayez.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="pm-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="pm-card" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div className="pm-head">
          <button type="button" className="pm-close" onClick={onClose} disabled={submitting} aria-label="Fermer">✕</button>
          <div className="pm-title">Souscrire à cette formation</div>
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

            <div className="pm-field">
              <label className="pm-label" htmlFor="pm-email">Email *</label>
              <input
                id="pm-email"
                type="email"
                className="pm-input"
                placeholder="vous@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <div className="pm-hint">Le lien d'accès vous sera envoyé à cette adresse.</div>
            </div>

            <div className="pm-field">
              <label className="pm-label" htmlFor="pm-name">Nom complet (optionnel)</label>
              <input
                id="pm-name"
                type="text"
                className="pm-input"
                placeholder="Aminata Koné"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
              <div className="pm-hint">Servira à personnaliser votre certificat.</div>
            </div>

            <div className="pm-field">
              <label className="pm-label" htmlFor="pm-phone">Téléphone (optionnel)</label>
              <input
                id="pm-phone"
                type="tel"
                className="pm-input"
                placeholder="+225 0700000000"
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
            <button type="submit" className="pm-btn pm-btn-pay" disabled={submitting}>
              {submitting ? 'Création du paiement…' : `Payer ${formatPriceXof(COURSE_PRICES[slug])}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
