// 페이지 공유 썸네일 만들기: node _tools/og-page.cjs <파일이름> <윗줄> <제목> <설명(줄바꿈은 \n)> <주소 뒷부분> [mark] [제목크기]
// 예: node _tools/og-page.cjs reading "코너 · 책에서 찾은 수업 거리" "윤리로 읽는 책" "설명 첫 줄\n둘째 줄" /reading mark
// 결과: assets/og/<파일이름>.jpg (1200×630). playwright 필요 (NODE_PATH=$(npm root -g)).
const { chromium } = require('playwright');
const path = require('path');
const [,, name, kicker, title, sub, urlpath, mark, size] = process.argv;
if (!name || !title) { console.error('usage: node _tools/og-page.cjs <name> <kicker> <title> <sub> <path> [mark] [size]'); process.exit(1); }
const css = `
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#f5f6f3;font-family:"IBM Plex Sans KR",sans-serif;color:#1c2421;position:relative;overflow:hidden}
.bar{position:absolute;left:0;top:0;bottom:0;width:18px;background:#23614f}
.wrap{position:absolute;left:84px;right:84px;top:72px;bottom:72px;display:flex;flex-direction:column;justify-content:space-between}
.kicker{font-size:24px;color:#23614f;letter-spacing:.06em}
.title{font-family:"Gowun Batang",serif;font-weight:700;line-height:1.25;word-break:keep-all;font-size:${size||84}px;margin-top:18px}
.sub{font-size:32px;color:#5b6662;margin-top:26px;line-height:1.6;word-break:keep-all}
.mark{display:inline;background:linear-gradient(transparent 58%,#f2df74 58%,#f2df74 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.foot{display:flex;justify-content:space-between;align-items:baseline;font-size:26px;color:#5b6662}
.foot b{font-family:"Gowun Batang",serif;color:#1c2421;font-weight:700;font-size:30px}
.foot .url{font-family:"IBM Plex Mono",monospace;color:#23614f}`;
const esc = s => String(s||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const tt = esc(title).replace(/\\n/g,"<br>"); const t = mark ? `<span class="mark">${tt}</span>` : tt;
const subHtml = sub ? `<p class="sub">${esc(sub).replace(/\\n/g,'<br>')}</p>` : '';
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="bar"></div><div class="wrap"><div><p class="kicker">${esc(kicker)}</p><h1 class="title">${t}</h1>${subHtml}</div><div class="foot"><b>Ethink</b><span class="url">ethink.kr${esc(urlpath||'')}</span></div></div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.setContent(html); await p.waitForTimeout(2500);
  const out = path.join(__dirname, '..', 'assets', 'og', name + '.jpg');
  await p.screenshot({ path: out, type: 'jpeg', quality: 88 }); await b.close(); console.log(out);
})();
