// Ported from the original vanilla-JS portal: takes a game's stored code
// (either a legacy raw string or a JSON virtual-file-system object) and
// produces a single runnable HTML document to drop into an iframe.
export function buildRunnableHtml(game) {
  const rawCode = game.code || '';
  const lang = game.language || 'html';
  let vfs = {};
  let isLegacy = false;

  try {
    vfs = JSON.parse(rawCode);
    if (typeof vfs !== 'object' || vfs === null) throw new Error('not vfs');
  } catch (e) {
    isLegacy = true;
    vfs = { 'main.txt': rawCode };
  }

  if (lang === 'python') {
    const pyCode = isLegacy ? rawCode : (vfs['main.py'] || Object.values(vfs)[0] || '');
    return `<!DOCTYPE html><html><head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/brython/3.12.0/brython.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/brython/3.12.0/brython_stdlib.min.js"></script>
      <style>body{margin:0;background:#020617;color:#22d3ee;font-family:monospace;padding:20px;}</style>
      </head><body onload="brython()"><script type="text/python">\n${pyCode}\n</script></body></html>`;
  }

  if (['html', 'javascript', 'typescript', 'webassembly'].includes(lang) || !lang) {
    if (isLegacy) return rawCode;
    let html = vfs['index.html'] || '<h3 style="color:red;font-family:sans-serif;text-align:center;">Lỗi: yêu cầu file index.html</h3>';
    html = html.replace(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi, (m, href) => {
      const clean = href.replace(/^\.\//, '');
      return vfs[clean] ? `<style>\n${vfs[clean]}\n</style>` : m;
    });
    html = html.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi, (m, src) => {
      const clean = src.replace(/^\.\//, '');
      return vfs[clean] ? `<script>\n${vfs[clean]}\n</script>` : m;
    });
    // Always inject the lightweight Quantum SDK (score submission), and
    // additionally the multiplayer bridge for games that opt into online
    // rooms via `window.QuantumMultiplayer` -- no game-side server needed.
    let bridge = sdkScript();
    if (game.multiplayer) bridge += multiplayerBridgeScript(game.id);
    html = html.replace('</head>', `${bridge}</head>`);
    return html;
  }

  // Other languages: show a read-only file listing (compiled languages
  // can't run in-browser without their own toolchain/WASM export).
  const files = Object.entries(vfs)
    .map(([name, content]) => `<div style="color:#22d3ee;margin-top:15px;"><b>${name}</b></div><hr style="border-color:#1e293b;"><pre style="white-space:pre-wrap;word-break:break-all;opacity:.8;font-size:13px;">${escapeHtml(content)}</pre>`)
    .join('');
  return `<!DOCTYPE html><html><body style="margin:0;background:#0f172a;color:#a5b4fc;font-family:monospace;padding:20px;">
    <h3 style="color:#f472b6;">[REPOSITORY] ${lang}</h3>
    <p style="opacity:.8">Ngôn ngữ này cần biên dịch/WASM để chạy trực tiếp trên trình duyệt.</p>
    <div style="background:#020617;padding:15px;border-radius:8px;border:1px solid #1e293b;">${files}</div>
    </body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Injected into multiplayer-enabled games. Talks to the parent window,
// which owns the real Socket.IO connection, via postMessage — this keeps
// the iframe sandboxed while still giving the game a simple join/send/on API.
function multiplayerBridgeScript(gameId) {
  return `<script>
    window.__QP_GAME_ID = ${JSON.stringify(String(gameId))};
    window.QuantumMultiplayer = {
      _listeners: [],
      join(roomCode) { parent.postMessage({ qpMultiplayer: true, type: 'join', gameId: window.__QP_GAME_ID, roomCode }, '*'); },
      send(payload) { parent.postMessage({ qpMultiplayer: true, type: 'state', payload }, '*'); },
      onMessage(cb) { this._listeners.push(cb); }
    };
    window.addEventListener('message', (e) => {
      if (e.data && e.data.qpMultiplayer && e.data.type !== 'score') {
        window.QuantumMultiplayer._listeners.forEach((cb) => cb(e.data));
      }
    });
  </script>`;
}

// A tiny SDK every game gets for free, regardless of multiplayer status:
// window.QuantumSDK.submitScore(n) saves a score against the logged-in
// player without the game needing to know anything about auth or the API.
function sdkScript() {
  return `<script>
    window.QuantumSDK = {
      submitScore(score) { parent.postMessage({ qpMultiplayer: true, type: 'score', score }, '*'); }
    };
  </script>`;
}
