import {readdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(dir){const items=await readdir(dir,{withFileTypes:true});return (await Promise.all(items.map(i=>i.isDirectory()?files(`${dir}/${i.name}`):`${dir}/${i.name}`))).flat();}
const paths=(await files('dist')).filter(p=>!p.endsWith('/sw.js'));
const hash=createHash('sha256');for(const p of paths)hash.update(await readFile(p));
const cache=`snowrun-${hash.digest('hex').slice(0,12)}`;
const resources=paths.map(p=>`./${p.slice(5)}`);
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)};const ASSETS=${JSON.stringify(resources)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('snowrun-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;event.respondWith(caches.match(event.request,{ignoreVary:true}).then(hit=>hit||fetch(event.request).catch(()=>event.request.mode==='navigate'?caches.match(new URL('./index.html',self.registration.scope)):Response.error())));});
`);
