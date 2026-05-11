// Direction C — Marquee (editorial-bold)
// Big slab/grotesk headlines, structured grid, large numerals as section markers.

const Marquee = ({ tweaks }) => {
  const t = tweaks || {};
  const showMotion = t.motion !== false;
  const accent = t.marqueeAccent || '#2f6f4a';
  const paper = '#f1efe7';
  const ink = '#161614';
  const muted = 'rgba(22,22,20,0.62)';
  const card = '#fffefa';
  const rule = 'rgba(22,22,20,0.12)';

  const display = '"Fraunces","Tiempos Headline","Plantin",Georgia,serif';
  const sans = '"Inter Tight",-apple-system,system-ui,sans-serif';
  const mono = '"JetBrains Mono",ui-monospace,monospace';

  // intentionally NOT using Fraunces — fallback to slab-ish serif via stack
  // (system stacks chosen to avoid AI-slop fonts when web fonts not available)

  return (
    <div style={{ background: paper, color: ink, fontFamily: sans, minHeight: '100%' }}>
      <header style={{ padding: '22px 56px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', borderBottom: `1px solid ${ink}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'inline-block', width: 22, height: 22, background: accent, borderRadius: 11, position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', inset: 4, background: paper, borderRadius: 7 }} />
            <span style={{ position: 'absolute', inset: 8, background: accent, borderRadius: 3 }} />
          </span>
          <span style={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: 18 }}>Layrix</span>
        </div>
        <nav style={{ display: 'flex', gap: 28, fontSize: 14 }}>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>Engine</a>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>Experts</a>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>AIGP Prep</a>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>Docs</a>
          <a href="#" style={{ color: ink, textDecoration: 'none' }}>Pricing</a>
        </nav>
        <div style={{ justifySelf: 'end', display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#" style={{ fontSize: 13, color: ink, textDecoration: 'none' }}>Sign in</a>
          <a href="#" style={{ padding: '10px 18px', background: ink, color: paper, textDecoration: 'none', fontSize: 13, fontWeight: 500, borderRadius: 999 }}>Get started →</a>
        </div>
      </header>

      {/* MARQUEE HERO */}
      <section style={{ padding: '88px 56px 0', textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', border: `1px solid ${ink}`, borderRadius: 999, fontSize: 12, letterSpacing: '0.04em' }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: accent, display: 'inline-block', animation: showMotion ? 'marqDot 2.4s ease-in-out infinite' : 'none' }} />
          The embedded compliance layer · 2026
        </div>
        <style>{`@keyframes marqDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.5} }`}</style>

        <h1 style={{ fontFamily: display, fontWeight: 500, fontSize: 132, lineHeight: 0.92, letterSpacing: '-0.045em', margin: '36px auto 0', maxWidth: 1200 }}>
          Build at <span style={{ fontStyle: 'italic', fontWeight: 400, color: accent }}>AI&nbsp;speed.</span><br />
          Stay <span style={{ textDecoration: 'underline', textDecorationThickness: '4px', textUnderlineOffset: '12px', textDecorationColor: accent }}>compliant</span> by design.
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: muted, maxWidth: 620, margin: '36px auto 0' }}>
          AI ships software faster than compliance can keep up. Layrix is the layer that catches privacy, security and AI-governance risk while you build — not after you launch.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
          <a href="#" style={{ padding: '16px 26px', background: ink, color: paper, textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 999 }}>Register LLLL — free →</a>
          <a href="#" style={{ padding: '16px 26px', border: `1px solid ${ink}`, color: ink, textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 999 }}>Buy AIGP Prep — $200 →</a>
        </div>

        {/* hero strip */}
        <div style={{ marginTop: 80, padding: '20px 0', borderTop: `1px solid ${ink}`, borderBottom: `1px solid ${ink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, overflow: 'hidden' }}>
          {['triggered domains', 'file:line gaps', 'lawyer-ready brief', 'local-first', 'one command', 'AIGP BoK 2.1.0'].map((s, i) => (
            <React.Fragment key={s}>
              <span style={{ flex: '0 0 auto', padding: '0 14px' }}>{s}</span>
              {i < 5 && <span style={{ flex: '0 0 auto', color: accent }}>✦</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* GAP */}
      <section style={{ padding: '120px 56px 88px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 40, alignItems: 'start' }}>
          <div style={{ fontFamily: display, fontSize: 140, lineHeight: 0.85, fontWeight: 400, color: accent, fontStyle: 'italic' }}>01</div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: muted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>The Gap</div>
            <h2 style={{ fontFamily: display, fontWeight: 500, fontSize: 72, lineHeight: 0.96, letterSpacing: '-0.03em', marginTop: 14, maxWidth: 1000 }}>
              Software production has changed. <span style={{ color: muted }}>Compliance has not.</span>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: muted, maxWidth: 760, marginTop: 28 }}>
              One developer, one small team, or even one AI agent can ship faster than ever. Most teams still treat compliance as a launch-time problem — surfacing only when investors run diligence, customers ask, or regulators push back. By then it is no longer guidance. It is rework.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 56 }}>
          {[
            ['Build cost is collapsing', 'AI tools turn weeks of engineering into days. A single developer ships production software with the leverage of a team.'],
            ['Risk lands earlier', 'Privacy, security and AI-governance gaps land in the codebase on day one — long before legal, audit or compliance gets a look.'],
            ['Review still arrives at the end', 'Manual reviews. $5K–$500K engagements. Slow turnarounds. Built for an era when shipping was hard.'],
          ].map(([h, b], i) => (
            <div key={h} style={{ background: card, padding: '32px 26px', borderRadius: 14, border: `1px solid ${rule}` }}>
              <div style={{ fontFamily: display, fontSize: 56, lineHeight: 1, color: accent, fontWeight: 500 }}>{String(i + 1).padStart(2, '0')}</div>
              <h3 style={{ fontFamily: display, fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 24, lineHeight: 1.15 }}>{h}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: muted, marginTop: 12 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ENGINES */}
      <section style={{ padding: '88px 56px 88px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 40, alignItems: 'start' }}>
          <div style={{ fontFamily: display, fontSize: 140, lineHeight: 0.85, fontWeight: 400, color: accent, fontStyle: 'italic' }}>02</div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: muted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>The Layer</div>
            <h2 style={{ fontFamily: display, fontWeight: 500, fontSize: 72, lineHeight: 0.96, letterSpacing: '-0.03em', marginTop: 14, maxWidth: 1000 }}>
              One layer. <span style={{ fontStyle: 'italic', color: accent }}>Three engines.</span>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: muted, maxWidth: 760, marginTop: 28 }}>
              Not a dashboard you visit — a layer that ships with your code. Pick the engine that fits this stage of your work, or use all three together.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 56 }}>
          {[
            { tag: 'Engine · Freemium', name: 'LLLL', sub: 'Compliance Engine', body: 'Feature sketch → lawyer-ready handoff. Triggered domains, file:line gaps, owned actions — all from inside your CLI.', bullets: ['Daily check + deep-dive review', 'Push & release gates block leaks', 'Today in Claude Code', 'Local-first'], cta: 'Explore LLLL', accent },
            { tag: 'Network · Per engagement', name: 'Experts', sub: 'Layrix Expert Review', body: 'For the calls a machine cannot make. A named specialist reads your code and writes a structured, cited report.', bullets: ['Senior privacy + AI-gov specialists', 'Findings mapped to law and code'], cta: 'Request a quote', accent: '#a23a1b' },
            { tag: '$200 once · Enablement', name: 'AIGP', sub: 'JC AIGP Quick Pass 2026', body: '500+ knowledge points across six interlocking modes — for the candidate sitting AIGP in one to two months.', bullets: ['Six modes · 1,100+ items · five mocks', 'Calibrated to BoK 2.1.0', 'Optional self-configured AI tutor', '30-day refund or upgrade'], cta: 'Buy prep', accent: '#3a4a6b' },
          ].map((e, i) => (
            <div key={e.name} style={{ background: card, borderRadius: 14, padding: '28px 24px 24px', border: `1px solid ${rule}`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, background: e.accent, opacity: 0.08 }} />
              <div style={{ fontFamily: mono, fontSize: 11, color: e.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{e.tag}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 12 }}>
                <h3 style={{ fontFamily: display, fontSize: 44, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1 }}>{e.name}</h3>
                <span style={{ fontSize: 14, color: muted }}>{e.sub}</span>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: muted, marginTop: 16 }}>{e.body}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 22px', display: 'grid', gap: 8 }}>
                {e.bullets.map((b) => (
                  <li key={b} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                    <span style={{ color: e.accent, fontWeight: 700 }}>✓</span><span>{b}</span>
                  </li>
                ))}
              </ul>
              <a href="#" style={{ marginTop: 'auto', padding: '12px 18px', background: ink, color: paper, textDecoration: 'none', fontSize: 13, fontWeight: 500, borderRadius: 999, display: 'inline-flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{e.cta}</span><span>→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section style={{ padding: '88px 56px 88px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 40, alignItems: 'start' }}>
          <div style={{ fontFamily: display, fontSize: 140, lineHeight: 0.85, fontWeight: 400, color: accent, fontStyle: 'italic' }}>03</div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: muted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Why it matters</div>
            <h2 style={{ fontFamily: display, fontWeight: 500, fontSize: 72, lineHeight: 0.96, letterSpacing: '-0.03em', marginTop: 14, maxWidth: 1000 }}>
              Move at AI speed <span style={{ fontStyle: 'italic', color: accent }}>without paying for it later.</span>
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 56, background: ink, color: paper, borderRadius: 16, overflow: 'hidden' }}>
          {[
            ['Move faster, with confidence', 'Compliance signals arrive while the design is still cheap to change.'],
            ['Cut costly rework', 'Every gap caught at design time is one that never becomes an incident.'],
            ['Earn buyer & investor trust', 'Citable evidence of how you handle privacy, AI risk and security — on demand.'],
            ['Build teams that scale', 'AIGP enablement turns one-off engagements into in-house maturity.'],
          ].map(([h, b], i) => (
            <div key={h} style={{ padding: '36px 26px', borderRight: i < 3 ? `1px solid rgba(255,255,255,0.1)` : 'none' }}>
              <div style={{ fontFamily: display, fontSize: 36, color: accent, fontWeight: 500 }}>0{i + 1}</div>
              <h3 style={{ fontFamily: display, fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 18, lineHeight: 1.15 }}>{h}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(241,239,231,0.7)', marginTop: 10 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '40px 56px 96px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '88px 32px', borderRadius: 20, background: card, border: `1px solid ${rule}` }}>
          <h2 style={{ fontFamily: display, fontWeight: 500, fontSize: 84, lineHeight: 0.95, letterSpacing: '-0.035em', maxWidth: 900, margin: '0 auto' }}>
            A new layer for a <span style={{ fontStyle: 'italic', color: accent }}>new era of building.</span>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: muted, maxWidth: 560, margin: '24px auto 0' }}>
            AI made it possible for every team to build faster. Layrix makes it possible to build responsibly.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            <a href="#" style={{ padding: '16px 28px', background: ink, color: paper, textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 999 }}>Register LLLL — free →</a>
            <a href="#" style={{ padding: '16px 28px', border: `1px solid ${ink}`, color: ink, textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 999 }}>Buy AIGP Prep →</a>
          </div>
        </div>
      </section>

      <footer style={{ padding: '48px 56px 56px', borderTop: `1px solid ${ink}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 32, fontSize: 13.5, color: muted }}>
          <div>
            <div style={{ fontFamily: display, fontSize: 28, color: ink, fontWeight: 500, letterSpacing: '-0.01em' }}>Layrix</div>
            <div style={{ marginTop: 10 }}>1045 Howe St, Vancouver, BC V6Z 2A9, Canada</div>
            <div style={{ marginTop: 6 }}>info@layrix.ai</div>
          </div>
          <div><div style={{ color: ink, fontWeight: 600 }}>Products</div><div style={{ marginTop: 10 }}>LLLL</div><div>Experts</div><div>AIGP Prep</div></div>
          <div><div style={{ color: ink, fontWeight: 600 }}>Legal</div><div style={{ marginTop: 10 }}>Terms</div><div>Privacy</div><div>Acceptable Use</div></div>
          <div><div style={{ color: ink, fontWeight: 600 }}>Source</div><div style={{ marginTop: 10 }}>github.com/JettyRepo/LLLL</div><div>npm: llll</div></div>
        </div>
        <div style={{ marginTop: 32, paddingTop: 18, borderTop: `1px solid ${rule}`, fontSize: 12, color: muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 Caerus Enterprises Inc.</span><span>Made in Vancouver / Remote</span>
        </div>
      </footer>
    </div>
  );
};

window.Marquee = Marquee;
