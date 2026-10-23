// 인스타그램 안내 카드 만들기(세로 1080×1350): node _tools/ig-card.cjs <파일이름> <윗줄> <제목> <수업 질문> [아랫줄]
// 예: NODE_PATH=$(npm root -g) node _tools/ig-card.cjs 2026-10-24-1 "윤리로 읽는 뉴스 · 생명과 존엄" "조력사망을 허용하는 나라가 늘고 있다" "스스로 죽음을 앞당길 권리는 자기결정권에 포함되는가?"
// 결과: assets/ig/<파일이름>.jpg. playwright 필요.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const [,, name, kicker, title, question, foot] = process.argv;
if (!name || !title) { console.error('usage: node _tools/ig-card.cjs <name> <kicker> <title> <question> [foot]'); process.exit(1); }
const css = `
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;background:#f5f6f3;font-family:"IBM Plex Sans KR",sans-serif;color:#1c2421;position:relative;overflow:hidden}
.bar{position:absolute;left:0;top:0;bottom:0;width:22px;background:#23614f}
.wrap{position:absolute;left:96px;right:88px;top:96px;bottom:96px;display:flex;flex-direction:column}
.brand{font-family:"Gowun Batang",serif;font-weight:700;font-size:40px}
.brand small{font-family:"IBM Plex Sans KR",sans-serif;font-weight:400;font-size:24px;color:#5b6662;margin-left:18px}
.kicker{font-size:28px;color:#23614f;letter-spacing:.05em;margin-top:120px}
.title{font-family:"Gowun Batang",serif;font-weight:700;font-size:${title.length>26?72:84}px;line-height:1.28;word-break:keep-all;margin-top:22px}
.qlabel{font-size:26px;color:#5b6662;font-weight:600;letter-spacing:.04em;margin-top:auto}
.q{font-family:"Gowun Batang",serif;font-size:44px;line-height:1.55;word-break:keep-all;margin-top:14px}
.q span{background:linear-gradient(transparent 58%,#f2df74 58%,#f2df74 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:64px;padding-top:28px;border-top:2px solid #1c2421;font-size:26px;color:#5b6662}
.foot .url{font-family:"IBM Plex Mono",monospace;color:#23614f}`;
const esc = s => String(s||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="bar"></div><div class="wrap">
<p class="brand">Ethink<small>세상을 윤리로 다시 생각하다</small></p>
<p class="kicker">${esc(kicker)}</p><h1 class="title">${esc(title)}</h1>
${question ? `<p class="qlabel">수업에서, 일상에서 던질 질문</p><p class="q"><span>${esc(question)}</span></p>` : ''}
<div class="foot"><span>${esc(foot || '전문은 프로필 링크에서 읽을 수 있습니다')}</span><span class="url">ethink.kr</span></div></div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await p.setContent(html); await p.waitForTimeout(2500);
  const dir = path.join(__dirname, '..', 'assets', 'ig'); fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, name + '.jpg');
  await p.screenshot({ path: out, type: 'jpeg', quality: 90 }); await b.close(); console.log(out);
})();
