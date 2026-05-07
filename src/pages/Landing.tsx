import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '../components/PaymentModal';
import { useAuth } from '../contexts/AuthContext';
import type { CourseSlug } from '../services/payment';

const PAID_COURSES: Exclude<CourseSlug, 'bundle'>[] = ['dataviz', 'sql', 'kpi', 'python', 'scoring', 'recrutement'];

export function Landing() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [openSlug, setOpenSlug] = useState<CourseSlug | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [topbarVisible, setTopbarVisible] = useState(true);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const unlocked = new Set(appUser?.unlockedCourses || []);
  const isUnlocked = (slug: Exclude<CourseSlug, 'bundle'>) => unlocked.has(slug);
  const isBundleUnlocked = PAID_COURSES.every(s => unlocked.has(s));

  // Pour les boutons "Acheter / Accéder" : ouvre le modal si pas débloqué, sinon va au cours.
  const handleCourseClick = (slug: Exclude<CourseSlug, 'bundle'>) => {
    if (isUnlocked(slug)) navigate(`/cours/${slug}`);
    else setOpenSlug(slug);
  };
  const handleBundleClick = () => {
    if (isBundleUnlocked) navigate('/mon-compte');
    else setOpenSlug('bundle');
  };

  useEffect(() => {
    const c = heroCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, raf = 0;
    type Pt = { x:number; y:number; r:number; dx:number; dy:number; a:number; col:string };
    let pts: Pt[] = [];
    const mk = (): Pt => ({
      x: Math.random() * W, y: Math.random() * H,
      r: .5 + Math.random() * 1.2,
      dx: (Math.random() - .5) * .18, dy: (Math.random() - .5) * .18,
      a: .04 + Math.random() * .14,
      col: Math.random() > .5 ? 'rgba(29,191,115,' : 'rgba(134,239,172,',
    });
    const resize = () => {
      const r = c.parentElement?.getBoundingClientRect();
      if (!r) return;
      W = c.width = r.width; H = c.height = r.height;
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + p.a + ')'; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(29,191,115,' + (0.035 * (1 - d / 80)) + ')';
            ctx.lineWidth = .5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', resize);
    resize();
    pts = Array.from({ length: 40 }, mk);
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: .07 },
    );
    document.querySelectorAll('.fade').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const co = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const cu = (id: string, end: number, suffix: string) => {
          const el = document.getElementById(id);
          if (!el) return;
          let n = 0;
          const st = Math.ceil(end / 28);
          const t = setInterval(() => {
            n = Math.min(n + st, end);
            el.textContent = n + suffix;
            if (n >= end) clearInterval(t);
          }, 24);
        };
        cu('s1', 520, '+'); cu('s2', 5, ''); cu('s3', 56, ''); cu('s4', 100, '%');
        co.disconnect();
      }
    }, { threshold: .4 });
    const sb = document.querySelector('.stats-block');
    if (sb) co.observe(sb);
    return () => co.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const faqs = [
    { q: "Comment fonctionne l'éditeur Python et SQL intégré ?", a: "Les cours Python utilisent Skulpt — Python compilé en JavaScript. Il tourne directement dans votre navigateur (Chrome ou Firefox), sans installation. Les cours SQL utilisent AlaSQL avec 5 tables pré-chargées de données réelles. Vous écrivez votre code, cliquez sur Exécuter (ou Ctrl+Enter), et le résultat apparaît instantanément." },
    { q: "Comment fonctionne l'accès après paiement ?", a: "Immédiatement après le paiement, le cours se débloque sur ce site et vous y accédez en un clic. Chaque formation est une expérience interactive complète, ouvrable depuis n'importe quel navigateur — y compris hors ligne une fois chargée." },
    { q: "Quels modes de paiement sont acceptés ?", a: "Nous acceptons Orange Money, MTN MoMo, Wave, Moov Money, et les cartes Visa/Mastercard via GeniusPay. Les paiements sont sécurisés et traités instantanément." },
    { q: "Faut-il des prérequis pour commencer ?", a: "DataViz et KPI : aucun prérequis. SQL : savoir utiliser un ordinateur suffit. Python : zéro connaissance en programmation requise — le cours démarre des bases absolues. Scoring : avoir fait SQL ou Python aide mais n'est pas obligatoire, les concepts sont réexpliqués." },
    { q: "Le certificat est-il reconnu professionnellement ?", a: "Le certificat FinMark Support atteste d'une compétence validée par QCM. Il peut être ajouté à votre CV et profil LinkedIn. Sa valeur est directement liée aux compétences que vous démontrerez en entretien." },
    { q: "Peut-on partager les cours avec des collègues ?", a: "La licence est personnelle (1 utilisateur par achat). Pour des équipes ou des entreprises, contactez-nous pour une licence groupe avec un tarif préférentiel." },
    { q: "Quelle est la différence entre les 5 formations et le bundle ?", a: "Le contenu est identique. Le bundle vous donne accès aux 5 formations pour 44 900 FCFA au lieu de 64 500 FCFA si achetées individuellement, soit une économie de 19 600 FCFA (30%)." },
  ];

  return (
    <>
      {topbarVisible && (
        <div id="topbar">
          <p>Offre lancement — Bundle <strong>5 formations</strong> à <strong>44 900 FCFA</strong> au lieu de 64 500 FCFA · -30% · Accès immédiat</p>
          <button id="tb-close" onClick={() => setTopbarVisible(false)} aria-label="Fermer">✕</button>
        </div>
      )}

      <nav id="nav">
        <a href="#" className="nav-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img src="/logo/zouzou_image.png" alt="FinMark Support" />
          <span className="nav-brand">FinMark <span>Support</span></span>
        </a>
        <div className="nav-sep"></div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => scrollTo('formations')}>Formations</button>
          <button className="nav-link" onClick={() => scrollTo('bundle')}>Bundle 5-en-1</button>
          <button className="nav-link" onClick={() => scrollTo('ebook')}>Guide Recrutement</button>
          <button className="nav-link" onClick={() => scrollTo('temoignages')}>Témoignages</button>
          <button className="nav-link" onClick={() => scrollTo('about')}>Formateur</button>
          <button className="nav-link" onClick={() => scrollTo('faq')}>FAQ</button>
          {appUser && (
            <button className="nav-link" onClick={() => navigate('/parcours')} style={{ color: 'var(--g)', fontWeight: 700 }}>Mon parcours</button>
          )}
        </div>
        <div className="nav-r">
          {appUser ? (
            <button className="nav-outline" onClick={() => navigate('/mon-compte')}>Mon compte</button>
          ) : (
            <button className="nav-outline" onClick={() => navigate('/connexion')}>Connexion</button>
          )}
          <button className="nav-cta" onClick={handleBundleClick}>
            {isBundleUnlocked ? 'Mes formations →' : 'Bundle 44 900 FCFA →'}
          </button>
        </div>
      </nav>

      <section className="hero">
        <canvas id="hbg" ref={heroCanvasRef}></canvas>
        <div className="hero-inner">
          <div>
            <div className="hero-eye"><span className="hero-dot"></span>5 Formations certifiantes · Data Analytics · IA</div>
            <h1 className="hero-h1">Les formations data qui<br/><em>transforment votre carrière</em></h1>
            <p className="hero-p">DataViz · SQL · KPIs · Python · Scoring — cinq formations interactives et certifiantes avec éditeur intégré dans le navigateur. Zéro installation. Résultats immédiats.</p>
            <div className="hero-ctas">
              <button className="btn-hero-main" onClick={() => scrollTo('formations')}>Voir les 5 formations</button>
              <button className="btn-hero-ghost" onClick={() => setOpenSlug('bundle')}>Bundle 44 900 FCFA →</button>
            </div>
            <div className="hero-proof">
              <div className="hero-avs">
                <div className="hero-av" style={{ background: '#1DBF73' }}>A</div>
                <div className="hero-av" style={{ background: '#3b82f6' }}>K</div>
                <div className="hero-av" style={{ background: '#8b5cf6' }}>M</div>
                <div className="hero-av" style={{ background: '#f59e0b' }}>F</div>
                <div className="hero-av" style={{ background: '#6366f1' }}>E</div>
              </div>
              <span className="hero-proof-txt"><strong>520+ professionnels</strong> certifiés — CI, SN, GH, TG, BF, ML</span>
            </div>
            <div className="hero-secure">🔒 Paiement sécurisé · 📥 Accès immédiat · ♾ Accès à vie</div>
          </div>

          <div>
            <div className="hero-cards">
              <button className="hpc" onClick={() => handleCourseClick('dataviz')}>
                <div className="hpc-top"><span className="hpc-tag hpc-tag-g">DataViz</span><div>{isUnlocked('dataviz') ? <span className="hpc-cur" style={{ color: '#6ee7b7' }}>✓ Débloqué</span> : <><span className="hpc-price">12 500</span> <span className="hpc-cur">FCFA</span></>}</div></div>
                <div className="hpc-name">Data Visualisation</div>
                <div className="hpc-desc">35 graphiques · Simulateur live · Certifiant</div>
              </button>
              <button className="hpc" onClick={() => handleCourseClick('sql')}>
                <div className="hpc-top"><span className="hpc-tag hpc-tag-b">SQL</span><div>{isUnlocked('sql') ? <span className="hpc-cur" style={{ color: '#93c5fd' }}>✓ Débloqué</span> : <><span className="hpc-price">12 900</span> <span className="hpc-cur">FCFA</span></>}</div></div>
                <div className="hpc-name">SQL Professionnel</div>
                <div className="hpc-desc">18 exercices · DB intégrée · Expert</div>
              </button>
              <button className="hpc" onClick={() => handleCourseClick('kpi')}>
                <div className="hpc-top"><span className="hpc-tag hpc-tag-k">KPI</span><div>{isUnlocked('kpi') ? <span className="hpc-cur" style={{ color: '#c4b5fd' }}>✓ Débloqué</span> : <><span className="hpc-price">12 900</span> <span className="hpc-cur">FCFA</span></>}</div></div>
                <div className="hpc-name">Maîtriser les KPIs</div>
                <div className="hpc-desc">10 domaines · 50 KPIs · Dashboard pro</div>
              </button>
              <button className="hpc" onClick={() => handleCourseClick('python')}>
                <div className="hpc-top"><span className="hpc-tag hpc-tag-p">Python</span><div>{isUnlocked('python') ? <span className="hpc-cur" style={{ color: '#fcd34d' }}>✓ Débloqué</span> : <><span className="hpc-price">12 900</span> <span className="hpc-cur">FCFA</span></>}</div></div>
                <div className="hpc-name">Python Data Analytics</div>
                <div className="hpc-desc">11 exercices · Pandas · Scikit-learn</div>
              </button>
              <button className="hpc" onClick={() => handleCourseClick('scoring')}>
                <div className="hpc-top"><span className="hpc-tag hpc-tag-sc">Scoring</span><div>{isUnlocked('scoring') ? <span className="hpc-cur" style={{ color: '#a5b4fc' }}>✓ Débloqué</span> : <><span className="hpc-price">12 900</span> <span className="hpc-cur">FCFA</span></>}</div></div>
                <div className="hpc-name">Scoring & Modèles prédictifs</div>
                <div className="hpc-desc">15 exemples · 8 algos · Code Python</div>
              </button>
              <button className="hpc-bundle" onClick={handleBundleClick}>
                <div className="hpc-bundle-badge">{isBundleUnlocked ? 'Tout débloqué' : 'Meilleure offre'}</div>
                <div className="hpc-b-name">Bundle 5 formations complètes</div>
                <div className="hpc-b-row">
                  <div className="hpc-b-price">
                    <span className="hpc-b-old">64 500</span>
                    <span className="hpc-b-new">44 900</span>
                    <span className="hpc-b-cur">FCFA</span>
                  </div>
                  <span className="hpc-b-save">-30%</span>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.28)', marginTop: 4 }}>5 certificats · Accès à vie · Accès immédiat</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-inner">
          <div className="ti">⭐ <strong>4.9/5</strong> (520 avis)</div>
          <div className="ti-sep"></div>
          <div className="ti"><strong>5 formations</strong> certifiantes</div>
          <div className="ti-sep"></div>
          <div className="ti">Éditeur Python & SQL <strong>intégré</strong></div>
          <div className="ti-sep"></div>
          <div className="ti">Accès <strong>immédiat</strong></div>
          <div className="ti-sep"></div>
          <div className="ti">Accès <strong>à vie</strong></div>
          <div className="ti-sep"></div>
          <div className="ti"><strong>CI · SN · GH · TG · BF · ML</strong></div>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="section-inner">
          <div className="ey">Vous reconnaissez-vous ?</div>
          <h2 className="sec-h">Ces situations vous parlent ?</h2>
          <p className="sec-sub fade">Si oui, nos 5 formations ont été créées exactement pour vous.</p>
          <div className="prob-grid fade">
            <div className="prob-card"><div className="prob-bar" style={{ background: '#ef4444' }}></div><div><div className="prob-title">Vos données ne convainquent personne</div><div className="prob-desc">Vos rapports Excel ne déclenchent aucune décision. Votre manager dit "c'est pas clair" et vos analyses restent inutilisées.</div></div></div>
            <div className="prob-card"><div className="prob-bar" style={{ background: '#f59e0b' }}></div><div><div className="prob-title">Votre SQL est limité aux SELECT basiques</div><div className="prob-desc">Dès qu'on parle de CTEs, Window Functions ou sous-requêtes corrélées, vous décrochez. Vous ne pouvez pas exploiter la vraie puissance de vos données.</div></div></div>
            <div className="prob-card"><div className="prob-bar" style={{ background: '#3b82f6' }}></div><div><div className="prob-title">Python vous fait peur — vous ne savez pas par où commencer</div><div className="prob-desc">Pandas, Matplotlib, Scikit-learn... trop d'outils, trop de tutos contradictoires. Pas de parcours structuré du débutant à l'analyste.</div></div></div>
            <div className="prob-card"><div className="prob-bar" style={{ background: '#6366f1' }}></div><div><div className="prob-title">Vous entendez parler de "scoring" sans comprendre</div><div className="prob-desc">Scoring crédit, churn, lead — vous savez que c'est important, mais les algorithmes derrière restent un mystère.</div></div></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', paddingTop: 56, paddingBottom: 56 }}>
        <div className="section-inner">
          <div className="stats-block fade">
            <div className="stat"><span className="stat-n" id="s1">520</span><div className="stat-l">Professionnels<br/>certifiés en Afrique</div></div>
            <div className="stat"><span className="stat-n" id="s2">5</span><div className="stat-l">Formations<br/>certifiantes</div></div>
            <div className="stat"><span className="stat-n" id="s3">56</span><div className="stat-l">Exercices interactifs<br/>dans le navigateur</div></div>
            <div className="stat"><span className="stat-n" id="s4">100</span><div className="stat-l">% Exécutable<br/>sans installation</div></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="section-inner">
          <div className="ey">La transformation</div>
          <h2 className="sec-h">Avant vs Après nos formations</h2>
          <div className="tf-block fade" style={{ marginTop: 28 }}>
            <div>
              <div className="tf-lbl tf-bad">Avant les formations</div>
              <ul className="tf-list">
                <li><b style={{ color: '#dc2626' }}>✗</b>Pie charts avec 12 tranches illisibles et sans message</li>
                <li><b style={{ color: '#dc2626' }}>✗</b>SQL en sous-requêtes imbriquées que personne ne comprend</li>
                <li><b style={{ color: '#dc2626' }}>✗</b>Python = peur de la ligne de commande et du premier erreur</li>
                <li><b style={{ color: '#dc2626' }}>✗</b>"Scoring" = mot mystérieux entendu en réunion</li>
                <li><b style={{ color: '#dc2626' }}>✗</b>Dashboard de 30 KPIs que la direction ignore</li>
              </ul>
            </div>
            <div className="tf-arr">→</div>
            <div>
              <div className="tf-lbl tf-good">Après les formations</div>
              <ul className="tf-list">
                <li><b style={{ color: 'var(--g)' }}>✓</b>Le bon graphique choisi en 30 secondes, compris en 5</li>
                <li><b style={{ color: 'var(--g)' }}>✓</b>CTEs lisibles, Window Functions maîtrisées, code propre</li>
                <li><b style={{ color: 'var(--g)' }}>✓</b>Pandas, Matplotlib, Sklearn — pipeline data complet en Python</li>
                <li><b style={{ color: 'var(--g)' }}>✓</b>Scoring crédit, churn, fraude — algorithmes et code Python complet</li>
                <li><b style={{ color: 'var(--g)' }}>✓</b>5 KPIs clés avec cible, tendance, alerte — décisions déclenchées</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="formations" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div className="ey">Nos formations</div>
          <h2 className="sec-h">5 formations certifiantes — choisissez la vôtre</h2>
          <p className="sec-sub">Accès à vie · Accès immédiat · Éditeur interactif intégré · Certificat personnalisé</p>

          <div className="form-grid">
            <FormationCard
              variant="v" popular tag="Data Visualisation" sub="Du graphique basique au dashboard professionnel"
              name={<>Maîtriser la DataViz</>} stars="4.9 (240 avis)" deco="◎"
              feats={[
                "Hiérarchie perceptive, data-ink ratio, 10 règles d'or",
                "35 types de graphiques avec démos interactives live",
                "15 erreurs coûteuses illustrées et corrigées",
                "Simulateur d'axe Y temps réel · Moteur Python Skulpt",
                "QCM 20 questions + certificat personnalisé",
              ]}
              meta={[['7','Chapitres'],['35+','Graphiques'],['6','Exercices'],['∞','Accès']]}
              price="12 500" unlocked={isUnlocked('dataviz')} onBuy={() => handleCourseClick('dataviz')}
            />
            <FormationCard
              variant="s" tag="SQL Professionnel" sub="SELECT → JOIN → CTE → Window Functions · Expert"
              name="Maîtriser SQL" stars="4.8 (180 avis)" deco="{}"
              feats={[
                "SELECT, WHERE, CASE WHEN, BETWEEN, IN, LIKE",
                "6 types de JOIN avec diagrammes de Venn interactifs",
                "GROUP BY, HAVING · CTEs multi-niveaux",
                "RANK(), LAG(), LEAD(), SUM() OVER — Window Functions",
                "18 éditeurs SQL · 5 tables données réelles · Certificat",
              ]}
              meta={[['9','Chapitres'],['18','Exercices SQL'],['5','Tables DB'],['∞','Accès']]}
              price="12 900" unlocked={isUnlocked('sql')} onBuy={() => handleCourseClick('sql')}
            />
            <FormationCard
              variant="k" tag="KPI & Dashboards" sub="Identifier · Calculer · Visualiser · 10 domaines"
              name="Maîtriser les KPIs" stars="5.0 (80 avis)" deco="↗"
              feats={[
                "KPI vs Mesure vs Métrique — les vraies définitions",
                "Les 7 questions à poser avant de choisir un KPI",
                "Matrice KPI → Graphique optimal complète",
                "10 domaines : Marketing, Finance, SaaS, E-commerce, RH…",
                "Dashboard décisionnel + QCM + certificat personnalisé",
              ]}
              meta={[['8','Chapitres'],['10','Domaines'],['50+','KPIs'],['∞','Accès']]}
              price="12 900" unlocked={isUnlocked('kpi')} onBuy={() => handleCourseClick('kpi')}
            />
          </div>

          <div className="form-grid-2">
            <FormationCard
              variant="p" hot tag="Python Data Analytics" sub="Du zéro au Machine Learning · Éditeur intégré"
              name={<>Python &amp; Data Analytics</>} stars="4.9 (95 avis)" deco="🐍"
              feats={[
                "Bases Python : variables, listes, dicts, fonctions, boucles",
                "NumPy, Pandas — manipulation de données réelles",
                "Matplotlib & Seaborn — graphiques qui s'affichent dans le cours",
                "EDA complète + Régression + Classification RandomForest",
                "11 éditeurs Python live · Skulpt (zéro installation) · Certificat",
              ]}
              meta={[['9','Chapitres'],['11','Exercices live'],['8','Librairies'],['∞','Accès']]}
              price="12 900" unlocked={isUnlocked('python')} onBuy={() => handleCourseClick('python')}
            />
            <FormationCard
              variant="sc" isNew tag="Scoring & ML" sub="Crédit · Fraude · Churn · Lead · 8 algorithmes"
              name="Maîtriser le Scoring" stars="5.0 (48 avis)" deco="⬡"
              feats={[
                "6 types de scoring : crédit, fraude, churn, lead, risque, RH",
                "8 algorithmes : RegLog, WOE, Random Forest, XGBoost, Isolation Forest…",
                "15 exemples concrets dans 10 domaines (finance, santé, RH, agri…)",
                "3 modèles Python complets — du pipeline à la décision",
                "QCM 20 questions + certificat personnalisé",
              ]}
              meta={[['7','Chapitres'],['15','Exemples'],['8','Algorithmes'],['∞','Accès']]}
              price="12 900" unlocked={isUnlocked('scoring')} onBuy={() => handleCourseClick('scoring')}
            />
          </div>
        </div>
      </section>

      <section className="section" id="bundle" style={{ background: 'var(--bg)' }}>
        <div className="section-inner">
          <div className="ey">Offre spéciale</div>
          <h2 className="sec-h">Bundle 5-en-1 — Économisez 19 600 FCFA</h2>
          <p className="sec-sub">Toutes les formations, tous les certificats, accès à vie — au meilleur prix.</p>
          <div className="bundle-card fade">
            <div className="bundle-glow"></div>
            <div className="bundle-inner">
              <div>
                <div className="bundle-badge">🏆 Meilleure offre · -30%</div>
                <h3 className="bundle-title">Bundle Data Complet —<br/><em>les 5 formations</em></h3>
                <p className="bundle-desc">DataViz · SQL · KPIs · Python · Scoring — un seul achat pour maîtriser toute la chaîne data : du graphique au modèle prédictif.</p>
                <div className="bundle-chips">
                  <div className="bchip"><div className="bchip-dot" style={{ background: '#1DBF73' }}></div><div><div className="bchip-name">Data Visualisation</div><div className="bchip-sub">7 chapitres · 35 graphiques · Simulateur</div></div></div>
                  <div className="bchip"><div className="bchip-dot" style={{ background: '#3b82f6' }}></div><div><div className="bchip-name">SQL Professionnel</div><div className="bchip-sub">9 chapitres · 18 exercices · DB intégrée</div></div></div>
                  <div className="bchip"><div className="bchip-dot" style={{ background: '#8b5cf6' }}></div><div><div className="bchip-name">Maîtriser les KPIs</div><div className="bchip-sub">8 chapitres · 10 domaines · 50 KPIs</div></div></div>
                  <div className="bchip"><div className="bchip-dot" style={{ background: '#f59e0b' }}></div><div><div className="bchip-name">Python Data Analytics</div><div className="bchip-sub">9 chapitres · 11 exercices live · ML</div></div></div>
                  <div className="bchip"><div className="bchip-dot" style={{ background: '#6366f1' }}></div><div><div className="bchip-name">Scoring & Modèles prédictifs</div><div className="bchip-sub">7 chapitres · 15 exemples · Code Python</div></div></div>
                </div>
                <div className="bundle-perks">
                  <div className="bperk"><span>✓</span>5 certificats personnalisés</div>
                  <div className="bperk"><span>✓</span>Accès à vie</div>
                  <div className="bperk"><span>✓</span>Mises à jour futures gratuites</div>
                  <div className="bperk"><span>✓</span>56 exercices interactifs</div>
                  <div className="bperk"><span>✓</span>Éditeur Python + SQL intégrés</div>
                  <div className="bperk"><span>✓</span>Données réelles africaines</div>
                </div>
                <div className="bundle-cta">
                  <button className="bundle-btn" onClick={handleBundleClick}>
                    {isBundleUnlocked ? 'Voir mes formations →' : "S'inscrire au bundle — 44 900 FCFA →"}
                  </button>
                  <span className="bundle-note">{isBundleUnlocked ? '✅ Toutes les formations débloquées' : '🔒 Paiement sécurisé · Accès immédiat · Accès à vie'}</span>
                </div>
              </div>
              <div className="bundle-price-col">
                <div className="bundle-old">64 500 FCFA</div>
                <div className="bundle-new-row">
                  <span className="bundle-new">44 900</span>
                  <span className="bundle-cur">FCFA</span>
                </div>
                <div className="bundle-save">Économie : 19 600 FCFA</div>
                <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,.3)', lineHeight: 1.6, textAlign: 'right' }}>
                  5 formations × 12 900<br/>= 64 500 FCFA à l'unité<br/><strong style={{ color: 'rgba(134,239,172,.5)' }}>Bundle : 44 900 FCFA</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="ebook" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div className="ey">Pour dirigeants & DRH</div>
          <h2 className="sec-h">Guide — Recruter un Data Analyst en Côte d'Ivoire</h2>
          <p className="sec-sub">Pour les dirigeants et DRH qui veulent comprendre la valeur d'un Data Analyst avant de recruter.</p>
          <div className="ebook-card fade">
            <div className="ebook-glow"></div>
            <div>
              <div className="ebook-tag">📘 Guide complet · FinMark Support</div>
              <h3 className="ebook-title">Recruter un Data Analyst<br/>en Côte d'Ivoire — <em>le guide complet</em></h3>
              <p className="ebook-desc">7 chapitres pour comprendre pourquoi un Data Analyst est le meilleur investissement pour votre PME ivoirienne, comment le recruter et combien ça rapporte — avec un calculateur ROI interactif en FCFA.</p>
              <ul className="ebook-feats">
                <li><span>✓</span>Les 6 super-pouvoirs d'un DA et ce qu'ils rapportent concrètement</li>
                <li><span>✓</span>10 cas concrets par secteur (finance, santé, logistique, agriculture…)</li>
                <li><span>✓</span>Les 8 erreurs qui font échouer le recrutement — et comment les éviter</li>
                <li><span>✓</span>Salaires réels marché CI 2025 · Grille de questions d'entretien</li>
                <li><span>✓</span>Calculateur ROI interactif en FCFA — estimez votre retour en 30 secondes</li>
              </ul>
              <button className="fc-btn fc-btn-eb" style={{ fontSize: 14, padding: '13px 28px' }} onClick={() => handleCourseClick('recrutement')}>
                {isUnlocked('recrutement') ? 'Accéder au guide →' : "S'inscrire — 12 900 FCFA →"}
              </button>
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.3)', marginTop: 12 }}>{isUnlocked('recrutement') ? '✅ Guide débloqué · Cliquez pour ouvrir' : '🔒 Paiement sécurisé · Accès immédiat · À vie'}</p>
            </div>
            <div className="ebook-price-col">
              <div className="ebook-price-free" style={{ fontSize: 32 }}>12 900 <span style={{ fontSize: 14, color: 'rgba(196,181,253,.6)' }}>FCFA</span></div>
              <div className="ebook-price-note">Paiement unique · Accès à vie</div>
              <div className="ebook-incl">
                <div className="ebook-incl-l">Inclut</div>
                <div className="ebook-incl-row">
                  <div className="ebook-incl-item"><span>→</span>7 chapitres complets</div>
                  <div className="ebook-incl-item"><span>→</span>Calculateur ROI FCFA</div>
                  <div className="ebook-incl-item"><span>→</span>10 secteurs concrets</div>
                  <div className="ebook-incl-item"><span>→</span>Grille entretien</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="how" style={{ background: 'var(--bg)' }}>
        <div className="section-inner">
          <div className="ey">Simple et rapide</div>
          <h2 className="sec-h">Comment s'inscrire — 4 étapes</h2>
          <div className="how-grid fade" style={{ marginTop: 28 }}>
            <div className="how-step"><div className="how-n">1</div><div className="how-title">Choisissez votre formation</div><div className="how-desc">Sélectionnez la formation ou le bundle qui correspond à votre objectif. Cliquez sur "S'inscrire".</div></div>
            <div className="how-step"><div className="how-n">2</div><div className="how-title">Payez en toute sécurité</div><div className="how-desc">Orange Money · MTN MoMo · Wave · Moov · Visa / Mastercard. Paiement 100 % sécurisé.</div></div>
            <div className="how-step"><div className="how-n">3</div><div className="how-title">Accès immédiat</div><div className="how-desc">Le cours se débloque instantanément après le paiement. Aucune attente.</div></div>
            <div className="how-step"><div className="how-n">4</div><div className="how-title">Apprenez et certifiez-vous</div><div className="how-desc">Ouvrez le cours dans votre navigateur. Aucune installation. Passez le QCM et obtenez votre certificat.</div></div>
          </div>
        </div>
      </section>

      <section className="section" id="temoignages" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div className="ey">Ils ont été formés</div>
          <h2 className="sec-h">Ce que nos apprenants disent</h2>
          <div className="testi-grid fade">
            <Testi color="#1DBF73" badge="v" tag="DataViz" name="Adjoa M." role="Data Analyst · Accra" initial="A" text="L'éditeur Python intégré m'a bluffé. J'ai exécuté mon premier code sans rien installer. Le simulateur d'axe Y m'a fait comprendre en 5 minutes ce que je n'avais pas compris en 2 ans de formation classique." />
            <Testi color="#3b82f6" badge="s" tag="SQL" name="Kofi A." role="BI Developer · Abidjan" initial="K" text="Les 18 exercices SQL qui s'exécutent dans le fichier HTML — c'est ce qui fait la différence. J'ai compris les Window Functions en une soirée." />
            <Testi color="#8b5cf6" badge="k" tag="KPI" name="Marie D." role="Contrôleur de gestion · Lomé" initial="M" text="J'utilisais le mot 'KPI' à tort depuis des années. Ce cours m'a remis les idées en ordre. La matrice KPI → Graphique optimal seule vaut 10× le prix." />
            <Testi color="#f59e0b" badge="p" tag="Python" name="Fatou N." role="Business Analyst · Dakar" initial="F" text="J'avais peur de Python depuis des années. Le chapitre 3 explique vraiment les bases sans jargon. Les exercices interactifs font que ça rentre naturellement. J'ai codé un groupby Pandas en 10 minutes." />
            <Testi color="#6366f1" badge="sc" tag="Scoring" name="Ekow M." role="Data Scientist · Accra" initial="E" text="Les 15 exemples concrets sont ce qui m'a convaincu. Voir le scoring appliqué à l'immobilier, à l'agriculture, aux RH — domaines que je n'aurais jamais associés au ML. Le code Python est directement réutilisable." />
            <Testi color="#14b8a6" badge="v" tag="Bundle" name="Seydou B." role="Analyste Data · Abidjan" initial="S" text="Le bundle 5-en-1 est la meilleure décision data que j'ai prise. Du DataViz au Scoring en passant par Python, j'ai tout ce qu'il me faut." />
          </div>
        </div>
      </section>

      <section className="section" id="about" style={{ background: 'var(--bg)' }}>
        <div className="section-inner">
          <div className="ey">Votre formateur</div>
          <h2 className="sec-h">Qui est derrière FinMark Support ?</h2>
          <div className="author-card fade" style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="auth-av">FZ</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 1 }}>★★★★★</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>4.9 · 520+ apprenants</div>
              </div>
            </div>
            <div>
              <div className="auth-tag">Formateur · FinMark Support</div>
              <div className="auth-name">Kouassi Fresh-Nes Rameaux ZOUZOU</div>
              <div className="auth-title">Senior Data Analyst · NSIA Vie Assurances · Consultant GoMyCode · Fondateur FinMark Support</div>
              <div className="auth-bio">Je travaille avec des données au quotidien — SQL, Python, Power BI, modèles prédictifs — dans un contexte professionnel réel en Côte d'Ivoire. Ces formations ne sont pas des cours théoriques : ce sont des synthèses de 5 ans de pratique terrain. Chaque exemple, chaque exercice, chaque dataset vient de cas réels que j'ai traités. Je sais où les apprenants bloquent, et ces formations sont construites pour éliminer ces blocages un par un.</div>
              <div className="auth-badges">
                <span className="auth-badge">Master 2 Data Science — Institut CERCO</span>
                <span className="auth-badge">IBM Data Analyst</span>
                <span className="auth-badge">IBM Data Science</span>
                <span className="auth-badge">GoMyCode Instructor</span>
                <span className="auth-badge">NSIA Vie Assurances</span>
                <span className="auth-badge">Abidjan, Côte d'Ivoire</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="faq" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div className="ey">Vos questions</div>
          <h2 className="sec-h">Questions fréquentes</h2>
          <div className="faq-list fade">
            {faqs.map((f, i) => (
              <div key={i} className={'faq-item' + (openFaq === i ? ' open' : '')}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}<span className="faq-ico">+</span>
                </button>
                <div className="faq-a"><div className="faq-a-body">{f.a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="fcta-glow"></div>
        <div className="fcta-inner">
          <h2 className="fcta-title">Prêt à maîtriser<br/><em>la data analytics ?</em></h2>
          <p className="fcta-sub">5 formations · 5 certificats · Éditeurs interactifs intégrés. Commencez aujourd'hui.</p>
          <div className="fcta-btns">
            <button className="bundle-btn" onClick={handleBundleClick}>
              {isBundleUnlocked ? 'Voir mes formations →' : "S'inscrire au bundle 5-en-1 — 44 900 FCFA →"}
            </button>
            <button className="btn-hero-ghost" style={{ padding: '15px 24px' }} onClick={() => scrollTo('formations')}>Voir les formations →</button>
          </div>
          <p className="fcta-note">🔒 Paiement sécurisé · 📥 Accès immédiat · ♾ Accès à vie · Certificats personnalisés</p>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <a href="#" className="footer-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/logo/zouzou_image.png" alt="FinMark Support" />
            <span className="footer-brand">FinMark <span>Support</span></span>
          </a>
          <div className="footer-links">
            <button onClick={() => scrollTo('formations')}>Formations</button>
            <button onClick={() => scrollTo('bundle')}>Bundle</button>
            <button onClick={() => scrollTo('ebook')}>Guide Recrutement</button>
            <button onClick={() => scrollTo('how')}>Comment s'inscrire</button>
            <button onClick={() => scrollTo('temoignages')}>Témoignages</button>
            <button onClick={() => scrollTo('about')}>Formateur</button>
            <button onClick={() => scrollTo('faq')}>FAQ</button>
          </div>
          <div className="footer-copy">© 2025 FinMark Support · Abidjan, Côte d'Ivoire</div>
        </div>
      </footer>

      {openSlug && <PaymentModal slug={openSlug} onClose={() => setOpenSlug(null)} />}
    </>
  );
}

interface FormationCardProps {
  variant: 'v' | 's' | 'k' | 'p' | 'sc';
  popular?: boolean;
  isNew?: boolean;
  hot?: boolean;
  tag: string;
  name: ReactNode;
  sub: string;
  stars: string;
  deco: string;
  feats: string[];
  meta: [string, string][];
  price: string;
  unlocked?: boolean;
  onBuy: () => void;
}

function FormationCard(p: FormationCardProps) {
  const cls = `fc fade${p.popular ? ' fc-popular' : ''}${p.isNew ? ' fc-new' : ''}${p.hot ? ' fc-hot' : ''}`;
  return (
    <div className={cls}>
      <div className={`fc-cover fc-cover-${p.variant}`}>
        <div className="fc-cover-deco">{p.deco}</div>
        <div className="fc-stars">★★★★★<span className="fc-stars-n">{p.stars}</span></div>
        <div className={`fc-tag fc-tag-${p.variant}`}>{p.tag}</div>
        <div className="fc-name">{p.name}</div>
        <div className="fc-sub">{p.sub}</div>
      </div>
      <div className="fc-body">
        <ul className={`fc-feats f${p.variant}`}>
          {p.feats.map((f, i) => <li key={i}><span>✓</span>{f}</li>)}
        </ul>
        <div className="fc-meta">
          {p.meta.map(([v, l], i) => (
            <div key={i} className="fc-m"><span className="fc-m-v">{v}</span><div className="fc-m-l">{l}</div></div>
          ))}
        </div>
        <div className="fc-buy">
          <div>
            {p.unlocked ? (
              <>
                <div className={`fc-price-main fc-price-${p.variant}`} style={{ fontSize: 18 }}>✓ Formation débloquée</div>
                <div className="fc-price-note">Accès à vie · Cliquez pour ouvrir</div>
              </>
            ) : (
              <>
                <div className={`fc-price-main fc-price-${p.variant}`}>{p.price} <span style={{ fontSize: 15, letterSpacing: 0, fontWeight: 600 }}>FCFA</span></div>
                <div className="fc-price-note">Paiement unique · Accès immédiat</div>
              </>
            )}
          </div>
          <button className={`fc-btn fc-btn-${p.variant}`} onClick={p.onBuy}>
            {p.unlocked ? 'Accéder →' : "S'inscrire →"}
          </button>
        </div>
        <div className="fc-dl">{p.unlocked ? '✅ Achat validé · Accès illimité' : '🔒 Paiement sécurisé · Accès envoyé instantanément'}</div>
      </div>
    </div>
  );
}

interface TestiProps { color: string; badge: 'v'|'s'|'k'|'p'|'sc'; tag: string; text: string; name: string; role: string; initial: string }
function Testi(p: TestiProps) {
  return (
    <div className="tc">
      <div className="tc-top">
        <div className="tc-stars">★★★★★</div>
        <span className={`tc-badge tc-b-${p.badge}`}>{p.tag}</span>
      </div>
      <p className="tc-text">« {p.text} »</p>
      <div className="tc-sep"></div>
      <div className="tc-auth">
        <div className="tc-av" style={{ background: p.color }}>{p.initial}</div>
        <div><div className="tc-name">{p.name}</div><div className="tc-role">{p.role}</div></div>
      </div>
    </div>
  );
}
