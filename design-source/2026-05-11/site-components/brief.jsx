// Direction B — Brief (restrained dev-tool, mono-only)
// Near-mono palette, rule-lines, section numbers. Typed-memo feel.

const Brief = ({ tweaks }) => {
  const t = tweaks || {};
  const showMotion = t.motion !== false;
  const accent = t.briefAccent || '#d8542c';
  const paper = '#fafaf7';
  const ink = '#111111';
  const muted = '#6b6b6b';
  const rule = '#e6e3da';
  const card = '#f3f1ea';
  const mono = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';

  const Rule = ({ note }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 24px', fontFamily: mono, fontSize: 10, color: muted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
      <div style={{ flex: 1, height: 1, background: ink }} />
      {note && <span>{note}</span>}
      <div style={{ flex: 1, height: 1, background: ink }} />
    </div>
  );

  return (
    <div style={{ background: paper, color: ink, fontFamily: mono, minHeight: '100%' }}>
      {/* nav */}
      <header style={{ padding: '20px 48px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', borderBottom: `1px solid ${ink}` }}>
        <div style={{ fontSize: 12, letterSpacing: '0.18em' }}>LAYRIX // COMPLIANCE.OS</div>
        <nav style={{ display: 'flex', gap: 28, fontSize: 11, letterSpacing: '0.1em' }}>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>[ENGINE]</a>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>[EXPERTS]</a>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>[PREP]</a>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>[DOCS]</a>
        </nav>
        <div style={{ justifySelf: 'end', fontSize: 11, color: muted, display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: accent, display: 'inline-block', animation: showMotion ? 'briefPulse 1.8s ease-in-out infinite' : 'none' }} />
            v.2026.05 · build OK
          </span>
          <span>EN · <span style={{ color: muted, opacity: 0.6 }}>FR</span></span>
        </div>
      </header>

      <style>{`
        @keyframes briefPulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
      `}</style>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '60px 48px 40px' }}>

        {/* HERO — typed memo */}
        <section style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, alignItems: 'end', borderBottom: `1px solid ${ink}`, paddingBottom: 56 }}>
            <div>
              <div style={{ fontSize: 11, color: muted, letterSpacing: '0.22em' }}>MEMO · TO BUILDERS · 2026-05-11</div>
              <h1 style={{ fontSize: 72, fontWeight: 600, lineHeight: 0.95, letterSpacing: '-0.04em', margin: '24px 0 0' }}>
                Build at AI speed.<br />
                <span style={{ color: muted }}>{'>'}</span> <span style={{ color: accent }}>Stay compliant by design.</span>
              </h1>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#2a2a2a', marginTop: 32, maxWidth: 640 }}>
                AI is shipping software faster than compliance can keep up. Layrix is the embedded compliance layer for the AI era — so risks are caught while you build, not after you ship.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
                <a href="#" style={{ padding: '14px 22px', background: ink, color: paper, textDecoration: 'none', fontSize: 12, letterSpacing: '0.12em' }}>$ npm i -g llll &nbsp; →</a>
                <a href="#" style={{ padding: '14px 22px', background: 'transparent', color: ink, textDecoration: 'none', border: `1px solid ${ink}`, fontSize: 12, letterSpacing: '0.12em' }}>BUY AIGP PREP — $200 →</a>
              </div>
            </div>

            {/* terminal block */}
            <div style={{ background: ink, color: paper, padding: 20, fontSize: 11.5, lineHeight: 1.65 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: 14, letterSpacing: '0.1em' }}>
                <span>~ / repo / app</span>
                <span>llll check</span>
              </div>
              <div><span style={{ color: '#888' }}>$</span> llll check --depth deep</div>
              <div style={{ color: '#aaa', marginTop: 6 }}>scanning · 184 files · 3 services</div>
              <div style={{ marginTop: 10 }}><span style={{ color: accent }}>!</span> triggered domain: <b>biometric processing</b></div>
              <div><span style={{ color: accent }}>!</span> triggered domain: <b>cross-border transfer (EU→US)</b></div>
              <div><span style={{ color: '#aaa' }}>·</span> gap @ src/auth/face.ts:42</div>
              <div><span style={{ color: '#aaa' }}>·</span> gap @ src/api/ingest.ts:118</div>
              <div style={{ marginTop: 10, color: '#7fd99c' }}>✓ brief ready  →  .layrix/brief.md</div>
            </div>
          </div>
        </section>

        {/* GAP */}
        <section style={{ paddingTop: 72 }}>
          <Rule note="§ 01 — THE GAP" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginBottom: 40 }}>
            <h2 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Software production has changed.<br />
              <span style={{ color: muted }}>Compliance has not.</span>
            </h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#2a2a2a' }}>
              One developer, one small team, or one AI agent can ship faster than ever. Most teams still treat compliance as a launch-time problem — surfacing only when investors run diligence, enterprise customers ask, or a regulator pushes back. By then compliance is no longer guidance. It is rework.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', borderTop: `1px solid ${ink}` }}>
            {[
              ['Build cost is collapsing', 'AI tools turn weeks of engineering into days. One developer ships with the leverage of a team.', '↓'],
              ['Risk lands earlier', 'Privacy, security, and AI-governance gaps land in the codebase on day one.', '→'],
              ['Review still arrives at the end', 'Manual reviews. $5K–$500K engagements. Slow turnarounds. Built for an era when shipping was hard.', '↑'],
            ].map(([h, b, g], i) => (
              <React.Fragment key={h}>
                {i === 0 && <div style={{ borderRight: `1px solid ${rule}`, padding: '22px 12px', fontSize: 11, color: muted }}>idx</div>}
                {i !== 0 && null}
              </React.Fragment>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid ${ink}`, borderBottom: `1px solid ${ink}` }}>
            {[
              ['Build cost is collapsing', 'AI tools turn weeks of engineering into days. One developer ships with the leverage of a team.', '↓'],
              ['Risk lands earlier', 'Privacy, security, and AI-governance gaps land in the codebase on day one — before legal, audit, or compliance gets a look.', '→'],
              ['Review still arrives at the end', 'Manual reviews. $5K–$500K engagements. Slow turnarounds. Built for an era when shipping was hard.', '↑'],
            ].map(([h, b, g], i) => (
              <div key={h} style={{ padding: '28px 24px 28px', borderRight: i < 2 ? `1px solid ${rule}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: muted, letterSpacing: '0.2em' }}>
                  <span>0{i + 1}</span>
                  <span style={{ color: accent }}>{g}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 14, letterSpacing: '-0.005em' }}>{h}</h3>
                <p style={{ fontSize: 12.5, lineHeight: 1.65, color: '#2a2a2a', marginTop: 10 }}>{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ENGINES */}
        <section style={{ paddingTop: 72 }}>
          <Rule note="§ 02 — ONE LAYER, THREE ENGINES" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginBottom: 40 }}>
            <h2 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Not a dashboard you visit.<br /><span style={{ color: accent }}>A layer that ships with your code.</span>
            </h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#2a2a2a' }}>
              Layrix brings compliance into the development workflow itself. Pick the engine that fits this stage of your work — or use all three together. Same registry of triggered domains, same evidence format.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, border: `1px solid ${ink}` }}>
            {[
              {
                idx: 'LLLL',
                meta: 'engine · freemium',
                name: 'Compliance Engine',
                body: 'From a feature sketch to a lawyer-ready handoff — triggered domains, file:line gaps, owned actions, all from inside your CLI.',
                bullets: [
                  'Daily check + deep-dive review',
                  'Push & release gates block leaks',
                  'Claude Code today · opencode/Codex CLI soon',
                  'Local-first — nothing leaves your machine',
                ],
                cta: 'Register free →',
              },
              {
                idx: 'EXPERT',
                meta: 'network · per engagement',
                name: 'Expert Review',
                body: 'For the calls a machine cannot make. A named specialist reads your code and writes a structured, cited report.',
                bullets: [
                  'Senior privacy + AI-governance specialists',
                  'Findings mapped to law and code',
                ],
                cta: 'Request quote →',
              },
              {
                idx: 'AIGP',
                meta: 'enablement · $200 one-time',
                name: 'JC AIGP Quick Pass',
                body: 'End-to-end IAPP AIGP exam prep. 500+ knowledge points across six interlocking learning modes for the candidate sitting AIGP in 1–2 months.',
                bullets: [
                  'Six modes: lectures, study guide, essentials, practice, flashcards, cram',
                  '1,100+ items · five mock exams · BoK 2.1.0',
                  'Optional self-configured AI tutor',
                  '$200 once · 30-day refund or upgrade',
                ],
                cta: 'Buy prep →',
              },
            ].map((e, i) => (
              <div key={e.name} style={{ background: i === 1 ? card : paper, borderRight: i < 2 ? `1px solid ${ink}` : 'none', padding: '28px 24px 24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 22, letterSpacing: '0.05em', fontWeight: 700 }}>{e.idx}</div>
                  <div style={{ fontSize: 10, color: muted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{e.meta}</div>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 18 }}>{e.name}</h3>
                <p style={{ fontSize: 12.5, lineHeight: 1.65, color: '#2a2a2a', marginTop: 12 }}>{e.body}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 22px' }}>
                  {e.bullets.map((b, j) => (
                    <li key={b} style={{ fontSize: 11.5, lineHeight: 1.55, padding: '8px 0', borderTop: `1px solid ${rule}`, display: 'grid', gridTemplateColumns: '28px 1fr', gap: 6, color: '#2a2a2a' }}>
                      <span style={{ color: muted }}>{String(j + 1).padStart(2, '0')}</span><span>{b}</span>
                    </li>
                  ))}
                </ul>
                <a href="#" style={{ marginTop: 'auto', display: 'block', textAlign: 'center', padding: '12px 0', background: ink, color: paper, textDecoration: 'none', fontSize: 11, letterSpacing: '0.14em' }}>{e.cta}</a>
              </div>
            ))}
          </div>
        </section>

        {/* WHY */}
        <section style={{ paddingTop: 72 }}>
          <Rule note="§ 03 — WHY IT MATTERS" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginBottom: 40 }}>
            <h2 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Not a way to slow teams down.<br />
              <span style={{ color: muted }}>A way to move at AI speed and not pay later.</span>
            </h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#2a2a2a' }}>
              The cost of a gap caught at design time is a fraction of the cost of one caught in diligence — and a tiny fraction of one caught by a regulator. Layrix is built for that math.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${ink}`, borderBottom: `1px solid ${ink}` }}>
            {[
              ['Move faster', 'Compliance signals arrive while the design is still cheap to change.'],
              ['Cut rework', 'Every gap caught at design time is one that never becomes an incident.'],
              ['Earn trust', 'Reviewable, citable evidence of how you handle privacy, AI risk, and security.'],
              ['Scale teams', 'AIGP enablement turns one-off expert engagements into in-house maturity.'],
            ].map(([h, b], i) => (
              <div key={h} style={{ padding: '24px 18px', borderRight: i < 3 ? `1px solid ${rule}` : 'none' }}>
                <div style={{ fontSize: 10, color: accent, letterSpacing: '0.2em' }}>{String(i + 1).padStart(2, '0')}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12, letterSpacing: '-0.005em' }}>{h}</h3>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: '#2a2a2a', marginTop: 10 }}>{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '88px 0 80px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: muted, letterSpacing: '0.32em' }}>CTA · CLOSING</div>
          <h2 style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 24 }}>
            A new layer for a<br /><span style={{ color: accent }}>new era of building.</span>
          </h2>
          <p style={{ fontSize: 14.5, color: '#2a2a2a', maxWidth: 540, margin: '28px auto 0', lineHeight: 1.7 }}>
            AI made it possible for every team to build faster. Layrix makes it possible to build responsibly.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            <a href="#" style={{ padding: '14px 26px', background: ink, color: paper, textDecoration: 'none', fontSize: 12, letterSpacing: '0.14em' }}>REGISTER LLLL — FREE →</a>
            <a href="#" style={{ padding: '14px 26px', border: `1px solid ${ink}`, color: ink, textDecoration: 'none', fontSize: 12, letterSpacing: '0.14em' }}>BUY AIGP PREP →</a>
          </div>
        </section>

      </main>

      <footer style={{ padding: '32px 48px 48px', borderTop: `1px solid ${ink}`, fontSize: 11, color: muted, letterSpacing: '0.04em' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 32 }}>
          <div>
            <div style={{ color: ink, fontSize: 13, letterSpacing: '0.18em' }}>LAYRIX</div>
            <div style={{ marginTop: 10 }}>1045 Howe St, Vancouver, BC V6Z 2A9, Canada</div>
            <div style={{ marginTop: 6 }}>info@layrix.ai</div>
          </div>
          <div><div style={{ color: ink, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Products</div><div style={{ marginTop: 10 }}>LLLL</div><div>Experts</div><div>AIGP Prep</div></div>
          <div><div style={{ color: ink, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Legal</div><div style={{ marginTop: 10 }}>Terms</div><div>Privacy</div><div>Acceptable Use</div></div>
          <div><div style={{ color: ink, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Source</div><div style={{ marginTop: 10 }}>github.com/JettyRepo/LLLL</div><div>npm: llll</div></div>
        </div>
        <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${rule}`, display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 Caerus Enterprises Inc.</span><span>build · 2026.05 · ok</span>
        </div>
      </footer>
    </div>
  );
};

window.Brief = Brief;
