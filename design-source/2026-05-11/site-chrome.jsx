// Shared chrome — Header, Footer, SectionRow, Logo. Expects styles from site-shared.css.
const _ink = 'var(--ink)';
const _paper = 'var(--paper)';
const _paper2 = 'var(--paper-2)';
const _muted = 'var(--muted)';
const _rule = 'var(--rule)';
const _accent = 'var(--accent)';

function Logo() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="28" viewBox="0 0 672 480" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="96" y="0" width="64" height="32" fill="#d97757"/><rect x="480" y="0" width="128" height="32" fill="#d97757"/>
        <rect x="64" y="32" width="128" height="32" fill="#d97757"/><rect x="448" y="32" width="192" height="32" fill="#d97757"/>
        <rect x="32" y="64" width="192" height="32" fill="#d97757"/><rect x="416" y="64" width="224" height="32" fill="#d97757"/>
        <rect x="0" y="96" width="256" height="32" fill="#d97757"/><rect x="384" y="96" width="256" height="32" fill="#d97757"/>
        <rect x="0" y="128" width="640" height="32" fill="#d97757"/>
        <rect x="0" y="160" width="640" height="32" fill="#d97757"/>
        <rect x="0" y="192" width="96" height="32" fill="#d97757"/><rect x="96" y="192" width="64" height="32" fill="#0a0a0a"/><rect x="160" y="192" width="64" height="32" fill="#d97757"/><rect x="224" y="192" width="64" height="32" fill="#0a0a0a"/><rect x="288" y="192" width="64" height="32" fill="#d97757"/><rect x="352" y="192" width="64" height="32" fill="#0a0a0a"/><rect x="416" y="192" width="64" height="32" fill="#d97757"/><rect x="480" y="192" width="64" height="32" fill="#0a0a0a"/><rect x="544" y="192" width="128" height="32" fill="#d97757"/>
        <rect x="0" y="224" width="96" height="32" fill="#d97757"/><rect x="96" y="224" width="64" height="32" fill="#0a0a0a"/><rect x="160" y="224" width="64" height="32" fill="#d97757"/><rect x="224" y="224" width="64" height="32" fill="#0a0a0a"/><rect x="288" y="224" width="64" height="32" fill="#d97757"/><rect x="352" y="224" width="64" height="32" fill="#0a0a0a"/><rect x="416" y="224" width="64" height="32" fill="#d97757"/><rect x="480" y="224" width="64" height="32" fill="#0a0a0a"/><rect x="544" y="224" width="128" height="32" fill="#d97757"/>
        <rect x="0" y="256" width="96" height="32" fill="#d97757"/><rect x="96" y="256" width="64" height="32" fill="#0a0a0a"/><rect x="160" y="256" width="64" height="32" fill="#d97757"/><rect x="224" y="256" width="64" height="32" fill="#0a0a0a"/><rect x="288" y="256" width="64" height="32" fill="#d97757"/><rect x="352" y="256" width="64" height="32" fill="#0a0a0a"/><rect x="416" y="256" width="64" height="32" fill="#d97757"/><rect x="480" y="256" width="64" height="32" fill="#0a0a0a"/><rect x="544" y="256" width="128" height="32" fill="#d97757"/>
        <rect x="0" y="288" width="96" height="32" fill="#d97757"/><rect x="96" y="288" width="96" height="32" fill="#0a0a0a"/><rect x="192" y="288" width="32" height="32" fill="#d97757"/><rect x="224" y="288" width="96" height="32" fill="#0a0a0a"/><rect x="320" y="288" width="32" height="32" fill="#d97757"/><rect x="352" y="288" width="96" height="32" fill="#0a0a0a"/><rect x="448" y="288" width="32" height="32" fill="#d97757"/><rect x="480" y="288" width="96" height="32" fill="#0a0a0a"/><rect x="576" y="288" width="96" height="32" fill="#d97757"/>
        <rect x="0" y="320" width="640" height="32" fill="#d97757"/>
        <rect x="32" y="352" width="608" height="32" fill="#d97757"/>
        <rect x="32" y="384" width="576" height="32" fill="#d97757"/>
        <rect x="64" y="416" width="128" height="32" fill="#d97757"/><rect x="448" y="416" width="128" height="32" fill="#d97757"/>
        <rect x="64" y="448" width="128" height="32" fill="#d97757"/><rect x="448" y="448" width="128" height="32" fill="#d97757"/>
      </svg>
      <span style={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: 19 }}>Layrix</span>
    </span>
  );
}

