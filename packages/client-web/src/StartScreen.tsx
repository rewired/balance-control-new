import type { ReactNode } from 'react';
import StartGuide from './StartGuide.js';
import './start-screen.css';

export default function StartScreen({ children }: { children: ReactNode }) {
  return (
    <div className="start-screen">
      <div className="start-screen-setup">{children}</div>
      <StartGuide />
    </div>
  );
}
