// 오늘(한국 시간) 발행된 글을 인스타그램(@ethink.kr)에 올립니다. GitHub Actions의 예약 빌드 뒤에 돌아갑니다.
// 필요한 환경 변수: IG_USER_ID(인스타그램 전문가 계정 ID), IG_ACCESS_TOKEN(장기 토큰, 60일).
// 글 폴더 _items/YYYY-MM-DD/N.md 옆에 ig.txt(캡션)가 있고, assets/ig/YYYY-MM-DD-N.jpg(세로 카드)가 있어야 합니다.
// 같은 글을 두 번 올리지 않도록, 최근 올린 게시물의 캡션 첫 줄과 비교합니다.
// 사용: node _tools/ig-post.cjs [YYYY-MM-DD]   (날짜를 주지 않으면 오늘, Asia/Seoul)
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://ethink.kr';
const API = 'https://graph.instagram.com/v21.0';
const USER = process.env.IG_USER_ID, TOKEN = process.env.IG_ACCESS_TOKEN;
if (!USER || !TOKEN) { console.log('IG_USER_ID 또는 IG_ACCESS_TOKEN이 없어 건너뜁니다.'); process.exit(0); }

const kst = new Date(Date.now() + 9 * 3600 * 1000);
const day = process.argv[2] || kst.toISOString().slice(0, 10);
const dir = path.join(ROOT, '_items', day);
if (!fs.existsSync(dir)) { console.log(`${day}: 올릴 글 폴더가 없습니다.`); process.exit(0); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(p, opt = {}) {
  const u = new URL(API + p); u.searchParams.set('access_token', TOKEN);
  const r = await fetch(u, opt); const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${p}: ${JSON.stringify(j.error || j)}`);
  return j;
}
function firstLine(s) { return String(s || '').split('\n').map(x => x.trim()).find(Boolean) || ''; }

(async () => {
  const recent = await api(`/${USER}/media?fields=caption,timestamp&limit=10`);
  const done = new Set((recent.data || []).map(m => firstLine(m.caption)));
  const files = fs.readdirSync(dir).filter(f => /^\d+\.md$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
  let posted = 0;
  for (const f of files) {
    const n = f.replace('.md', '');
    const md = fs.readFileSync(path.join(dir, f), 'utf8');
    const fm = md.split('---')[1] || '';
    const title = (fm.match(/^title:\s*(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '') || '';
    const dateLine = (fm.match(/^date:\s*(.+)$/m) || [])[1] || '';
    const when = new Date(dateLine.trim().replace(' ', 'T').replace(/\s*\+0900$/, '+09:00'));
    if (!isNaN(when) && when.getTime() > Date.now()) { console.log(`${day}/${n}: 아직 발행 시각 전입니다(${dateLine.trim()}).`); continue; }
    const capPath = fs.existsSync(path.join(dir, `ig-${n}.txt`)) ? path.join(dir, `ig-${n}.txt`) : path.join(dir, 'ig.txt');
    if (!fs.existsSync(capPath)) { console.log(`${day}/${n}: 캡션 파일(ig.txt)이 없어 건너뜁니다.`); continue; }
    const caption = fs.readFileSync(capPath, 'utf8').trim();
    if (done.has(firstLine(caption))) { console.log(`${day}/${n}: 이미 올라간 글입니다.`); continue; }
    const img = `${SITE}/assets/ig/${day}-${n}.jpg`;
    let ok = false;
    for (let i = 0; i < 10; i++) { const r = await fetch(img, { method: 'HEAD' }); if (r.ok) { ok = true; break; } await sleep(30000); }
    if (!ok) { console.log(`${day}/${n}: 카드 이미지(${img})를 아직 받을 수 없습니다. 다음 실행에서 다시 시도합니다.`); continue; }
    const c = await api(`/${USER}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_url: img, caption }) });
    for (let i = 0; i < 20; i++) {
      const s = await api(`/${c.id}?fields=status_code`);
      if (s.status_code === 'FINISHED') break;
      if (s.status_code === 'ERROR') throw new Error(`${day}/${n}: 컨테이너 오류`);
      await sleep(5000);
    }
    const pub = await api(`/${USER}/media_publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creation_id: c.id }) });
    console.log(`${day}/${n}: 인스타그램에 올렸습니다. 게시물 ID ${pub.id} — ${title}`);
    posted++;
  }
  // 장기 토큰 갱신(발급 24시간 뒤부터 가능, 60일 연장). 새 토큰은 GH_PAT가 있을 때만 저장소 비밀에 다시 넣습니다.
  try {
    const r = await api(`/refresh_access_token?grant_type=ig_refresh_token`);
    if (r.access_token) {
      fs.writeFileSync(path.join(process.env.RUNNER_TEMP || '/tmp', 'ig_token_new'), r.access_token);
      console.log(`토큰을 갱신했습니다(${Math.round(r.expires_in / 86400)}일 남음).`);
    }
  } catch (e) { console.log('토큰 갱신은 건너뜁니다: ' + e.message.slice(0, 160)); }
  console.log(`올린 글 ${posted}편.`);
})().catch(e => { console.error(e.message); process.exit(1); });
