/* Marquee-styled legal layout helpers. Render: <LegalPage title="..." date="..." sections={[{h,body}, ...]}/> */
function LegalPage({ title, date, intro, sections, current = 'home' }) {
  const ink='var(--ink)', paper='var(--paper)', muted='var(--muted)', rule='var(--rule)', accent='var(--accent)';
  return (
    <>
      <Header current={current} />
      <section style={{ padding: '88px clamp(20px, 5vw, 56px) 0', maxWidth: 880, margin: '0 auto' }}>
        <div className="marq-kicker">Layrix · Legal</div>
        <h1 style={{ fontFamily:'var(--display)', fontWeight:500, fontSize:'clamp(44px, 6vw, 80px)', lineHeight:0.95, letterSpacing:'-0.04em', marginTop: 16 }}>
          {title}
        </h1>
        <p style={{ fontFamily:'var(--mono)', fontSize: 12, color: muted, letterSpacing:'0.16em', textTransform:'uppercase', marginTop: 20 }}>Effective Date · {date}</p>
        {intro && <div className="marq-prose" style={{ marginTop: 40 }}>{intro}</div>}
        <div style={{ marginTop: 48, display:'grid', gap: 36 }}>
          {sections.map((s, i) => (
            <section key={i}>
              <div style={{ display:'grid', gridTemplateColumns:'56px 1fr', gap: 20, alignItems:'baseline', paddingBottom: 14, borderBottom: `1px solid ${ink}` }}>
                <div style={{ fontFamily:'var(--mono)', fontSize: 12, color: accent, letterSpacing:'0.16em' }}>§ {String(i+1).padStart(2,'0')}</div>
                <h2 style={{ fontFamily:'var(--display)', fontSize: 28, fontWeight: 500, letterSpacing:'-0.025em', lineHeight: 1.15 }}>{s.h}</h2>
              </div>
              <div className="marq-prose" style={{ marginTop: 18, paddingLeft: 76 }}>{s.body}</div>
            </section>
          ))}
        </div>
        <div style={{ marginTop: 72, padding: '32px 0', borderTop: `1px solid ${rule}`, fontSize: 13, color: muted }}>
          Caerus Enterprises Inc. · <a className="marq-link" href="mailto:info@layrix.ai" style={{ color: ink, fontWeight: 500 }}>info@layrix.ai</a>
        </div>
      </section>
      <Footer />
    </>
  );
}
window.LegalPage = LegalPage;
