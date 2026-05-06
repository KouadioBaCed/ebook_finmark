import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PaymentModal } from '../components/PaymentModal';
import type { CourseSlug } from '../services/payment';

export function Landing() {
  const [openSlug, setOpenSlug] = useState<CourseSlug | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [topbarVisible, setTopbarVisible] = useState(true);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particles animation in hero
  useEffect(() => {
    const c = heroCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, raf = 0;
    type Pt = { x:number; y:number; r:number; dx:number; dy:number; a:number; col:string };
    let pts: Pt[] = [];
    const mk = (): Pt => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: .5 + Math.random() * 1.2,
      dx: (Math.random() - .5) * .18,
      dy: (Math.random() - .5) * .18,
      a: .04 + Math.random() * .14,
      col: Math.random() > .5 ? 'rgba(29,191,115,' : 'rgba(134,239,172,',
    });
    const resize = () => {
      const r = c.parentElement?.getBoundingClientRect();
      if (!r) return;
      W = c.width = r.width;
      H = c.height = r.height;
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + p.a + ')';
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(29,191,115,' + (0.035 * (1 - d / 80)) + ')';
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', resize);
    resize();
    pts = Array.from({ length: 40 }, mk);
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: .07 },
    );
    document.querySelectorAll('.fade').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Counter animation
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
        cu('s1', 420, '+'); cu('s2', 3, ''); cu('s3', 100, '+'); cu('s4', 100, '%');
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
    { q: "Comment je reçois mes formations après l'achat ?", a: "Dès que votre paiement est confirmé, vous êtes redirigé vers la page de la formation, accessible immédiatement dans votre navigateur — sans installation, sans compte." },
    { q: "Quels moyens de paiement sont acceptés ?", a: "Orange Money, MTN Mobile Money, Wave, Moov Money, Visa et Mastercard. Tous les paiements sont sécurisés via GeniusPay." },
    { q: "Les formations fonctionnent-elles sur mobile ?", a: "Oui, 100% responsive. Les 3 formations sont optimisées pour smartphones." },
    { q: "L'accès est-il limité dans le temps ?", a: "Non. Accès à vie. Vous pouvez revenir consulter le cours autant de fois que nécessaire." },
    { q: "Comment obtenir mon certificat ?", a: "Terminez le QCM du dernier chapitre avec un score ≥ 14/20. Entrez votre nom. Le certificat est généré instantanément." },
    { q: "Pour quel niveau de compétence sont faites ces formations ?", a: "Niveau intermédiaire. Pour analystes, BI developers, contrôleurs de gestion, growth managers et étudiants data." },
    { q: "Puis-je acheter une seule formation ou dois-je prendre le bundle ?", a: "Chaque formation est disponible individuellement à 12 900 FCFA. Le bundle (3 formations) est à 29 900 FCFA au lieu de 38 700 FCFA — soit une économie de 8 800 FCFA." },
  ];

  return (
    <>
      {topbarVisible && (
        <div id="topbar">
          <p>Offre lancement — Bundle 3 formations à <strong>29 900 FCFA</strong> au lieu de 38 700 FCFA · Accès immédiat</p>
          <button id="tb-close" onClick={() => setTopbarVisible(false)} aria-label="Fermer">✕</button>
        </div>
      )}

      <nav id="nav">
        <a href="#" className="nav-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="nav-brand">FinMark <span>Support</span></span>
        </a>
        <div className="nav-sep"></div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => scrollTo('formations')}>Formations</button>
          <button className="nav-link" onClick={() => scrollTo('bundle')}>Bundle</button>
          <button className="nav-link" onClick={() => scrollTo('how')}>Comment acheter</button>
          <button className="nav-link" onClick={() => scrollTo('temoignages')}>Témoignages</button>
          <button className="nav-link" onClick={() => scrollTo('about')}>À propos</button>
          <button className="nav-link" onClick={() => scrollTo('faq')}>FAQ</button>
        </div>
        <div className="nav-r">
          <button className="nav-outline" onClick={() => scrollTo('formations')}>Explorer</button>
          <button className="nav-cta" onClick={() => scrollTo('formations')}>Acheter →</button>
        </div>
      </nav>

      <section className="hero">
        <canvas id="hbg" ref={heroCanvasRef}></canvas>
        <div className="hero-inner">
          <div>
            <div className="hero-eye"><span className="hero-dot"></span>3 Formations certifiantes · Data Analytics</div>
            <h1 className="hero-h1">Les formations data qui<br/><em>transforment votre carrière</em></h1>
            <p className="hero-p">Data Visualisation · SQL · KPIs — trois formations interactives et certifiantes conçues pour les professionnels qui veulent maîtriser l'analyse de données, de A à Z, dans n'importe quel secteur.</p>
            <div className="hero-ctas">
              <button className="btn-hero-main" onClick={() => scrollTo('formations')}>Voir les formations</button>
              <button className="btn-hero-ghost" onClick={() => scrollTo('bundle')}>Offre bundle →</button>
            </div>
            <div className="hero-proof">
              <div className="hero-avs">
                <div className="hero-av" style={{ background: '#1DBF73' }}>A</div>
                <div className="hero-av" style={{ background: '#3b82f6' }}>K</div>
                <div className="hero-av" style={{ background: '#8b5cf6' }}>M</div>
                <div className="hero-av" style={{ background: '#f59e0b' }}>F</div>
                <div className="hero-av" style={{ background: '#ef4444' }}>E</div>
              </div>
              <span className="hero-proof-txt"><strong>420+ professionnels</strong> formés — CI, SN, GH, TG, BF</span>
            </div>
            <div className="hero-secure">Paiement sécurisé · Accès immédiat · Accès à vie</div>
          </div>

          <div className="hero-cards">
            <button className="hpc" onClick={() => setOpenSlug('dataviz')}>
              <div className="hpc-top">
                <span className="hpc-tag hpc-tag-g">DataViz</span>
                <div><span className="hpc-price">12 900</span> <span className="hpc-cur">FCFA</span></div>
              </div>
              <div className="hpc-name">Data Visualisation</div>
              <div className="hpc-desc">35 graphiques · 6 chapitres · Certificat</div>
              <div className="hpc-chips"><span className="hpc-chip hpc-chip-g">6 chapitres</span><span className="hpc-chip hpc-chip-g">Certifiant</span></div>
            </button>
            <button className="hpc" onClick={() => setOpenSlug('sql')}>
              <div className="hpc-top">
                <span className="hpc-tag hpc-tag-b">SQL</span>
                <div><span className="hpc-price">12 900</span> <span className="hpc-cur">FCFA</span></div>
              </div>
              <div className="hpc-name">SQL Professionnel</div>
              <div className="hpc-desc">SELECT → CTE → Window Functions · Expert</div>
              <div className="hpc-chips"><span className="hpc-chip hpc-chip-b">7 chapitres</span><span className="hpc-chip hpc-chip-b">Certifiant</span></div>
            </button>
            <button className="hpc" onClick={() => setOpenSlug('kpi')}>
              <div className="hpc-top">
                <span className="hpc-tag hpc-tag-p">KPI</span>
                <div><span className="hpc-price">12 900</span> <span className="hpc-cur">FCFA</span></div>
              </div>
              <div className="hpc-name">Maîtriser les KPIs</div>
              <div className="hpc-desc">10 domaines · 50 KPIs · Dashboard pro</div>
              <div className="hpc-chips"><span className="hpc-chip hpc-chip-p">8 chapitres</span><span className="hpc-chip hpc-chip-p">Certifiant</span></div>
            </button>
            <button className="hpc-bundle hpc" onClick={() => setOpenSlug('bundle')} style={{ textAlign: 'left' }}>
              <div className="hpc-bundle-badge">Meilleure offre</div>
              <div className="hpc-b-name">Bundle — 3 formations complètes</div>
              <div className="hpc-b-row">
                <div className="hpc-b-price">
                  <span className="hpc-b-old">38 700</span>
                  <span className="hpc-b-new">29 900</span>
                  <span className="hpc-b-cur">FCFA</span>
                </div>
                <span className="hpc-b-save">-23%</span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,.28)', marginTop: 5 }}>3 certificats · Accès à vie · Accès immédiat</div>
            </button>
          </div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-inner">
          <div className="ti">⭐ <strong>4.9/5</strong> (420 avis)</div>
          <div className="ti-sep"></div>
          <div className="ti">3 certificats <strong>délivrés</strong></div>
          <div className="ti-sep"></div>
          <div className="ti">Accès <strong>immédiat</strong></div>
          <div className="ti-sep"></div>
          <div className="ti">Paiement <strong>sécurisé</strong></div>
          <div className="ti-sep"></div>
          <div className="ti">Accès <strong>à vie</strong></div>
          <div className="ti-sep"></div>
          <div className="ti"><strong>CI · SN · GH · TG · BF</strong></div>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="section-inner">
          <div className="ey">Vous reconnaissez-vous ?</div>
          <h2 className="sec-h">Ces situations vous parlent ?</h2>
          <p className="sec-sub fade">Si oui, nos 3 formations ont été créées exactement pour vous.</p>
          <div className="prob-grid fade">
            <div className="prob-card"><div className="prob-bar" style={{ background: '#ef4444' }}></div><div><div className="prob-title">Vous avez des données mais ne savez pas les présenter</div><div className="prob-desc">Vos rapports Excel ne convainquent pas. Votre manager dit "c'est pas clair" et vos analyses restent inutilisées.</div></div></div>
            <div className="prob-card"><div className="prob-bar" style={{ background: '#f59e0b' }}></div><div><div className="prob-title">Vous confondez KPI, indicateur et mesure brute</div><div className="prob-desc">On vous demande vos KPIs, vous listez le CA et le nombre de clients — sans savoir si ce sont vraiment des KPIs.</div></div></div>
            <div className="prob-card"><div className="prob-bar" style={{ background: '#3b82f6' }}></div><div><div className="prob-title">Votre SQL est limité aux SELECT de base</div><div className="prob-desc">Dès que quelqu'un parle de CTEs, de Window Functions ou de sous-requêtes, vous décrochez.</div></div></div>
            <div className="prob-card"><div className="prob-bar" style={{ background: '#8b5cf6' }}></div><div><div className="prob-title">Vos dashboards ne déclenchent aucune décision</div><div className="prob-desc">La direction regarde vos tableaux, dit "merci" et repart. Rien ne change.</div></div></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', paddingTop: 56, paddingBottom: 56 }}>
        <div className="section-inner">
          <div className="stats-block fade">
            <div className="stat"><span className="stat-n" id="s1">420</span><div className="stat-l">Professionnels<br/>formés en Afrique</div></div>
            <div className="stat"><span className="stat-n" id="s2">3</span><div className="stat-l">Formations<br/>certifiantes</div></div>
            <div className="stat"><span className="stat-n" id="s3">100</span><div className="stat-l">KPIs, graphiques<br/>et requêtes couverts</div></div>
            <div className="stat"><span className="stat-n" id="s4">100</span><div className="stat-l">% Interactif<br/>dans le navigateur</div></div>
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
                <li><b style={{ color: '#dc2626' }}>✗</b>"CA = mon KPI" — non, c'est une mesure brute</li>
                <li><b style={{ color: '#dc2626' }}>✗</b>Pie chart avec 12 tranches illisibles</li>
                <li><b style={{ color: '#dc2626' }}>✗</b>SQL en sous-requêtes imbriquées incompréhensibles</li>
                <li><b style={{ color: '#dc2626' }}>✗</b>Dashboard de 30 KPIs que personne ne lit</li>
                <li><b style={{ color: '#dc2626' }}>✗</b>Rapport que la direction ignore complètement</li>
              </ul>
            </div>
            <div className="tf-arr">→</div>
            <div>
              <div className="tf-lbl tf-good">Après les formations</div>
              <ul className="tf-list">
                <li><b style={{ color: 'var(--g)' }}>✓</b>"Taux de conversion hebdo" = KPI actionnable</li>
                <li><b style={{ color: 'var(--g)' }}>✓</b>Le bon graphique choisi en 30 secondes</li>
                <li><b style={{ color: 'var(--g)' }}>✓</b>CTEs lisibles, Window Functions maîtrisées</li>
                <li><b style={{ color: 'var(--g)' }}>✓</b>5 KPIs clés avec cible, tendance, alerte</li>
                <li><b style={{ color: 'var(--g)' }}>✓</b>Dashboard compris en 5 secondes par n'importe qui</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="formations" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div className="ey">Nos formations</div>
          <h2 className="sec-h">Choisissez votre formation</h2>
          <p className="sec-sub">Trois parcours certifiants · Accès à vie · Disponibles immédiatement après paiement</p>
          <div className="form-grid">

            <FormationCard
              variant="v"
              popular
              tag="Data Visualisation"
              name={<>Maîtriser la Data<br/>Visualisation</>}
              sub="Du graphique basique au dashboard professionnel"
              stars="4.9 (240 avis)"
              feats={[
                "Fondements : hiérarchie perceptive, data-ink ratio, règles d'or",
                "35+ types de graphiques avec démos interactives live",
                "15 erreurs coûteuses illustrées et corrigées",
                "Simulateur d'axe Y en temps réel + 6 exercices pratiques",
                "QCM 20 questions + certificat téléchargeable à votre nom",
              ]}
              meta={[['6', 'Chapitres'], ['35+', 'Graphiques'], ['20', 'QCM'], ['∞', 'Accès']]}
              price="12 900"
              onBuy={() => setOpenSlug('dataviz')}
            />
            <FormationCard
              variant="s"
              tag="SQL Professionnel"
              name="Maîtriser SQL"
              sub="SELECT → CTE → Window Functions · Niveau expert"
              stars="4.8 (180 avis)"
              feats={[
                "SELECT, WHERE, DISTINCT, CASE WHEN — bases solides",
                "6 types de JOIN avec diagrammes de Venn interactifs",
                "GROUP BY, HAVING, ROLLUP — rapports multidimensionnels",
                "CTEs multi-niveaux, EXISTS, sous-requêtes corrélées",
                "RANK(), LAG(), LEAD(), SUM() OVER — fonctions fenêtre expert",
                "8 exercices éditeur SQL + QCM + certificat personnalisé",
              ]}
              meta={[['7', 'Chapitres'], ['25+', 'Requêtes'], ['8', 'Exercices'], ['∞', 'Accès']]}
              price="12 900"
              onBuy={() => setOpenSlug('sql')}
            />
            <FormationCard
              variant="k"
              isNew
              tag="KPI & Dashboards"
              name="Maîtriser les KPIs"
              sub="Identifier · Calculer · Visualiser · 10 domaines"
              stars="5.0 (80 avis)"
              feats={[
                "KPI vs Mesure vs Métrique — les vraies définitions",
                "Les 7 questions à poser avant de choisir un KPI",
                "Matrice KPI → Graphique optimal complète",
                "10 domaines : Marketing, Finance, Projet, SaaS, E-commerce, RH...",
                "Construire un dashboard qui génère des décisions",
                "5 exercices + QCM + certificat à votre nom",
              ]}
              meta={[['8', 'Chapitres'], ['10', 'Domaines'], ['50+', 'KPIs'], ['∞', 'Accès']]}
              price="12 900"
              onBuy={() => setOpenSlug('kpi')}
            />

          </div>
        </div>
      </section>

      <section className="section" id="bundle" style={{ background: 'var(--bg)', paddingTop: 0 }}>
        <div className="section-inner">
          <div className="bundle-card fade">
            <div className="bundle-glow"></div>
            <div className="bundle-inner">
              <div>
                <div className="bundle-badge">Économisez 8 800 FCFA · Meilleure valeur</div>
                <div className="bundle-title">Bundle — Les 3 formations complètes</div>
                <div className="bundle-desc">Maîtrisez la visualisation, SQL et les KPIs en un seul pack. Le trio parfait pour devenir un data analyst complet — avec 3 certificats à votre nom.</div>
                <div className="bundle-chips">
                  <div className="bchip">
                    <div className="bchip-ico" style={{ background: 'rgba(29,191,115,.1)', color: '#6ee7b7' }}>◎</div>
                    <div><div className="bchip-name">DataViz</div><div className="bchip-sub">6 chapitres · 35+ graphiques</div></div>
                  </div>
                  <div className="bchip">
                    <div className="bchip-ico" style={{ background: 'rgba(59,130,246,.1)', color: '#93c5fd' }}>{'{ }'}</div>
                    <div><div className="bchip-name">SQL Pro</div><div className="bchip-sub">7 chapitres · Window Functions</div></div>
                  </div>
                  <div className="bchip">
                    <div className="bchip-ico" style={{ background: 'rgba(139,92,246,.1)', color: '#c4b5fd' }}>↗</div>
                    <div><div className="bchip-name">KPI & Dashboards</div><div className="bchip-sub">8 chapitres · 10 domaines</div></div>
                  </div>
                </div>
                <div className="bundle-perks">
                  <div className="bperk"><span>✓</span>3 certificats téléchargeables</div>
                  <div className="bperk"><span>✓</span>Accès à vie — tous appareils</div>
                  <div className="bperk"><span>✓</span>Mises à jour futures gratuites</div>
                  <div className="bperk"><span>✓</span>Accès immédiat</div>
                </div>
              </div>
              <div className="bundle-price-col">
                <div className="bundle-old">38 700 FCFA</div>
                <div className="bundle-new-row">
                  <span className="bundle-new">29 900</span>
                  <span className="bundle-cur">FCFA</span>
                </div>
                <div className="bundle-save">Économisez 8 800 FCFA (-23%)</div>
              </div>
            </div>
            <div className="bundle-cta">
              <button className="bundle-btn" onClick={() => setOpenSlug('bundle')}>Commander le Bundle — 29 900 FCFA</button>
              <div className="bundle-note">Paiement sécurisé · Accès aux 3 cours immédiat · Accès à vie</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="how" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div className="ey">Comment acheter</div>
          <h2 className="sec-h">Simple, rapide, immédiat</h2>
          <p className="sec-sub">Votre formation entre vos mains en moins de 5 minutes.</p>
          <div className="how-grid fade">
            <div className="how-step"><div className="how-n">1</div><div className="how-title">Choisissez votre formation</div><div className="how-desc">Cliquez sur "Acheter" sur la formation ou le bundle de votre choix.</div></div>
            <div className="how-step"><div className="how-n">2</div><div className="how-title">Effectuez le paiement</div><div className="how-desc">Payez en toute sécurité — Orange Money, MTN MoMo, Wave, Moov, Visa ou Mastercard.</div></div>
            <div className="how-step"><div className="how-n">3</div><div className="how-title">Accès immédiat</div><div className="how-desc">Vous êtes redirigé vers la formation dès que le paiement est validé.</div></div>
            <div className="how-step"><div className="how-n">4</div><div className="how-title">Apprenez et certifiez-vous</div><div className="how-desc">Terminez le QCM (≥14/20) → certificat à votre nom, partageable sur LinkedIn.</div></div>
          </div>
        </div>
      </section>

      <section className="section" id="temoignages" style={{ background: 'var(--bg)' }}>
        <div className="section-inner">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
            <div><div className="ey">Témoignages</div><h2 className="sec-h" style={{ marginBottom: 0 }}>Ce qu'ils en disent</h2></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--t1)' }}>⭐ 4.9<span style={{ fontSize: 16, color: 'var(--t2)' }}>/5</span></div><div style={{ fontSize: 12, color: 'var(--t3)' }}>420+ avis vérifiés</div></div>
          </div>
          <div className="testi-grid">
            <Testi color="#1DBF73" badge="v" name="Aminata K." role="Data Analyst · Abidjan" initial="A" text="Le simulateur d'axe Y m'a ouvert les yeux. Je faisais cette erreur depuis des années dans Power BI sans le savoir." tag="DataViz" />
            <Testi color="#3b82f6" badge="s" name="Fatoumata B." role="BI Developer · Dakar" initial="F" text="Les fonctions fenêtre me bloquaient depuis des mois. Après le chapitre 5, j'ai utilisé LAG() dans un rapport le lendemain." tag="SQL" />
            <Testi color="#8b5cf6" badge="k" name="Marie-Claire D." role="Contrôleur de gestion · Lomé" initial="M" text="Mon chef me demandait de 'définir mes KPIs' depuis 6 mois. Après le chapitre 2, j'avais une réponse claire et structurée." tag="KPI" />
            <Testi color="#f59e0b" badge="s" name="Ernest M." role="Analyste Finance · Accra" initial="E" text="Les CTEs ont révolutionné mon SQL. J'ai mis le certificat sur LinkedIn — des recruteurs m'ont contacté dans la semaine." tag="SQL" />
            <Testi color="#ef4444" badge="v" name="Kofi A." role="Data Engineer · Kumasi" initial="K" text="Le guide des 35 graphiques vaut à lui seul le prix. En 30 secondes je sais quel graphique choisir et pourquoi." tag="DataViz" />
            <Testi color="#1DBF73" badge="k" name="Soda T." role="Growth Manager · Abidjan" initial="S" text="J'ai appliqué les cas pratiques Marketing et SaaS directement. Mes dashboards génèrent maintenant de vraies décisions." tag="KPI" />
          </div>
        </div>
      </section>

      <section className="section" id="about" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div className="ey">Votre formateur</div>
          <h2 className="sec-h">Qui est derrière FinMark Support ?</h2>
          <div className="author-card fade" style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="auth-av">FZ</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 1 }}>★★★★★</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>4.9 · 420+ apprenants</div>
              </div>
            </div>
            <div>
              <div className="auth-tag">Fondateur · FinMark Support</div>
              <div className="auth-name">Kouassi Fresh-Nes Rameaux ZOUZOU</div>
              <div className="auth-title">Senior Data Analyst · NSIA Vie Assurances · Consultant GoMyCode · Fondateur FinMark Support</div>
              <p className="auth-bio">5 ans d'expérience opérationnelle en data analytics pour la finance et l'entreprise en Côte d'Ivoire. Je construis quotidiennement des dashboards KPI pour des directions générales, j'écris des requêtes SQL complexes, et je forme des professionnels depuis 2022.</p>
              <div className="auth-badges">
                <span className="auth-badge">Master 2 Data Science — CERCO</span>
                <span className="auth-badge">IBM Data Analyst Certified</span>
                <span className="auth-badge">NSIA Vie · GoMyCode</span>
                <span className="auth-badge">Abidjan, Côte d'Ivoire</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="faq" style={{ background: 'var(--bg)' }}>
        <div className="section-inner" style={{ maxWidth: 740 }}>
          <div style={{ textAlign: 'center' }}><div className="ey" style={{ display: 'block' }}>FAQ</div><h2 className="sec-h" style={{ textAlign: 'center' }}>Vos questions</h2><p className="sec-sub" style={{ textAlign: 'center' }}>Tout ce que vous devez savoir avant d'acheter</p></div>
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
          <h2 className="fcta-title">Investissez <em>dans votre expertise data</em><br/>aujourd'hui</h2>
          <p className="fcta-sub">Un seul rapport mieux analysé, présenté et décidé — et l'investissement est rentabilisé. Rejoignez 420+ professionnels qui ont fait ce choix.</p>
          <div className="fcta-btns">
            <button className="btn-hero-main" style={{ background: 'linear-gradient(135deg,var(--g),var(--g2))' }} onClick={() => setOpenSlug('dataviz')}>DataViz — 12 900 FCFA</button>
            <button className="btn-hero-main" style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }} onClick={() => setOpenSlug('sql')}>SQL — 12 900 FCFA</button>
            <button className="btn-hero-main" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }} onClick={() => setOpenSlug('kpi')}>KPI — 12 900 FCFA</button>
            <button className="btn-hero-main" style={{ background: 'linear-gradient(135deg,#86efac,var(--g))', color: '#0f1923', fontSize: 14 }} onClick={() => setOpenSlug('bundle')}>Bundle · 3 formations — 29 900 FCFA</button>
          </div>
          <div className="fcta-note">Paiement sécurisé · Accès immédiat · Accès à vie · 3 certificats inclus</div>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <a href="#" className="footer-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="footer-brand">FinMark <span>Support</span></span>
          </a>
          <div className="footer-links">
            <button onClick={() => scrollTo('formations')}>Formations</button>
            <button onClick={() => scrollTo('bundle')}>Bundle</button>
            <button onClick={() => scrollTo('how')}>Comment acheter</button>
            <button onClick={() => scrollTo('temoignages')}>Témoignages</button>
            <button onClick={() => scrollTo('about')}>À propos</button>
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
  variant: 'v' | 's' | 'k';
  popular?: boolean;
  isNew?: boolean;
  tag: string;
  name: ReactNode;
  sub: string;
  stars: string;
  feats: string[];
  meta: [string, string][];
  price: string;
  onBuy: () => void;
}

