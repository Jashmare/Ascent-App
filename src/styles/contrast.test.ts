import tokensCss from './tokens.css?raw';

// Checks every text and background pair in every altitude and both themes against
// WCAG AA (docs/DESIGN.md §2 and §8), reading the real values from tokens.css.

function block(selector: string): Record<string, string> {
  const start = tokensCss.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Missing block ${selector}`);
  const body = tokensCss.slice(start, tokensCss.indexOf('}', start));
  const values: Record<string, string> = {};
  for (const match of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
    values[match[1]] = match[2];
  }
  return values;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mirrors color-mix(in srgb, a weight%, b). */
function mix(a: string, b: string, weight: number): [number, number, number] {
  const [x, y] = [rgb(a), rgb(b)];
  return x.map((v, i) => Math.round(v * weight + y[i] * (1 - weight))) as [number, number, number];
}

const light = block(':root');
const dark = { ...light, ...block(":root[data-theme='dark']") };

const themes = { light, dark };

describe('colour contrast (WCAG AA)', () => {
  for (const [themeName, t] of Object.entries(themes)) {
    for (const altitude of ['camp', 'ridge', 'summit']) {
      it(`${themeName} ${altitude}: text pairs reach 4.5:1`, () => {
        const bg = t[`${altitude}-bg`];
        const surface = t['base-surface'];
        const pairs: [string, string, string, string][] = [
          ['ink', t['base-ink'], 'bg', bg],
          ['ink', t['base-ink'], 'surface', surface],
          ['ink-soft', t['base-ink-soft'], 'bg', bg],
          ['ink-soft', t['base-ink-soft'], 'surface', surface],
          ['accent-strong', t[`${altitude}-accent-strong`], 'bg', bg],
          ['accent-strong', t[`${altitude}-accent-strong`], 'surface', surface],
          ['danger', t['base-danger'], 'bg', bg],
          ['danger', t['base-danger'], 'surface', surface],
          ['on-accent', t['on-accent'], 'accent', t[`${altitude}-accent`]],
        ];
        for (const [fgName, fg, bgName, bgValue] of pairs) {
          const ratio = contrast(rgb(fg), rgb(bgValue));
          expect(ratio, `${fgName} on ${bgName} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
            4.5,
          );
        }
      });
    }

    it(`${themeName} sky: text pairs reach 4.5:1`, () => {
      for (const bgName of ['sky-top', 'sky-bottom', 'sky-surface']) {
        for (const fgName of ['sky-ink', 'sky-ink-soft', 'gold', 'sky-danger']) {
          const ratio = contrast(rgb(t[fgName]), rgb(t[bgName]));
          expect(ratio, `${fgName} on ${bgName} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
            4.5,
          );
        }
      }
      expect(contrast(rgb(t['on-accent']), rgb(t.gold))).toBeGreaterThanOrEqual(4.5);
    });

    it(`${themeName}: field borders reach 3:1 against their surface`, () => {
      const pairs: [string, string][] = [
        [t['base-ink-soft'], t['base-surface']],
        [t['sky-ink-soft'], t['sky-surface']],
      ];
      for (const [inkSoft, surface] of pairs) {
        expect(contrast(mix(inkSoft, surface, 0.7), rgb(surface))).toBeGreaterThanOrEqual(3);
      }
    });
  }
});
