import { resortVisuals } from './core-board-visuals.js';

type PillKind = 'resource' | 'cost' | 'production';

const resortCodes = Object.keys(resortVisuals).join('|');
const notation = new RegExp(
  `(?<![\\w-])(?:(\\d+) )?(${resortCodes})(?: (W\\d+))?(?![\\w-])|\\b(W\\d+)\\b`,
  'g',
);

export function decorateGuidePills(document: Document) {
  const main = document.querySelector('main');
  if (!main) return;

  let nextTooltip = 0;
  function makePill(label: string, kind: PillKind, explanation: string, resort?: string) {
    const pill = document.createElement('span');
    pill.className = 'guide-pill';
    pill.dataset.kind = kind;
    pill.tabIndex = 0;

    if (kind !== 'resource') {
      const mark = document.createElement('span');
      mark.className = 'guide-pill-mark';
      mark.setAttribute('aria-hidden', 'true');
      if (kind === 'cost') mark.textContent = '−';
      pill.append(mark);
    }
    const visual = resort && resortVisuals[resort];
    if (visual) {
      pill.style.setProperty('--pill-color', visual.color);
      const icon = document.createElement('img');
      icon.src = visual.icon;
      icon.alt = '';
      pill.append(icon);
    }
    pill.append(label);

    const tooltip = document.createElement('span');
    tooltip.id = `guide-tooltip-${++nextTooltip}`;
    tooltip.className = 'guide-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = explanation;
    pill.setAttribute('aria-describedby', tooltip.id);
    pill.append(tooltip);
    return pill;
  }

  main.querySelectorAll<HTMLElement>('[data-guide-cost], [data-guide-production]').forEach(element => {
    const label = element.textContent.trim();
    const kind = element.hasAttribute('data-guide-cost') ? 'cost' : 'production';
    const explanation = element.dataset.guideCost ?? element.dataset.guideProduction;
    if (!explanation) return;
    const resorts = new Set([...label.matchAll(notation)].map(match => match[2]).filter(Boolean));
    const resort = resorts.size === 1 ? resorts.values().next().value : undefined;
    element.replaceWith(makePill(label, kind, explanation, resort));
  });

  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
    acceptNode: node => node.parentElement?.closest('.guide-pill, a, button, code, pre, script, style')
      ? NodeFilter.FILTER_REJECT
      : NodeFilter.FILTER_ACCEPT,
  });
  const prose = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) prose.push(node);

  for (const node of prose) {
    const text = node.textContent ?? '';
    const matches = [...text.matchAll(notation)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let end = 0;
    for (const match of matches) {
      const [label, amount, resort, typedValue, plainValue] = match;
      const index = match.index;
      const value = typedValue ?? plainValue;
      const name = resortVisuals[resort]?.name;
      const quantity = value?.slice(1) ?? amount;
      const units = quantity === '1' ? 'unit' : 'units';
      const output = name ? `${quantity} ${units} of ${name}` : `${quantity} ${quantity === '1' ? 'Resource' : 'Resources'}`;
      const explanation = value
        ? `Printed production of ${output} at round settlement, before modifiers and distribution.`
        : amount ? `${output}.` : `${name} Resource.`;
      fragment.append(text.slice(end, index), makePill(label, value ? 'production' : 'resource', explanation, resort));
      end = index + label.length;
    }
    fragment.append(text.slice(end));
    node.parentNode?.replaceChild(fragment, node);
  }
}