function Header({ current, langHref = '/fr/', langActive = 'EN', langOther = 'FR' }) {
  const links = [
    { href: 'LLLL.html', label: 'Engine', key: 'engine' },
    { href: 'Experts.html', label: 'Experts', key: 'experts' },
    { href: 'AIGP.html', label: 'AIGP Prep', key: 'aigp' },
    { href: 'https://github.com/JettyRepo/LLLL', label: 'Docs', key: 'docs' },
  ];
  return (
    <header style={{ padding: '22px clamp(20px, 5vw, 56px)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', borderBottom: `1px solid ${_ink}`, position: 'sticky', top: 0, background: 'rgba(241,239,231,0.86)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 50 }}>
      <a className="marq-link" href="Layrix Homepage.html"><Logo /></a>
      <nav style={{ display: 'flex', gap: 28, fontSize: 14 }}>
        {links.map(l => (
          <a key={l.key} className="marq-link" href={l.href} style={current === l.key ? { color: _accent, fontWeight: 600 } : null}>{l.label}</a>
        ))}
      </nav>
      <div style={{ justifySelf: 'end', display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: _muted, letterSpacing: '0.14em' }}>{langActive} · <a className="marq-link" href={langHref} style={{ opacity: 0.6 }}>{langOther}</a></span>
        <a className="marq-cta marq-link" href="https://layrix.ai/register" style={{ padding: '10px 18px', background: _ink, color: _paper, fontSize: 13, fontWeight: 500, borderRadius: 999 }}>Get started →</a>
      </div>
    </header>
  );
}

function SectionRow({ idx, kicker, title, lead, children, maxLead = 760, tone }) {
  return (
    <section style={{ padding: '120px clamp(20px, 5vw, 56px) 0', maxWidth: 1400, margin: '0 auto' }}>
      <div className="marq-section-row" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 40, alignItems: 'start' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 140, lineHeight: 0.85, fontWeight: 400, color: tone || _accent, fontStyle: 'italic' }}>{idx}</div>
        <div>
          {kicker && <div className="marq-kicker">{kicker}</div>}
          <h2 className="marq-h2" style={{ fontFamily: 'var(--display)', fontWeight: 500, fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.96, marginTop: 14, maxWidth: 1100 }}>{title}</h2>
          {lead && <p style={{ fontSize: 17, lineHeight: 1.6, color: _muted, maxWidth: maxLead, marginTop: 28 }}>{lead}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function PageHero({ tag, title, lead, ctas, microcopy, kicker }) {
  return (
    <section style={{ padding: '96px clamp(20px, 5vw, 56px) 0', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ maxWidth: 1100 }}>
        {tag && <div className="marq-tag"><span className="marq-dot" style={{ width: 6, height: 6, borderRadius: 3, background: _accent, display: 'inline-block' }} />{tag}</div>}
        {kicker && <div className="marq-kicker" style={{ marginBottom: 16 }}>{kicker}</div>}
        <h1 className="marq-h1" style={{ fontFamily: 'var(--display)', fontWeight: 500, fontSize: 'clamp(52px, 7.2vw, 108px)', lineHeight: 1.02, letterSpacing: '-0.045em', margin: '32px 0 0' }}>
          {title}
        </h1>
        {lead && <p style={{ fontSize: 19, lineHeight: 1.55, color: _muted, maxWidth: 720, marginTop: 44 }}>{lead}</p>}
        {ctas && (
          <div style={{ display: 'flex', gap: 12, marginTop: 44, flexWrap: 'wrap' }}>
            {ctas.map((c, i) => (
              <a key={i} className="marq-cta marq-link" href={c.href} style={{ padding: '16px 28px', background: c.primary ? _ink : 'transparent', color: c.primary ? _paper : _ink, border: c.primary ? `1px solid ${_ink}` : `1px solid ${_ink}`, fontSize: 14, fontWeight: 500, borderRadius: 999 }}>{c.label}</a>
            ))}
          </div>
        )}
        {microcopy && <p style={{ fontSize: 13, color: _muted, marginTop: 18, maxWidth: 720 }}>{microcopy}</p>}
      </div>
    </section>
  );
}

function Footer({ extra }) {
  return (
    <footer style={{ padding: '96px clamp(20px, 5vw, 56px) 56px', borderTop: `1px solid ${_ink}`, marginTop: 120 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, fontSize: 13.5, color: _muted }}>
        <div>
          <Logo />
          <div style={{ marginTop: 14 }}>1045 Howe St, Vancouver, BC V6Z 2A9, Canada</div>
          <div style={{ marginTop: 6 }}><a className="marq-link" href="mailto:info@layrix.ai">info@layrix.ai</a></div>
        </div>
        <div><div style={{ color: _ink, fontWeight: 600 }}>Products</div><div style={{ marginTop: 10 }}><a className="marq-link" href="LLLL.html">LLLL Engine</a></div><div><a className="marq-link" href="Experts.html">Expert Review</a></div><div><a className="marq-link" href="AIGP.html">AIGP Prep</a></div></div>
        <div><div style={{ color: _ink, fontWeight: 600 }}>Legal</div><div style={{ marginTop: 10 }}><a className="marq-link" href="Terms.html">Terms</a></div><div><a className="marq-link" href="Privacy.html">Privacy</a></div><div><a className="marq-link" href="Acceptable Use.html">Acceptable Use</a></div></div>
        <div><div style={{ color: _ink, fontWeight: 600 }}>Source</div><div style={{ marginTop: 10 }}><a className="marq-link" href="https://github.com/JettyRepo/LLLL" rel="noopener noreferrer">github.com/JettyRepo/LLLL</a></div><div>npm: llll</div></div>
      </div>
      {extra}
      <div style={{ marginTop: 32, paddingTop: 18, borderTop: `1px solid ${_rule}`, fontSize: 12, color: _muted, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span>© 2026 Caerus Enterprises Inc. All rights reserved.</span><span>Made in Vancouver / Remote</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Logo, Header, Footer, SectionRow, PageHero });
