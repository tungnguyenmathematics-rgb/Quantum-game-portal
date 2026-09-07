import { useEffect, useRef } from 'react';

const EXT_MODE = {
  html: 'html', htm: 'html', css: 'css', js: 'javascript', jsx: 'jsx', ts: 'typescript',
  py: 'python', lua: 'lua', rb: 'ruby', php: 'php', c: 'c_cpp', cpp: 'c_cpp', h: 'c_cpp',
  cs: 'csharp', java: 'java', rs: 'rust', go: 'golang', swift: 'swift', kt: 'kotlin', dart: 'dart',
  scala: 'scala', erl: 'erlang', ex: 'elixir', clj: 'clojure', hs: 'haskell', ml: 'ocaml',
  r: 'r', m: 'matlab', glsl: 'glsl', json: 'json', xml: 'xml',
};

export function modeForFilename(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return 'ace/mode/' + (EXT_MODE[ext] || 'text');
}

// Remount this component (pass a `key` prop, e.g. the current filename) any
// time you need to load fresh content -- simpler and more reliable than
// trying to two-way sync Ace's internal buffer with React state.
export default function CodeEditor({ initialValue, mode, onChange, height = 400 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!window.ace || !containerRef.current) return;
    const editor = window.ace.edit(containerRef.current);
    editor.setTheme('ace/theme/tomorrow_night');
    editor.session.setMode(mode || 'ace/mode/html');
    editor.setValue(initialValue || '', -1);
    editor.setOptions({ fontSize: '13px', showPrintMargin: false, wrap: true });
    editor.on('change', () => onChange && onChange(editor.getValue()));
    return () => editor.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg border border-slate-700 overflow-hidden" />;
}
