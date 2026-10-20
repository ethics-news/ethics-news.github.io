// 호 공유 썸네일 만들기: node _tools/og-issue.cjs 2026-10-23 2 "호 제목" "부제(세 소재를 · 로 이어서)" 3
// 결과: assets/og/<날짜>.jpg (1200×630). playwright 필요 (NODE_PATH=$(npm root -g)).
const { chromium } = require('playwright');
const path = require('path');
const [,, id, num, title, sub, count] = process.argv;
if (!id || !num || !title) { console.error('usage: node _tools/og-issue.cjs <YYYY-MM-DD> <호수> <제목> [부제] [건수]'); process.exit(1); }
const d = id.split('-').map(Number);
const css = `
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#f5f6f3;font-family:"IBM Plex Sans KR",sans-serif;color:#1c2421;position:relative;overflow:hidden}
.bar{position:absolute;left:0;top:0;bottom:0;width:18px;background:#23614f}
.wrap{position:absolute;left:84px;right:84px;top:72px;bottom:72px;display:flex;flex-direction:column;justify-content:space-between}
.kicker{font-family:"IBM Plex Mono",monospace;font-size:24px;color:#23614f;letter-spacing:.02em}
.title{font-family:"Gowun Batang",serif;font-weight:700;line-height:1.3;word-break:keep-all;font-size:64px;margin-top:18px}
.sub{font-size:34px;color:#5b6662;margin-top:22px;line-height:1.5;word-break:keep-all}
.mark{display:inline;background:linear-gradient(transparent 58%,#f2df74 58%,#f2df74 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.foot{display:flex;justify-content:space-between;align-items:baseline;font-size:26px;color:#5b6662}
.foot b{font-family:"Gowun Batang",serif;color:#1c2421;font-weight:700;font-size:30px}
.foot .url{font-family:"IBM Plex Mono",monospace;color:#23614f}`;
const esc = s => String(s||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="bar"></div><div class="wrap"><div><p class="kicker">윤리로 읽는 뉴스 ${num}호 · ${d[0]}. ${d[1]}. ${d[2]}.${count ? ' · ' + count + '건' : ''}</p><h1 class="title"><span class="mark">${esc(title)}</span></h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div><div class="foot"><b>Ethink</b><span class="url">ethink-kr.github.io</span></div></div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.setContent(html); await p.waitForTimeout(1500);
  const out = path.join(__dirname, '..', 'assets', 'og', id + '.jpg');
  await p.screenshot({ path: out, type: 'jpeg', quality: 88 }); await b.close(); console.log(out);
})();