function FormationCard(p: FormationCardProps) {
  const cls = `fc fade${p.popular ? ' fc-popular' : ''}${p.isNew ? ' fc-new' : ''}`;
  const decoMap: Record<string, string> = { v: '◎', s: '{}', k: '↗' };
  return (
    <div className={cls}>
      <div className={`fc-cover fc-cover-${p.variant}`}>
        <div className="fc-cover-deco">{decoMap[p.variant]}</div>
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
            <div className={`fc-price-main fc-price-${p.variant}`}>{p.price} <span style={{ fontSize: 15, letterSpacing: 0, fontWeight: 600 }}>FCFA</span></div>
            <div className="fc-price-note">Paiement unique · Accès immédiat</div>
          </div>
          <button className={`fc-btn fc-btn-${p.variant}`} onClick={p.onBuy}>Acheter</button>
        </div>
        <div className="fc-dl">Paiement sécurisé · Accès envoyé instantanément</div>
      </div>
    </div>
  );
}

interface TestiProps { color: string; badge: 'v'|'s'|'k'; tag: string; text: string; name: string; role: string; initial: string }
function Testi(p: TestiProps) {
  return (
    <div className="tc fade">
      <div className="tc-top">
        <div className="tc-stars">★★★★★</div>
        <span className={`tc-badge tc-b-${p.badge}`}>{p.tag}</span>
      </div>
      <p className="tc-text">"{p.text}"</p>
      <div className="tc-sep"></div>
      <div className="tc-auth">
        <div className="tc-av" style={{ background: p.color }}>{p.initial}</div>
        <div><div className="tc-name">{p.name}</div><div className="tc-role">{p.role}</div></div>
      </div>
    </div>
  );
}
