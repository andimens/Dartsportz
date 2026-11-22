import pathlib,json
src=pathlib.Path('src');out=pathlib.Path('dist');out.mkdir(exist_ok=True)
css=(src/'style.css').read_text()
js='\n'.join((src/f).read_text() for f in ['core.js','bots.js','x01.js','ui.js','game.js','party.js','views.js'])
html=f'''<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Dartsportz</title>
<meta name="theme-color" content="#0f0f10"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Dartsportz">
<link rel="manifest" href="manifest.json"><link rel="apple-touch-icon" href="icon-192.png"><link rel="icon" href="icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>{css}</style></head><body><div id="app"></div>
<script>{js}</script></body></html>'''
(out/'index.html').write_text(html)
(out/'manifest.json').write_text(json.dumps({"name":"Dartsportz","short_name":"Dartsportz","start_url":"./","display":"standalone","background_color":"#0f0f10","theme_color":"#0f0f10","orientation":"portrait","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},indent=1))
(out/'sw.js').write_text('''const C='dartsportz-v2';const A=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();if(r.ok&&(e.request.url.startsWith(self.location.origin)||e.request.url.includes('fonts.g')))caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))))});''')
from PIL import Image,ImageDraw
for s in (192,512):
  im=Image.new('RGB',(s,s),'#0f0f10');d=ImageDraw.Draw(im);k=s/24
  d.rounded_rectangle([0,0,s-1,s-1],radius=int(s*.18),fill='#151517')
  cx,cy=s/2,s/2
  for r,c in [(.40,'#ff6b00'),(.31,'#0f0f10'),(.22,'#ff6b00'),(.13,'#0f0f10'),(.05,'#ff6b00')]:
    d.ellipse([cx-r*s,cy-r*s,cx+r*s,cy+r*s],fill=c)
  im.save(out/f'icon-{s}.png')
print(len(html))
