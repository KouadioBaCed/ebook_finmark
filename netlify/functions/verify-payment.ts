// Netlify Function: vérification d'un paiement GeniusPay par référence.
// Usage: GET /api/payment/verify?reference=MTX-XXXX  ou  reference=TXN-XXXX
//
// La référence URL renvoyée par GeniusPay (TXN-…) n'est pas reconnue par leur
// endpoint /payments/{id} : seule la ref marchand (MTX-…) qu'on a obtenue à la
// création fonctionne. On lit donc le cookie `gpRef` posé par create-payment
// comme source d'autorité, et on retombe sur la ref URL en dernier recours.
// Adapté de topic_exam/netlify/functions/verify-payment.ts

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const REF_RE = /^[A-Z]{2,5}-[A-Z0-9]{4,60}$/i;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.length === 0) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(origin: string | null) {
  const allow = isAllowedOrigin(origin) ? origin! : (ALLOWED_ORIGINS[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

function getCookie(req: Request, name: string): string {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

interface GeniusPayTx {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string | null;
  metadata?: Record<string, string>;
  completed_at?: string | null;
  created_at?: string;
}

async function fetchPayment(
  baseUrl: string,
  ref: string,
  apiKey: string,
  apiSecret: string,
): Promise<{ ok: boolean; status: number; tx?: GeniusPayTx; error?: { code: string; message: string }; raw?: string }> {
  const url = `${baseUrl}/payments/${encodeURIComponent(ref)}`;
  console.log('[verify-payment] GET', url);
  const upstream = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret,
      Accept: 'application/json',
    },
  });
  const rawText = await upstream.text();
  console.log('[verify-payment] upstream status', upstream.status, 'body', rawText.slice(0, 500));
  let data: { success?: boolean; data?: GeniusPayTx; error?: { code: string; message: string } } | null = null;
  try { data = rawText ? JSON.parse(rawText) : null; } catch { /* not JSON */ }
  if (upstream.ok && data?.success) {
    return { ok: true, status: upstream.status, tx: data.data as GeniusPayTx };
  }
  return {
    ok: false,
    status: upstream.status || 404,
    error: data?.error || { code: 'TRANSACTION_NOT_FOUND', message: `Transaction not found (upstream ${upstream.status}: ${rawText.slice(0, 200)})` },
    raw: rawText.slice(0, 500),
  };
}

export default async (req: Request) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'GET') {
    return json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, 405, origin);
  }
  if (origin && !isAllowedOrigin(origin)) {
    return json({ success: false, error: { code: 'ORIGIN_NOT_ALLOWED', message: 'Origin not allowed' } }, 403, origin);
  }

  const apiKey = process.env.GENIUS_PAY_API_KEY;
  const apiSecret = process.env.GENIUS_PAY_API_SECRET;
  const baseUrl = process.env.GENIUS_PAY_BASE_URL || 'https://pay.genius.ci/api/v1/merchant';

  if (!apiKey || !apiSecret) {
    console.error('[verify-payment] Missing API credentials in env');
    return json({ success: false, error: { code: 'CONFIG_MISSING', message: 'GeniusPay credentials are not configured on the server' } }, 500, origin);
  }
  console.log('[verify-payment] credentials present, key prefix=', apiKey.slice(0, 8));

  const url = new URL(req.url);
  const urlRef = url.searchParams.get('reference') || '';
  const cookieRef = getCookie(req, 'gpRef');
  console.log('[verify-payment] urlRef=', urlRef, 'cookieRef=', cookieRef);

  const candidates: string[] = [];
  if (urlRef && REF_RE.test(urlRef)) candidates.push(urlRef);
  if (cookieRef && REF_RE.test(cookieRef) && cookieRef !== urlRef) candidates.push(cookieRef);

  if (candidates.length === 0) {
    return json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'A valid reference is required' } }, 422, origin);
  }

  let lastError: { code: string; message: string } | null = null;
  let lastStatus = 404;

  try {
    for (const ref of candidates) {
      const r = await fetchPayment(baseUrl, ref, apiKey, apiSecret);
      if (r.ok && r.tx) {
        const clearCookie = 'gpRef=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly';
        return json(
          {
            success: true,
            data: {
              reference: r.tx.reference,
              amount: r.tx.amount,
              currency: r.tx.currency,
              status: r.tx.status,
              payment_method: r.tx.payment_method,
              metadata: r.tx.metadata || {},
              completed_at: r.tx.completed_at,
              created_at: r.tx.created_at,
            },
          },
          200,
          origin,
          { 'Set-Cookie': clearCookie },
        );
      }
      lastError = r.error || lastError;
      lastStatus = r.status || lastStatus;
    }
    return json({ success: false, error: lastError || { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found' } }, lastStatus, origin);
  } catch (err) {
    return json({
      success: false,
      error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' },
    }, 502, origin);
  }
};
