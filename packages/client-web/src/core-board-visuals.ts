import domIcon from '@bc/exp-00-core/assets/tile-icons/dom.svg';
import foreignIcon from '@bc/exp-00-core/assets/tile-icons/for.svg';
import infIcon from '@bc/exp-00-core/assets/tile-icons/inf.svg';
import ecoIcon from '@bc/exp-01-economy/assets/tile-icons/eco.svg';
import secIcon from '@bc/exp-02-security/assets/tile-icons/sec.svg';
import clmIcon from '@bc/exp-03-climate/assets/tile-icons/clm.svg';

const playerColors = [
  { fill: '#E11D48', text: '#fff' },
  { fill: '#22C55E', text: '#000' },
  { fill: '#2B42D6', text: '#fff' },
  { fill: '#FACC15', text: '#000' },
  { fill: '#D946EF', text: '#000' },
  { fill: '#22D3EE', text: '#000' },
];
export const playerPalette = (id: string) => playerColors[Number(id)];
export const playerColor = (id: string) => playerPalette(id)?.fill;

export const resortVisuals: Record<string, { color: string; icon: string; name: string } | undefined> = {
  DOM: { color: '#3A5A78', icon: domIcon, name: 'Domestic Affairs' },
  FOR: { color: '#2E7D6E', icon: foreignIcon, name: 'Foreign Affairs' },
  INF: { color: '#6A4C93', icon: infIcon, name: 'Information Control' },
  ECO: { color: '#8A6E2F', icon: ecoIcon, name: 'Economy' },
  SEC: { color: '#4E5B63', icon: secIcon, name: 'Security' },
  CLM: { color: '#3F7F4C', icon: clmIcon, name: 'Climate' },
};
