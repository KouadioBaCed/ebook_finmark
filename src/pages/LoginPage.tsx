import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/mon-compte';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      const code = (err as { code?: string }).code || '';
      const map: Record<string, string> = {
        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
        'auth/invalid-email': 'Email invalide.',
        'auth/user-not-found': 'Aucun compte avec cet email.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
      };
      setError(map[code] || 'Connexion impossible. Réessayez.');
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ marginTop: 60 }}>
      <h1 className="page-h">Connexion</h1>
      <p className="page-p">Connectez-vous pour accéder à vos formations.</p>
      <form onSubmit={handle} style={{ textAlign: 'left', maxWidth: 380, margin: '0 auto' }}>
        <div className="pm-field">
          <label className="pm-label" htmlFor="login-email">Email</label>
          <input id="login-email" className="pm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="pm-field">
          <label className="pm-label" htmlFor="login-pw">Mot de passe</label>
          <input id="login-pw" className="pm-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" minLength={6} />
        </div>
        {error && <div className="pm-error">{error}</div>}
        <button type="submit" className="page-btn" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--t2)' }}>
        Pas encore de compte ? <Link to={`/inscription?redirect=${encodeURIComponent(redirect)}`} style={{ color: 'var(--g)', fontWeight: 700 }}>Créer un compte</Link>
      </p>
      <p style={{ marginTop: 14 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--t3)' }}>← Retour à l'accueil</Link>
      </p>
    </div>
  );
}
