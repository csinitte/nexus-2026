'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { mockCertificatesFor, type MockCertificate } from './mock';

type Phase = 'idle' | 'checking' | 'found';
type Dl = 'idle' | 'working' | 'done';

const KIND_MARK: Record<string, string> = {
  Participation: 'P',
  'Branch Showcase': 'S',
  'Expo Winner': 'W',
  'Special Award': 'A',
};

/**
 * Certificate lookup flow. The certificate artwork itself comes from the
 * NEXUS design team — this page only finds, previews and downloads it.
 */
export function CertificateLookup() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [certs, setCerts] = useState<MockCertificate[]>([]);
  const [selected, setSelected] = useState(0);
  const [dl, setDl] = useState<Record<string, Dl>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^NEXUS26-\d{4}$/i.test(code.trim())) return setError('Registration IDs look like NEXUS26-1234.');
    setError('');
    setPhase('checking');
    timer.current = setTimeout(() => {
      setCerts(mockCertificatesFor(code));
      setSelected(0);
      setPhase('found');
    }, 1400);
  }

  function download(id: string) {
    if (dl[id] === 'working') return;
    setDl((d) => ({ ...d, [id]: 'working' }));
    setTimeout(() => setDl((d) => ({ ...d, [id]: 'done' })), 1600);
  }

  const cert = phase === 'found' ? certs[selected] : undefined;
  const allId = '__all__';

  return (
    <div className="p2-certs" data-reveal>
      <div className="p2-cert-side">
        <form className={`p2-cert-form${phase === 'checking' ? ' is-checking' : ''}`} onSubmit={submit}>
          <p className="p2-label">
            <span className="p2-stepdot is-on">01</span> Find your registration
          </p>
          <div className="field wide p2-scanfield">
            <label htmlFor="cert-code">Registration ID</label>
            <input
              id="cert-code"
              placeholder="NEXUS26-1234"
              autoCapitalize="characters"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <i className="p2-scanline" aria-hidden="true" />
          </div>
          <div className="field wide">
            <label htmlFor="cert-email">Email used to register</label>
            <input id="cert-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={phase === 'checking'}>
            {phase === 'checking' ? 'Verifying…' : 'Find certificates'} <span aria-hidden="true">↗</span>
          </button>
          <p className="p2-verify" aria-live="polite">
            {phase === 'checking' && (
              <>
                <span className="p2-spinner" aria-hidden="true" /> Checking {code.trim().toUpperCase()} against registrations
              </>
            )}
            {phase === 'found' && (
              <>
                <svg viewBox="0 0 24 24" className="p2-tick" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                Registration verified · {certs.length} certificates issued
              </>
            )}
          </p>
        </form>

        {phase === 'found' && (
          <div className="p2-cert-pick">
            <p className="p2-label">
              <span className="p2-stepdot is-on">02</span> Your certificates
            </p>
            <ul role="radiogroup" aria-label="Certificates">
              {certs.map((c, i) => (
                <li key={c.id} style={{ animationDelay: `${i * 90}ms` }}>
                  <button type="button" role="radio" aria-checked={selected === i} onClick={() => setSelected(i)}>
                    <span className="p2-kind" aria-hidden="true">
                      {KIND_MARK[c.kind] ?? '•'}
                    </span>
                    <span>
                      <strong>{c.kind}</strong>
                      <small>
                        {c.name} · {dl[c.id] === 'done' ? 'Downloaded' : 'Ready'}
                      </small>
                    </span>
                    <span className="p2-pick-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className={`p2-dl p2-dl-all is-${dl[allId] ?? 'idle'}`} onClick={() => download(allId)}>
              <span className="p2-dl-fill" aria-hidden="true" />
              <span className="p2-dl-text">
                {dl[allId] === 'done' ? '✓ ZIP ready' : dl[allId] === 'working' ? 'Preparing ZIP…' : `Download all ${certs.length} (ZIP)`}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="p2-cert-stage">
        <div className={`p2-doc is-${phase}`} key={cert?.id ?? phase}>
          <span className="p2-crop p2-crop-tl" aria-hidden="true" />
          <span className="p2-crop p2-crop-tr" aria-hidden="true" />
          <span className="p2-crop p2-crop-bl" aria-hidden="true" />
          <span className="p2-crop p2-crop-br" aria-hidden="true" />
          {phase === 'idle' && (
            <div className="p2-doc-empty">
              <span className="p2-doc-icon" aria-hidden="true">
                <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M19 2.5 L33.5 10.8 L33.5 27.2 L19 35.5 L4.5 27.2 L4.5 10.8 Z" />
                  <path d="M13 19.5l4 4 8-9" />
                </svg>
              </span>
              <p>Your certificates will appear here</p>
              <small>Enter your registration ID to look them up.</small>
            </div>
          )}
          {phase === 'checking' && (
            <div className="p2-doc-skeleton" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
          {cert && (
            <div className="p2-doc-file" role="img" aria-label={`${cert.kind} certificate for ${cert.name}, provided by the NEXUS design team`}>
              <div className="p2-doc-skeleton is-still" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="p2-doc-caption">
                <span className="p2-meta">Preview · design by the NEXUS team</span>
                <strong>{cert.kind}</strong>
                <small className="mono">{cert.id}.pdf · A4 landscape</small>
              </div>
            </div>
          )}
        </div>

        {cert && (
          <div className="p2-cert-actions">
            <a
              className="text-link"
              href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(`NEXUS 2026 — ${cert.kind}`)}&organizationName=${encodeURIComponent('CSI Student Branch, NMAMIT')}`}
              target="_blank"
              rel="noreferrer"
            >
              Add to LinkedIn <span aria-hidden="true">↗</span>
            </a>
            <button type="button" className={`p2-dl is-${dl[cert.id] ?? 'idle'}`} onClick={() => download(cert.id)}>
              <span className="p2-dl-fill" aria-hidden="true" />
              <span className="p2-dl-text">
                {dl[cert.id] === 'done' ? '✓ Saved' : dl[cert.id] === 'working' ? 'Downloading…' : 'Download PDF ↓'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
