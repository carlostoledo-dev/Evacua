import { describe, expect, it } from 'vitest';
import { globalHeaders, parseCsp } from '../config/headers.ts';

const headers = globalHeaders();
const csp = parseCsp(headers['Content-Security-Policy'] ?? '');

describe('Content-Security-Policy', () => {
  it('only allows same-origin scripts, without inline or eval', () => {
    expect(csp.get('script-src')).toEqual(["'self'"]);
  });

  it('never allows unsafe-inline or unsafe-eval in any directive', () => {
    for (const [directive, sources] of csp) {
      expect(sources, directive).not.toContain("'unsafe-inline'");
      expect(sources, directive).not.toContain("'unsafe-eval'");
    }
  });

  it('only connects to its own origin (no external APIs at runtime)', () => {
    expect(csp.get('connect-src')).toEqual(["'self'"]);
  });

  it('locks down fallbacks, plugins, base URL, forms and framing', () => {
    expect(csp.get('default-src')).toEqual(["'self'"]);
    expect(csp.get('object-src')).toEqual(["'none'"]);
    expect(csp.get('base-uri')).toEqual(["'none'"]);
    expect(csp.get('form-action')).toEqual(["'none'"]);
    expect(csp.get('frame-ancestors')).toEqual(["'none'"]);
  });

  it('does not allow any third-party host in any directive', () => {
    for (const [directive, sources] of csp) {
      for (const source of sources) {
        expect(source, directive).toMatch(/^('self'|'none'|data:|blob:)$/);
      }
    }
  });
});

describe('other security headers', () => {
  it.each([
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', 'no-referrer'],
    ['Cross-Origin-Opener-Policy', 'same-origin'],
  ])('%s is %s', (name, value) => {
    expect(headers[name]).toBe(value);
  });

  it('only grants geolocation, to this origin', () => {
    const policy = headers['Permissions-Policy'] ?? '';
    expect(policy).toContain('geolocation=(self)');
    expect(policy).toContain('camera=()');
    expect(policy).toContain('microphone=()');
  });

  it('enables HSTS for at least one year', () => {
    const maxAge = /max-age=(\d+)/.exec(headers['Strict-Transport-Security'] ?? '')?.[1];
    expect(Number(maxAge)).toBeGreaterThanOrEqual(31_536_000);
  });
});
