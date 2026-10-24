import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
function offlineGame(): Plugin {
  let base = '/';
  return {
    name: 'babelwake-offline',
    apply: 'build',
    configResolved(config) { base = config.base; },
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter(file => !file.endsWith('.map'));
      const revision = files.join('|').split('').reduce((hash, c) => Math.imul(hash ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
      const urls = [base, `${base}index.html`, `${base}icon.svg`, `${base}icon-192.png`, `${base}icon-512.png`, `${base}manifest.webmanifest`, ...files.map(file => base + file)];
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `const CACHE='babelwake-${revision}';
const FILES=${JSON.stringify([...new Set(urls)])};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('babelwake-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match(${JSON.stringify(base + 'index.html')})));return;}
event.respondWith(caches.match(request,{ignoreVary:true}).then(cached=>cached||fetch(request)));});
` });
    },
  };
}
export default defineConfig({
  plugins: [offlineGame()],
  build: { target: 'es2022', chunkSizeWarningLimit: 700 },
  test: { include: ['tests/**/*.test.ts'], exclude: ['tests/e2e/**'], environment: 'node' },
});
