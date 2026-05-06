// Service de paiement GeniusPay côté client.
// Inspiré de topic_exam/src/services/payment.ts

export type CourseSlug = 'dataviz' | 'sql' | 'kpi' | 'bundle';

// Doit rester aligné avec COURSE_PRICES dans netlify/functions/create-payment.ts.
export const COURSE_PRICES: Record<CourseSlug, number> = {
  dataviz: 12900,
  sql: 12900,
  kpi: 12900,
  bundle: 29900,
};

export const COURSE_NAMES: Record<CourseSlug, string> = {
  dataviz: 'Maîtriser la Data Visualisation',
  sql: 'Maîtriser SQL',
  kpi: 'Maîtriser les KPIs',
  bundle: 'Bundle — 3 formations data',
};

export interface CreatePaymentParams {
  courseSlug: CourseSlug;
  email: string;
  displayName?: string;
  phone?: string;
}

export interface CreatePaymentResponse {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  checkout_url?: string;
  payment_url?: string;
  expires_at?: string;
}

export interface VerifyPaymentResponse {
  reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired' | string;
  payment_method?: string | null;
  metadata: Record<string, string>;
  completed_at?: string | null;
  created_at?: string;
}

interface ApiError {
  code: string;
  message: string;
}

export class PaymentApiError extends Error {
  code: string;
  status: number;
  constructor(error: ApiError, status: number) {
    super(error.message);
    this.code = error.code;
    this.status = status;
  }
}

const ALLOWED_REDIRECT_HOSTS = [
  'pay.genius.ci',
  'genius.ci',
  'wave.com',
  'pay.wave.com',
  'paystack.com',
  'checkout.paystack.com',
];

export function isSafeRedirectUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_REDIRECT_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export function formatPriceXof(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export async function createCoursePayment(params: CreatePaymentParams): Promise<CreatePaymentResponse> {
  let res: Response;
  try {
    res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        ...params,
        courseName: COURSE_NAMES[params.courseSlug],
        origin: window.location.origin,
      }),
    });
  } catch {
    throw new PaymentApiError(
      { code: 'NETWORK_ERROR', message: 'Impossible de contacter le serveur de paiement (vérifiez votre connexion).' },
      0,
    );
  }

  if (res.status === 404) {
    throw new PaymentApiError(
      { code: 'FUNCTION_NOT_DEPLOYED', message: "Le service de paiement n'est pas déployé." },
      404,
    );
  }

  const text = await res.text();
  let data: { success?: boolean; data?: CreatePaymentResponse; error?: ApiError } | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new PaymentApiError(
      { code: 'BAD_RESPONSE', message: `Réponse invalide du serveur (HTTP ${res.status}).` },
      res.status,
    );
  }

  if (!res.ok || !data?.success) {
    const err: ApiError = data?.error || { code: 'UNKNOWN', message: `Erreur HTTP ${res.status}` };
    throw new PaymentApiError(err, res.status);
  }
  return data.data as CreatePaymentResponse;
}

export async function verifyCoursePayment(reference: string): Promise<VerifyPaymentResponse> {
  const res = await fetch(`/api/payment/verify?reference=${encodeURIComponent(reference)}`, {
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    const err: ApiError = data?.error || { code: 'UNKNOWN', message: 'Erreur inconnue' };
    throw new PaymentApiError(err, res.status);
  }
  return data.data as VerifyPaymentResponse;
}

// Stockage local des cours débloqués après paiement validé.
const UNLOCK_KEY = 'finmark.unlocked';

export function getUnlockedCourses(): CourseSlug[] {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is CourseSlug => s in COURSE_PRICES) : [];
  } catch {
    return [];
  }
}

export function unlockCourse(slug: CourseSlug): void {
  const current = new Set(getUnlockedCourses());
  if (slug === 'bundle') {
    current.add('dataviz');
    current.add('sql');
    current.add('kpi');
  } else {
    current.add(slug);
  }
  try {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify([...current]));
  } catch { /* ignore */ }
}

export function isCourseUnlocked(slug: CourseSlug): boolean {
  return getUnlockedCourses().includes(slug);
}
