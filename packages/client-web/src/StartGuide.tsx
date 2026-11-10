import { useState } from 'react';
import pageStyles from './guide-page.css?raw';
import { decorateGuidePills } from './guide-pills.js';

const htmlFiles = import.meta.glob<string>('../../exp-*/assets/guide/en/*.html', {
  eager: true, import: 'default', query: '?raw',
});

interface GuidePage {
  path: string;
  title: string;
  html: string;
}

function readGuide() {
  const paths = Object.keys(htmlFiles).sort();
  const parser = new DOMParser();
  return paths.filter(path => path.endsWith('/index.html')).map(index => {
    const directory = index.slice(0, -'index.html'.length);
    const chapterPaths = [index, ...paths.filter(path => path !== index && path.startsWith(directory))];
    const overview = parser.parseFromString(htmlFiles[index], 'text/html');
    const chapters = chapterPaths.map((path): GuidePage => {
      const document = path === index ? overview : parser.parseFromString(htmlFiles[path], 'text/html');
      const title = document.querySelector('h1')?.textContent?.trim() || document.title;
      const style = document.createElement('style');
      style.textContent = pageStyles;
      document.head.prepend(style);
      decorateGuidePills(document);
      return {
        path,
        title,
        html: `<!doctype html>\n${document.documentElement.outerHTML}`,
      };
    });
    return { index, title: overview.title, chapters };
  });
}

export default function StartGuide() {
  const [modules] = useState(readGuide);
  const [selected, setSelected] = useState<GuidePage>();
  const page = selected ?? modules[0]?.chapters[0];
  if (!page) return null;

  return (
    <aside className="core-panel start-guide" aria-labelledby="start-guide-heading">
      <h2 id="start-guide-heading">How to play</h2>
      <div className="start-guide-layout">
        <nav className="start-guide-tree" aria-label="Guide contents">
          {modules.map(({ index, title, chapters }, moduleIndex) => (
            <details key={index} open={moduleIndex === 0}>
              <summary>{title}</summary>
              <ul>
                {chapters.map(chapter => (
                  <li key={chapter.path}>
                    <button type="button" aria-current={page.path === chapter.path ? 'page' : undefined}
                      onClick={() => setSelected(chapter)}>{chapter.title}</button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>
        <iframe className="start-guide-page" title={page.title} srcDoc={page.html} sandbox="" />
      </div>
    </aside>
  );
}
