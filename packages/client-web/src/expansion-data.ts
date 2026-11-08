import type { ExpansionId } from '@bc/rules';
import economyRules from '../../../docs/rules/001-expansion01.md?raw';
import securityRules from '../../../docs/rules/002-expansion02.md?raw';
import climateRules from '../../../docs/rules/003-expansion03.md?raw';

export const expansions = [
  { id: 'exp01', label: 'Economy & Labor', resource: 'ECO', rules: economyRules },
  { id: 'exp02', label: 'Security & Order', resource: 'SEC', rules: securityRules },
  { id: 'exp03', label: 'Climate & Future', resource: 'CLM', rules: climateRules },
] as const satisfies ReadonlyArray<{ id: ExpansionId; label: string; resource: string; rules: string }>;

interface MeasureText {
  title: string;
  cost?: string;
  clauses: string[];
}

// Use the named card sections of the normative files as display copy.
const measures = new Map<string, MeasureText>();
for (const { resource, rules } of expansions) {
  for (const section of rules.split(/^#{1,2} /m)) {
    const [heading, ...body] = section.split(/\r?\n/);
    const card = /^(EXP-\d\d-08-(M\d\d)) — (.+)$/.exec(heading);
    if (!card) continue;
    const [, ruleId, number, title] = card;
    const clauses = body.filter(line => line !== '---').join('\n')
      .split(new RegExp(`^${ruleId}-\\d{2}[A-Z]? `, 'm')).slice(1).map(clause => clause.trim());
    const cost = clauses.find(clause => clause.startsWith('Cost: '))?.slice(6).replace(/\.$/, '');
    measures.set(`${resource}_${number}`, {
      title, cost, clauses: clauses.filter(clause => !/^(Name|Cost): /.test(clause)),
    });
  }
}

export const measureText = (id: string) => measures.get(id);
export const measureName = (id: string) => measureText(id)?.title ?? id;
