// 인스타그램 게시물 지우기: node _tools/ig-delete.cjs <게시물 ID>
// GitHub Actions의 「인스타그램 수동 작업」(ig-manual.yml)에서 돌립니다. 필요한 환경 변수: IG_ACCESS_TOKEN.
const id = process.argv[2]; const TOKEN = process.env.IG_ACCESS_TOKEN;
if (!id || !TOKEN) { console.error('usage: IG_ACCESS_TOKEN=… node _tools/ig-delete.cjs <media id>'); process.exit(1); }
(async () => {
  const u = new URL(`https://graph.instagram.com/v21.0/${id}`); u.searchParams.set('access_token', TOKEN);
  const r = await fetch(u, { method: 'DELETE' }); const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error || j.success === false) { console.error(`지우지 못했습니다: ${JSON.stringify(j.error || j)}`); process.exit(1); }
  console.log(`게시물 ${id}을(를) 지웠습니다.`);
})();
