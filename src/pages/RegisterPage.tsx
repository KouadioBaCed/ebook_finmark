import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/mon-compte';
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Veuillez saisir votre nom complet.'); return; }
    if (password !== password2) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères minimum).'); return; }
    setSubmitting(true);
    try {
      await register(email, password, name.trim(), phone.trim() || undefined);
      navigate(redirect, { replace: true });
    } catch (err) {
      const code = (err as { code?: string }).code || '';
      const map: Record<string, string> = {
        'auth/email-already-in-use': 'Un compte existe déjà avec cet email. Connectez-vous.',
        'auth/invalid-email': 'Email invalide.',
        'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
      };
      setError(map[code] || "Inscription impossible. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ marginTop: 60 }}>
      <h1 className="page-h">Créer un compte</h1>
      <p className="page-p">Créez votre compte FinMark pour suivre vos formations.</p>
      <form onSubmit={handle} style={{ textAlign: 'left', maxWidth: 380, margin: '0 auto' }}>
        <div className="pm-field">
          <label className="pm-label" htmlFor="reg-name">Nom complet *</label>
          <input id="reg-name" className="pm-input" type="text" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
        </div>
        <div className="pm-field">
          <label className="pm-label" htmlFor="reg-email">Email *</label>
          <input id="reg-email" className="pm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="pm-field">
          <label className="pm-label" htmlFor="reg-phone">Téléphone (optionnel)</label>
          <input id="reg-phone" className="pm-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+225 0700000000" autoComplete="tel" />
        </div>
        <div className="pm-field">
          <label className="pm-label" htmlFor="reg-pw">Mot de passe *</label>
          <input id="reg-pw" className="pm-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" minLength={6} />
        </div>
        <div className="pm-field">
          <label className="pm-label" htmlFor="reg-pw2">Confirmer le mot de passe *</label>
          <input id="reg-pw2" className="pm-input" type="password" value={password2} onChange={e => setPassword2(e.target.value)} required autoComplete="new-password" minLength={6} />
        </div>
        {error && <div className="pm-error">{error}</div>}
        <button type="submit" className="page-btn" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--t2)' }}>
        Déjà un compte ? <Link to={`/connexion?redirect=${encodeURIComponent(redirect)}`} style={{ color: 'var(--g)', fontWeight: 700 }}>Se connecter</Link>
      </p>
      <p style={{ marginTop: 14 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--t3)' }}>← Retour à l'accueil</Link>
      </p>
    </div>
  );
}
