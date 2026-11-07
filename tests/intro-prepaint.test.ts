import { describe, expect, test } from 'bun:test';
import { runInNewContext } from 'node:vm';
import { INTRO_PRE_PAINT, INTRO_SEEN_KEY, INTRO_SKIP_STYLE_ID } from '../src/components/intro/config';

function prepaint(search: string, seen: boolean, reduced = false) {
  const styles: { id: string; textContent: string }[] = [];
  runInNewContext(INTRO_PRE_PAINT, {
    location: { search },
    URLSearchParams,
    sessionStorage: { getItem: (key: string) => key === INTRO_SEEN_KEY && seen ? 'seen' : null },
    matchMedia: () => ({ matches: reduced }),
    document: { createElement: () => ({ id: '', textContent: '' }), head: { appendChild: (style: { id: string; textContent: string }) => styles.push(style) } },
  });
  return styles;
}

describe('intro pre-paint behavior', () => {
  test('hides the intro for returning visitors or explicit skip', () => {
    expect(prepaint('', true)[0]?.id).toBe(INTRO_SKIP_STYLE_ID);
    expect(prepaint('?intro=0', false)).toHaveLength(1);
    expect(prepaint('', false, true)).toHaveLength(1);
  });
  test('shows the intro for new visitors and explicit replay', () => {
    expect(prepaint('', false)).toHaveLength(0);
    expect(prepaint('?intro=1', true)).toHaveLength(0);
    expect(prepaint('?other=intro=0', false)).toHaveLength(0);
  });
});
