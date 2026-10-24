// 인스타그램 카드 뉴스(여러 장, 세로 1080×1350) 만들기
// 사용: NODE_PATH=$(npm root -g) node _tools/ig-cards.cjs <글 파일> [카드 문안 파일]
//   예: node _tools/ig-cards.cjs _items/2026-10-24/1.md            → 문안: _items/2026-10-24/ig-cards-1.yml
//       node _tools/ig-cards.cjs _reads/2026-10-29-hate-speech.md  → 문안: _reads/ig/2026-10-29-hate-speech.yml
// 결과: assets/ig/<이름>-01.jpg, -02.jpg … (뉴스 글 이름은 YYYY-MM-DD-N, 책 글은 파일 이름)
// 필요: playwright, js-yaml (npm i -g playwright js-yaml)
//
// 문안 파일(YAML) 형식 — 카드 한 장에 3~4줄을 넘기지 않는다.
//   approved: false            # 재형 님 승인 뒤 true. false면 자동 게시하지 않는다(_tools/ig-post.cjs).
//   cards:
//     - type: cover             # 코너·제목·질문은 글 앞머리에서 가져온다(필요하면 title/question으로 덮어쓰기)
//     - type: text              # label(작은 머리글), big(크게 보일 숫자나 말, 선택), big_note, lines(문장 목록)
//     - type: quote             # who(사상가 이름, _data/faces.yml의 초상), text, source
//     - type: flow              # label, steps: [[단계, 설명], …] (최대 4)
//     - type: compare           # label, left: {head, text, note}, right: {head, text, note}
//     - type: underline         # 책 글: lines(밑줄 문장 1~2개), page
//     - type: book              # 책 글: 표지(작게)·책 이름·지은이. 표지 출처를 함께 적는다.
//     - type: end               # 질문을 다시 보여 주고 ethink.kr 안내
const { chromium } = require('playwright');
const yaml = require('js-yaml');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const [,, postArg, cardsArg] = process.argv;
if (!postArg) { console.error('usage: node _tools/ig-cards.cjs <글 파일> [카드 문안 파일]'); process.exit(1); }
const postPath = path.resolve(postArg);
const src = fs.readFileSync(postPath, 'utf8');
const fm = yaml.load(src.split(/^---\s*$/m)[1]) || {};
const isRead = postPath.includes(`${path.sep}_reads${path.sep}`);
let name, defCards;
if (isRead) { name = path.basename(postPath, '.md'); defCards = path.join(ROOT, '_reads', 'ig', name + '.yml'); }
else { const day = path.basename(path.dirname(postPath)); const n = path.basename(postPath, '.md'); name = `${day}-${n}`; defCards = path.join(path.dirname(postPath), `ig-cards-${n}.yml`); }
const cardsPath = path.resolve(cardsArg || defCards);
const doc = yaml.load(fs.readFileSync(cardsPath, 'utf8')) || {};
const cards = doc.cards || [];
const faces = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'faces.yml'), 'utf8')) || [];
const corner = isRead ? '윤리로 읽는 책' : `윤리로 읽는 뉴스${fm.section ? ' · ' + fm.section : ''}`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataUri = p => { const f = path.join(ROOT, p.replace(/^\//, '')); return fs.existsSync(f) ? `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}` : ''; };
function face(who) {
  const f = faces.find(x => x.name === who || (x.match || []).some(m => m.replace(/[,·\s]+$/, '') === who));
  if (!f) return '';
  if (f.img) return `<img class="face" src="${dataUri(f.img)}" alt="">`;
  return `<span class="face face-i">${esc(f.initial || who[0])}</span>`;
}
const css = `
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;background:#f5f6f3;font-family:"IBM Plex Sans KR",sans-serif;color:#1c2421;position:relative;overflow:hidden}
.bar{position:absolute;left:0;top:0;bottom:0;width:22px;background:#23614f}
.wrap{position:absolute;left:96px;right:88px;top:88px;bottom:88px;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:baseline}
.brand{font-family:"Gowun Batang",serif;font-weight:700;font-size:36px}
.page{font-family:"IBM Plex Mono",monospace;font-size:26px;color:#5b6662}
.corner{font-size:26px;color:#23614f;letter-spacing:.05em;margin-top:14px}
.label{font-size:30px;color:#23614f;font-weight:600;letter-spacing:.04em;margin-top:96px;padding-bottom:18px;border-bottom:2px solid #23614f;align-self:flex-start}
.body{margin-top:56px;display:flex;flex-direction:column;gap:34px}
.line{font-size:40px;line-height:1.6;word-break:keep-all}
.big{font-family:"Gowun Batang",serif;font-weight:700;font-size:150px;line-height:1.2;color:#23614f;letter-spacing:-.02em}
.bignote{font-size:30px;color:#5b6662;margin-top:18px}
.title{font-family:"Gowun Batang",serif;font-weight:700;line-height:1.28;word-break:keep-all;margin-top:110px}
.qlabel{font-size:26px;color:#5b6662;font-weight:600;letter-spacing:.04em;margin-top:auto}
.cover-gap{margin-bottom:40px}
.q{font-family:"Gowun Batang",serif;font-size:46px;line-height:1.55;word-break:keep-all;margin-top:14px}
.q span,.hl{background:linear-gradient(transparent 58%,#f2df74 58%,#f2df74 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.swipe{font-size:26px;color:#5b6662;margin-top:44px}
.quote{margin-top:72px;background:#fff;border:2px solid #d9ded9;border-radius:10px;padding:56px 56px 48px;display:flex;flex-direction:column;gap:36px}
.quote p.t{font-family:"Gowun Batang",serif;font-size:42px;line-height:1.7;word-break:keep-all}
.who{display:flex;align-items:center;gap:22px;font-size:26px;color:#5b6662;line-height:1.5}
.who b{color:#1c2421;font-size:30px;display:block}
.face{width:96px;height:96px;border-radius:50%;object-fit:cover;flex:none;border:2px solid #d9ded9}
.face-i{display:inline-flex;align-items:center;justify-content:center;background:#23614f;color:#fff;font-family:"Gowun Batang",serif;font-weight:700;font-size:40px}
.flow{list-style:none;padding:0;margin-top:56px;display:flex;flex-direction:column;gap:22px;counter-reset:s}
.flow li{counter-increment:s;background:#fff;border:2px solid #d9ded9;border-radius:10px;padding:26px 30px 26px 104px;position:relative}
.flow li::before{content:counter(s);position:absolute;left:30px;top:26px;width:52px;height:52px;border-radius:50%;background:#23614f;color:#fff;font-family:"IBM Plex Mono",monospace;font-size:28px;display:grid;place-items:center}
.flow b{font-size:34px;display:block}
.flow span{font-size:28px;color:#5b6662;line-height:1.5;word-break:keep-all;display:block;margin-top:6px}
.cmp{margin-top:64px;display:flex;flex-direction:column;gap:22px;align-items:stretch}
.cell{background:#fff;border:2px solid #d9ded9;border-radius:10px;padding:38px 40px}
.cell.strong{border:4px solid #23614f}
.cell h3{font-family:"Gowun Batang",serif;font-size:44px;line-height:1.35}
.cell p{font-size:32px;line-height:1.55;margin-top:14px;word-break:keep-all}
.cell .note{font-size:26px;color:#5b6662}
.arrow{text-align:center;font-size:44px;color:#23614f;line-height:1}
.ul{margin-top:72px;border-left:10px solid #23614f;padding:8px 0 8px 40px;display:flex;flex-direction:column;gap:30px}
.ul p{font-family:"Gowun Batang",serif;font-size:44px;line-height:1.7;word-break:keep-all}
.ul .pg{font-family:"IBM Plex Mono",monospace;font-size:26px;color:#5b6662}
.book{margin-top:80px;display:flex;gap:48px;align-items:flex-start}
.book img{width:300px;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.book h2{font-family:"Gowun Batang",serif;font-size:54px;line-height:1.3;word-break:keep-all}
.book p{font-size:30px;color:#5b6662;line-height:1.6;margin-top:18px}
.book .credit{font-size:22px;margin-top:28px}
.foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:auto;padding-top:26px;border-top:2px solid #1c2421;font-size:26px;color:#5b6662}
.foot .url{font-family:"IBM Plex Mono",monospace;color:#23614f}
.endq{font-family:"Gowun Batang",serif;font-size:56px;line-height:1.5;word-break:keep-all;margin-top:150px}
.cta{font-size:34px;line-height:1.7;margin-top:80px}
.cta b{color:#23614f}`;
const total = cards.length;
function page(i, inner, footLeft) {
  const left = footLeft ?? (fm.title && fm.title.length > 34 ? fm.title.slice(0, 33) + '…' : fm.title);
  return `<div class="bar"></div><div class="wrap"><div class="top"><span class="brand">Ethink</span><span class="page">${i + 1} / ${total}</span></div><p class="corner">${esc(corner)}</p>${inner}<div class="foot"><span>${esc(left)}</span><span class="url">ethink.kr</span></div></div>`;
}
function render(c, i) {
  const t = c.type;
  if (t === 'cover') {
    const title = c.title || fm.title, q = c.question || fm.question;
    return page(i, `<h1 class="title" style="font-size:${title.length > 30 ? 70 : 82}px">${esc(title)}</h1>
<p class="qlabel">수업에서, 일상에서 던질 질문</p><p class="q"><span>${esc(q)}</span></p><p class="swipe">옆으로 넘겨 보세요 →</p>`, isRead ? `『${fm.book}』 ${fm.writer}` : (fm.kicker || ''));
  }
  if (t === 'text') return page(i, `<p class="label">${esc(c.label)}</p><div class="body">${c.big ? `<div><p class="big">${esc(c.big)}</p>${c.big_note ? `<p class="bignote">${esc(c.big_note)}</p>` : ''}</div>` : ''}${(c.lines || []).map(l => `<p class="line">${esc(l)}</p>`).join('')}</div>`);
  if (t === 'quote') return page(i, `<p class="label">${esc(c.label || '사상가의 문장')}</p><div class="quote"><p class="t">${esc(c.text)}</p><div class="who">${face(c.who)}<div><b>${esc(c.who)}</b>${esc(c.source || '')}</div></div></div>`);
  if (t === 'flow') return page(i, `<p class="label">${esc(c.label || '수업 흐름')}</p><ol class="flow">${(c.steps || []).slice(0, 4).map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ol>`);
  if (t === 'compare') {
    const cell = (x, strong) => `<div class="cell${strong ? ' strong' : ''}"><h3>${esc(x.head)}</h3><p>${esc(x.text)}</p>${x.note ? `<p class="note">${esc(x.note)}</p>` : ''}</div>`;
    return page(i, `<p class="label">${esc(c.label)}</p><div class="cmp">${cell(c.left)}<div class="arrow">${esc(c.arrow || '↓')}</div>${cell(c.right, true)}</div>`);
  }
  if (t === 'underline') return page(i, `<p class="label">${esc(c.label || '밑줄 친 문장')}</p><div class="ul">${(c.lines || []).map(l => `<p><span class="hl">${esc(l)}</span></p>`).join('')}${c.page ? `<span class="pg">${esc(c.page)}쪽</span>` : ''}</div>`);
  if (t === 'book') {
    const cov = fm.cover ? dataUri(fm.cover) : '';
    return page(i, `<p class="label">${esc(c.label || '이번에 읽은 책')}</p><div class="book">${cov ? `<img src="${cov}" alt="">` : ''}<div><h2>${esc(fm.book)}</h2><p>${esc(fm.writer)} 지음${fm.translator ? ` · ${esc(fm.translator)} 옮김` : ''}<br>${esc(fm.publisher || '')}</p>${(c.lines || []).map(l => `<p>${esc(l)}</p>`).join('')}${cov && fm.cover_from ? `<p class="credit">표지 이미지: ${esc(fm.cover_from)}</p>` : ''}</div></div>`);
  }
  if (t === 'end') {
    const q = c.question || fm.question;
    return page(i, `<p class="endq"><span class="hl">${esc(q)}</span></p><p class="cta">${(c.lines || ['전문과 수업 활동 예시는', '<b>프로필 링크 · ethink.kr</b>에서 읽을 수 있습니다.']).map(l => l.startsWith('<b>') ? l : esc(l)).join('<br>')}</p><p class="cta" style="margin-top:36px;font-size:28px;color:#5b6662">한 달에 두 번, 메일로도 받아 볼 수 있습니다.</p>`, '저장해 두고 수업에 써 보세요');
  }
  throw new Error('알 수 없는 카드 종류: ' + t);
}
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const dir = path.join(ROOT, 'assets', 'ig'); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (new RegExp(`^${name}-\\d{2}\\.jpg$`).test(f)) fs.unlinkSync(path.join(dir, f));
  for (let i = 0; i < cards.length; i++) {
    await p.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${render(cards[i], i)}</body></html>`);
    await p.waitForTimeout(i === 0 ? 2500 : 600);
    const out = path.join(dir, `${name}-${String(i + 1).padStart(2, '0')}.jpg`);
    await p.screenshot({ path: out, type: 'jpeg', quality: 90 }); console.log(out);
  }
  await b.close();
})();
