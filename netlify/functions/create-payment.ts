// Netlify Function: création d'un paiement GeniusPay côté serveur.
// La clé X-API-Secret est lue depuis les variables d'environnement Netlify.
// Inspiré de topic_exam/netlify/functions/create-payment.ts

interface CreatePaymentBody {
  courseSlug: string;
  courseName?: string;
  email?: string;
  displayName?: string;
  phone?: string;
  origin?: string;
  paymentMethod?: 'wave' | 'orange_money' | 'mtn_money' | 'moov_money' | 'card' | 'checkout';
}

// ⚠️ Source de vérité du prix : doit rester aligné avec src/services/payment.ts (COURSE_PRICES).
const COURSE_PRICES: Record<string, number> = {
  dataviz: 12900,
  sql: 12900,
  kpi: 12900,
  bundle: 29900,
};

const ALLOWED_METHODS = ['wave', 'orange_money', 'mtn_money', 'moov_money', 'card'] as const;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.length === 0) return true; // pas configuré → permissif (dev)
  return ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(origin: string | null) {
  const allow = isAllowedOrigin(origin) ? origin! : (ALLOWED_ORIGINS[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function json(body: unknown, status = 200, origin: string | null = null, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

const isValidEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
const isValidPhone = (s: string): boolean => /^\+?\d[\d\s.-]{6,20}$/.test(s);

export default async (req: Request) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, 405, origin);
  }

  if (origin && !isAllowedOrigin(origin)) {
    return json({ success: false, error: { code: 'ORIGIN_NOT_ALLOWED', message: 'Origin not allowed' } }, 403, origin);
  }

  const apiKey = process.env.GENIUS_PAY_API_KEY;
  const apiSecret = process.env.GENIUS_PAY_API_SECRET;
  const baseUrl = process.env.GENIUS_PAY_BASE_URL || 'https://pay.genius.ci/api/v1/merchant';

  if (!apiKey || !apiSecret) {
    return json({ success: false, error: { code: 'CONFIG_MISSING', message: 'GeniusPay credentials are not configured on the server' } }, 500, origin);
  }

  let body: CreatePaymentBody;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } }, 400, origin);
  }

  // Validation stricte des inputs (anti-injection metadata, anti-flood, anti-typo)
  if (!body.courseSlug || typeof body.courseSlug !== 'string' || !(body.courseSlug in COURSE_PRICES)) {
    return json({ success: false, error: { code: 'INVALID_COURSE', message: 'Unknown course slug' } }, 422, origin);
  }
  if (!body.email || typeof body.email !== 'string' || !isValidEmail(body.email)) {
    return json({ success: false, error: { code: 'INVALID_EMAIL', message: 'Invalid email' } }, 422, origin);
  }
  if (body.phone && (typeof body.phone !== 'string' || !isValidPhone(body.phone))) {
    return json({ success: false, error: { code: 'INVALID_PHONE', message: 'Invalid phone' } }, 422, origin);
  }
  if (body.displayName && (typeof body.displayName !== 'string' || body.displayName.length > 80)) {
    return json({ success: false, error: { code: 'INVALID_NAME', message: 'Invalid display name' } }, 422, origin);
  }

  const requestOrigin = body.origin || origin || process.env.GENIUS_PAY_PUBLIC_URL || '';
  const safeOrigin = isAllowedOrigin(requestOrigin) ? requestOrigin : (ALLOWED_ORIGINS[0] || '');
  const success_url = safeOrigin ? `${safeOrigin}/paiement/succes?course=${encodeURIComponent(body.courseSlug)}` : undefined;
  const error_url = safeOrigin ? `${safeOrigin}/paiement/erreur?course=${encodeURIComponent(body.courseSlug)}` : undefined;

  const payload: Record<string, unknown> = {
    // ⚠️ Le montant est défini ICI côté serveur — toute valeur envoyée par le client est ignorée.
    amount: COURSE_PRICES[body.courseSlug],
    currency: 'XOF',
    description: `FinMark — ${(body.courseName || body.courseSlug).slice(0, 200)}`,
    customer: {
      name: body.displayName,
      email: body.email,
      phone: body.phone,
    },
    success_url,
    error_url,
    metadata: {
      course_slug: body.courseSlug,
      email: body.email,
      display_name: body.displayName || '',
    },
  };

  if (body.paymentMethod && body.paymentMethod !== 'checkout' && (ALLOWED_METHODS as readonly string[]).includes(body.paymentMethod)) {
    payload.payment_method = body.paymentMethod;
  }

  try {
    const upstream = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok || !data?.success) {
      return json(
        {
          success: false,
          error: data?.error || { code: 'PAYMENT_INIT_FAILED', message: 'Unable to initiate payment' },
        },
        upstream.status || 502,
        origin,
      );
    }

    // Cookie HttpOnly avec la ref marchand : verify-payment l'utilisera comme source d'autorité.
    const merchantRef = String(data.data.reference || '');
    const setCookie = `gpRef=${encodeURIComponent(merchantRef)}; Path=/; Max-Age=3600; SameSite=Lax; Secure; HttpOnly`;

    return json({
      success: true,
      data: {
        reference: data.data.reference,
        amount: data.data.amount,
        currency: data.data.currency || 'XOF',
        status: data.data.status,
        checkout_url: data.data.checkout_url || data.data.payment_url,
        payment_url: data.data.payment_url || data.data.checkout_url,
        expires_at: data.data.expires_at,
      },
    }, 200, origin, merchantRef ? { 'Set-Cookie': setCookie } : {});
  } catch (err) {
    return json({
      success: false,
      error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' },
    }, 502, origin);
  }
};
