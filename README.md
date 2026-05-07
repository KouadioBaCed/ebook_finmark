# FinMark Support — App React

Landing page + 3 formations data, avec paiement **GeniusPay** intégré.

Stack : Vite + React 18 + TypeScript + React Router + Netlify Functions.

## Architecture

```
ebook-app/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx           # Conversion JSX du finmark_landing.html
│   │   ├── CoursePage.tsx        # Affiche la formation via <iframe>
│   │   ├── PaymentSuccess.tsx    # Vérifie le paiement et débloque l'accès
│   │   └── PaymentError.tsx
│   ├── components/PaymentModal.tsx
│   ├── services/payment.ts       # Client GeniusPay + gestion accès local
│   └── styles/landing.css
├── public/courses/               # Les 3 cours HTML originaux, servis tels quels
│   ├── dataviz.html
│   ├── sql.html
│   └── kpi.html
├── netlify/functions/
│   ├── create-payment.ts         # POST /api/payment/create
│   └── verify-payment.ts         # GET  /api/payment/verify
└── netlify.toml
```

Les 3 fichiers HTML de cours (très riches : Chart.js, QCM, certificats, etc.) sont
**servis tels quels** depuis `public/courses/` via une `<iframe>` — on conserve
ainsi 100% des interactions sans réécriture.

## Démarrage

```bash
npm install
cp .env.example .env       # puis renseigner les clés GeniusPay

# Dev front uniquement (les appels /api/payment retourneront 404)
npm run dev

# Dev complet avec les Netlify Functions
npm install -g netlify-cli
netlify dev                # → http://localhost:8888
```

En `npm run dev` seul, le proxy Vite renvoie `/api/payment/*` vers `localhost:8888`,
donc lancez `netlify dev` en parallèle si vous voulez tester les paiements.

## Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `GENIUS_PAY_API_KEY` | oui | Clé API GeniusPay |
| `GENIUS_PAY_API_SECRET` | oui | Secret API GeniusPay |
| `GENIUS_PAY_BASE_URL` | non | Défaut: `https://pay.genius.ci/api/v1/merchant` |
| `ALLOWED_ORIGINS` | recommandé | CSV des origines autorisées (CORS + redirect) |
| `GENIUS_PAY_PUBLIC_URL` | non | Fallback si `Origin` absent |

## Prix (source de vérité)

Définis **deux fois** (front + serveur) et doivent rester alignés :

- `src/services/payment.ts` → `COURSE_PRICES`
- `netlify/functions/create-payment.ts` → `COURSE_PRICES`

| Slug | Prix (FCFA) |
|---|---|
| `dataviz` | 12 900 |
| `sql` | 12 900 |
| `kpi` | 12 900 |
| `python` | 12 900 |
| `scoring` | 12 900 |
| `bundle` | 44 900 |

⚠️ Les fichiers HTML pour `python` et `scoring` doivent être déposés dans
`public/courses/python.html` et `public/courses/scoring.html` — sinon les routes
`/cours/python` et `/cours/scoring` afficheront un iframe vide (404).

Le montant envoyé à GeniusPay est **toujours** celui défini côté serveur — toute
valeur envoyée par le client est ignorée.

## Flux de paiement

1. L'utilisateur clique "Acheter" sur la landing → `PaymentModal` s'ouvre.
2. Saisie email (obligatoire) + nom + téléphone (optionnels).
3. `POST /api/payment/create` → la function appelle GeniusPay et reçoit une
   `checkout_url` (Wave / Orange Money / etc.).
4. Le client est redirigé vers GeniusPay. La ref marchand (MTX-…) est posée en
   cookie HttpOnly + sauvegardée dans `localStorage`.
5. Après paiement, GeniusPay redirige vers `/paiement/succes?course=…&reference=…`.
6. `PaymentSuccess` appelle `GET /api/payment/verify` (qui essaie d'abord la ref
   URL, puis la ref cookie).
7. Si `status === 'completed'`, le cours est débloqué via `localStorage` et
   l'utilisateur peut accéder à `/cours/:slug`.

## Sécurité — limitations connues

L'accès aux cours est gardé par un simple flag `localStorage`. C'est suffisant
pour décourager les utilisateurs casual mais pas une vraie protection : les
fichiers `.html` sont publiquement accessibles à `/courses/dataviz.html`, etc.
Pour une vraie protection il faudrait :

- Servir les HTML via une Netlify Function authentifiée (token signé après
  paiement) plutôt que depuis `public/`.
- Ou ajouter une couche d'auth (Firebase Auth comme dans `topic_exam`) pour
  matcher chaque achat à un compte utilisateur côté serveur.

## Déploiement Netlify

```bash
netlify init           # ou link à un site existant
netlify env:set GENIUS_PAY_API_KEY xxx
netlify env:set GENIUS_PAY_API_SECRET xxx
netlify env:set ALLOWED_ORIGINS https://votre-site.netlify.app
netlify deploy --prod
```
