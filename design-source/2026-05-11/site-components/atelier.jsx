// Direction A — Atelier (warm editorial)
// Bone background, charcoal ink, sage + amber accents.
// Serif display, mono caption. "Compliance as craft."

const Atelier = ({ tweaks }) => {
  const t = tweaks || {};
  const accent = t.atelierAccent || '#7b8a6a';
  const amber = '#c89b4a';
  const ink = '#1c1b18';
  const bone = '#efece4';
  const card = '#f6f4ec';
  const rule = 'rgba(28,27,24,0.14)';
  const muted = 'rgba(28,27,24,0.58)';
  const showMotion = t.motion !== false;

  const display = '"Newsreader","Cormorant Garamond",Georgia,serif';
  const mono = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
  const sans = '"Inter Tight",-apple-system,system-ui,sans-serif';

  return (
    <div style={{ background: bone, color: ink, fontFamily: sans, minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* subtle motion: slow, far-off gradient drift */}
      {showMotion && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background:
            `radial-gradient(60% 40% at 80% 0%, ${accent}1f, transparent 60%),` +
            `radial-gradient(50% 35% at 0% 80%, ${amber}1a, transparent 60%)`,
          animation: 'atelierDrift 24s ease-in-out infinite alternate',
        }} />
      )}
      <style>{`
        @keyframes atelierDrift { 0%{transform:translate(0,0)} 100%{transform:translate(-20px,10px)} }
        @media (prefers-reduced-motion: reduce) { [data-atelier-drift]{animation:none} }
      `}</style>

      {/* top bar */}
      <header style={{ position: 'relative', zIndex: 2, padding: '28px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${rule}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>LAYRIX</span>
          <span style={{ fontFamily: mono, fontSize: 10, color: muted, letterSpacing: '0.14em' }}>/ COMPLIANCE OS · 2026</span>
        </div>
        <nav style={{ display: 'flex', gap: 32, fontFamily: mono, fontSize: 12, letterSpacing: '0.04em' }}>
          <a href="#engine" style={{ color: ink, textDecoration: 'none' }}>Engine</a>
          <a href="#experts" style={{ color: ink, textDecoration: 'none' }}>Experts</a>
          <a href="#prep" style={{ color: ink, textDecoration: 'none' }}>Prep</a>
          <a href="#manifesto" style={{ color: ink, textDecoration: 'none' }}>Manifesto</a>
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: mono, fontSize: 11, color: muted }}>
          <span style={{ color: ink, borderBottom: `1px solid ${ink}`, paddingBottom: 1 }}>EN</span>
          <span>·</span>
          <span>FR</span>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 2, padding: '120px 56px 96px', textAlign: 'center', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: accent, letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: 36 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: accent, marginRight: 12, verticalAlign: 'middle' }} />
          The embedded compliance layer
        </div>
        <h1 style={{ fontFamily: display, fontWeight: 400, fontSize: 92, lineHeight: 0.98, letterSpacing: '-0.03em', margin: '0 auto', maxWidth: 920 }}>
          Build at AI speed.<br />
          <em style={{ fontStyle: 'italic', color: accent }}>Stay compliant by design.</em>
        </h1>
        <p style={{ fontFamily: sans, fontSize: 19, lineHeight: 1.55, color: muted, maxWidth: 620, margin: '40px auto 0' }}>
          AI is shipping software faster than compliance can keep up. Layrix is the layer that catches privacy, security and AI-governance risk while you build — not after you ship.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
          <a href="#register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 28px', borderRadius: 2,
            background: ink, color: bone, textDecoration: 'none',
            fontFamily: mono, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase'
          }}>Register LLLL — free <span style={{ opacity: 0.6 }}>→</span></a>
          <a href="#prep" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 28px', borderRadius: 2,
            background: 'transparent', color: ink, textDecoration: 'none',
            border: `1px solid ${ink}`,
            fontFamily: mono, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase'
          }}>Buy AIGP Prep — $200 <span style={{ opacity: 0.6 }}>→</span></a>
        </div>

        {/* hero strip — three small numbers */}
        <div style={{ marginTop: 88, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${rule}`, borderBottom: `1px solid ${rule}` }}>
          {[
            ['001', 'Triggered domains', 'parsed from your repo'],
            ['002', 'file : line gaps', 'mapped to law'],
            ['003', 'lawyer-ready brief', 'one command'],
            ['004', 'local-first', 'nothing leaves your box'],
          ].map(([n, k, v]) => (
            <div key={n} style={{ padding: '22px 14px', textAlign: 'left', borderRight: `1px solid ${rule}` }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: muted, letterSpacing: '0.18em' }}>{n}</div>
              <div style={{ fontFamily: display, fontSize: 18, marginTop: 8, letterSpacing: '-0.01em' }}>{k}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: muted, marginTop: 6 }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THE GAP */}
      <section style={{ position: 'relative', zIndex: 2, padding: '40px 56px 96px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr', gap: 64, alignItems: 'start', marginBottom: 56 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: muted, letterSpacing: '0.22em', textTransform: 'uppercase' }}>§ 01 — The Gap</div>
            <h2 style={{ fontFamily: display, fontWeight: 400, fontSize: 56, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 18 }}>
              Software production has changed.<br />
              <span style={{ color: muted }}>Compliance has not.</span>
            </h2>
          </div>
          <p style={{ fontFamily: sans, fontSize: 17, lineHeight: 1.65, color: muted, paddingTop: 10 }}>
            One developer, one small team, or even one AI agent can ship faster than ever. Most teams still treat compliance as a launch-time problem — surfacing only when investors run diligence, enterprise customers ask, or a regulator pushes back. By then, compliance is no longer guidance. It is rework.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid ${ink}` }}>
          {[
            ['↓', 'Build cost is collapsing', 'AI tools turn weeks of engineering into days. One developer ships production software with the leverage of a team.'],
            ['→', 'Risk lands earlier', 'Privacy, security, and AI-governance gaps land in the codebase on day one — long before legal, audit, or compliance gets a look.'],
            ['↑', 'Review still arrives at the end', 'Manual reviews. $5K–$500K engagements. Slow turnarounds. Built for an era when shipping was hard.'],
          ].map(([g, k, v], i) => (
            <div key={k} style={{ padding: '36px 28px 32px', borderRight: i < 2 ? `1px solid ${rule}` : 'none' }}>
              <div style={{ fontFamily: display, fontSize: 64, lineHeight: 0.8, color: amber }}>{g}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 24 }}>0{i + 1}</div>
              <h3 style={{ fontFamily: display, fontSize: 24, fontWeight: 500, marginTop: 10, letterSpacing: '-0.01em' }}>{k}</h3>
              <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.65, color: muted, marginTop: 12 }}>{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE LAYER + THREE ENGINES */}
      <section id="engine" style={{ position: 'relative', zIndex: 2, padding: '40px 56px 96px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr', gap: 64, alignItems: 'start', marginBottom: 56 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: muted, letterSpacing: '0.22em', textTransform: 'uppercase' }}>§ 02 — The Layer</div>
            <h2 style={{ fontFamily: display, fontWeight: 400, fontSize: 56, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 18 }}>
              One layer.<br /><span style={{ color: accent, fontStyle: 'italic' }}>Three engines.</span>
            </h2>
          </div>
          <p style={{ fontFamily: sans, fontSize: 17, lineHeight: 1.65, color: muted, paddingTop: 10 }}>
            Layrix brings compliance into the development workflow itself. Not a dashboard you visit — a layer that ships with your code. Pick the engine that fits this stage of your work, or use all three together.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            {
              tag: 'Engine · Freemium', name: 'LLLL Compliance Engine', accent,
              body: 'From a feature sketch to a lawyer-ready handoff — triggered domains, file:line gaps, owned actions, all from inside your CLI.',
              bullets: [
                'Daily check + deep-dive review',
                'Push & release gates block leaks',
                'Today in Claude Code · opencode + Codex CLI soon',
                'Local-first — nothing leaves your machine',
              ],
              link: 'Explore LLLL'
            },
            {
              tag: 'Network · Per engagement', name: 'Layrix Expert Review', accent: amber,
              body: 'For the calls a machine cannot make: regulated launches, board-level audits, contract language. A named specialist reads your code and writes a structured report.',
              bullets: [
                'Senior privacy + AI-governance specialists',
                'Cited findings, mapped to law and code',
              ],
              link: 'Request a quote'
            },
            {
              tag: 'Enablement · $200 one-time', name: 'JC AIGP Quick Pass 2026', accent: '#3f4a5b',
              body: 'End-to-end IAPP AIGP exam prep. 500+ knowledge points across six interlocking learning modes — for the candidate sitting the AIGP in one to two months.',
              bullets: [
                'Six modes — lectures, study guide, essentials, practice, flashcards, cram',
                '1,100+ items · five mock exams (A–E) · BoK 2.1.0',
                'Optional self-configured AI tutor',
                '$200 once · 30-day refund or free upgrade',
              ],
              link: 'Buy AIGP Prep'
            },
          ].map((e, i) => (
            <div key={e.name} style={{ background: card, padding: '28px 26px 26px', position: 'relative', border: `1px solid ${rule}`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: -1, left: -1, padding: '6px 12px', background: e.accent, color: bone, fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{`0${i + 1}`}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: e.accent, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 18 }}>{e.tag}</div>
              <h3 style={{ fontFamily: display, fontSize: 30, fontWeight: 500, marginTop: 10, letterSpacing: '-0.01em', lineHeight: 1.05 }}>{e.name}</h3>
              <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.6, color: muted, marginTop: 14 }}>{e.body}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 24px', borderTop: `1px solid ${rule}` }}>
                {e.bullets.map((b) => (
                  <li key={b} style={{ fontFamily: mono, fontSize: 11.5, lineHeight: 1.5, color: ink, padding: '10px 0', borderBottom: `1px solid ${rule}`, display: 'flex', gap: 10 }}>
                    <span style={{ color: e.accent }}>—</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a href="#" style={{
                marginTop: 'auto', fontFamily: mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: ink, textDecoration: 'none', display: 'inline-flex', justifyContent: 'space-between',
                padding: '12px 14px', border: `1px solid ${ink}`, alignSelf: 'stretch'
              }}>
                <span>{e.link}</span><span>→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section id="manifesto" style={{ position: 'relative', zIndex: 2, padding: '40px 56px 96px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr', gap: 64, alignItems: 'start', marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: muted, letterSpacing: '0.22em', textTransform: 'uppercase' }}>§ 03 — Why it matters</div>
            <h2 style={{ fontFamily: display, fontWeight: 400, fontSize: 56, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 18 }}>
              Not a way to slow teams down.<br /><span style={{ color: muted }}>A way to move at AI speed without paying for it later.</span>
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', borderTop: `1px solid ${ink}` }}>
          {[
            ['Move faster, with confidence', 'Compliance signals arrive while the design is still cheap to change — not at launch, not at diligence.'],
            ['Cut costly rework', 'Every gap caught at design time is one that never becomes an incident, an audit finding, or a board memo.'],
            ['Earn buyer + investor trust', 'Reviewable, citable evidence of how you handle privacy, AI risk, and security — on demand.'],
            ['Build teams that scale', 'AIGP enablement turns one-off expert engagements into in-house compliance maturity that compounds.'],
          ].map(([h, b], i) => (
            <div key={h} style={{ padding: '32px 28px 32px', borderRight: i % 2 === 0 ? `1px solid ${rule}` : 'none', borderBottom: i < 2 ? `1px solid ${rule}` : 'none' }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: accent, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{`0${i + 1}`}</div>
              <h3 style={{ fontFamily: display, fontSize: 28, fontWeight: 500, marginTop: 12, letterSpacing: '-0.01em' }}>{h}</h3>
              <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.65, color: muted, marginTop: 12 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 56px 96px', textAlign: 'center', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ background: ink, color: bone, padding: '88px 32px' }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: amber, letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: 28 }}>
            Coda
          </div>
          <h2 style={{ fontFamily: display, fontWeight: 400, fontSize: 64, lineHeight: 1, letterSpacing: '-0.025em' }}>
            A new layer for a<br /><em style={{ color: accent, fontStyle: 'italic' }}>new era of building.</em>
          </h2>
          <p style={{ fontFamily: sans, fontSize: 18, color: 'rgba(239,236,228,0.7)', maxWidth: 560, margin: '32px auto 0', lineHeight: 1.6 }}>
            AI made it possible for every team to build faster. Layrix makes it possible to build responsibly.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 44, flexWrap: 'wrap' }}>
            <a href="#" style={{ padding: '16px 28px', background: bone, color: ink, textDecoration: 'none', fontFamily: mono, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Register LLLL — free →</a>
            <a href="#" style={{ padding: '16px 28px', border: `1px solid ${bone}`, color: bone, textDecoration: 'none', fontFamily: mono, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Buy AIGP Prep →</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 2, padding: '40px 56px 56px', borderTop: `1px solid ${rule}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 40, fontFamily: mono, fontSize: 11, color: muted, letterSpacing: '0.02em' }}>
          <div>
            <div style={{ color: ink, fontFamily: display, fontSize: 22, letterSpacing: '-0.01em' }}>Layrix</div>
            <div style={{ marginTop: 10 }}>1045 Howe St<br />Vancouver, BC V6Z 2A9<br />Canada</div>
          </div>
          <div>
            <div style={{ color: ink, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>Products</div>
            <div>LLLL</div><div>Expert Review</div><div>AIGP Prep</div>
          </div>
          <div>
            <div style={{ color: ink, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>Legal</div>
            <div>Terms</div><div>Privacy</div><div>Acceptable Use</div>
          </div>
          <div>
            <div style={{ color: ink, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>Contact</div>
            <div>info@layrix.ai</div><div>GitHub · JettyRepo/LLLL</div>
          </div>
        </div>
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${rule}`, fontFamily: mono, fontSize: 10, color: muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 Caerus Enterprises Inc. All rights reserved.</span>
          <span>v.2026.05 · Vancouver / Remote</span>
        </div>
      </footer>
    </div>
  );
};

window.Atelier = Atelier;
