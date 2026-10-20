// Ethink(에씽크) · 좋아요 카운터 + 방문 통계
// 좋아요: ?id=/weekly/2026-10-16/1/&act=get|like|unlike
// 남기는 글: 목록 ?act=blist / 쓰기·읽기는 POST(JSON) {act:'bpost'|'bread', ...}
// 방문:   ?act=hit&id=/경로/&t=제목&v=방문자번호&f=dwmyn(첫 방문 표시)&r=유입 사이트&cn=코너&fr=from표시&app=앱&pv=사이트 안 이전 페이지
// 개인정보(이름, 이메일, IP)는 받지도 저장하지도 않습니다.
var ID_RULE = /^\/[a-z0-9\-\/]{0,100}$/;
var MAX_ROWS = 2000;
var TZ = 'Asia/Seoul';
var LOG = '방문기록';
var STATS = '통계';
var POSTS = '글목록';
var CORNERS = ['홈', '윤리로 읽는 뉴스 · 최신호', '윤리로 읽는 뉴스 · 지난 호', '윤리로 읽는 책', '나와 닮은 사상가', '윤리 채널', '소개·만든 책', '남기는 글', '찜한 글', '기타'];

function doGet(e) {
  var p = (e && e.parameter) || {};
  var id = String(p.id || '');
  var act = String(p.act || 'get');
  if (act === 'blist') return boardList_();
  if (!ID_RULE.test(id)) return out_({ ok: false, error: 'bad id' });
  if (act === 'hit') return hit_(p, id);
  if (id === '/') return out_({ ok: false, error: 'bad id' });
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = likeSheet_();
    var last = sh.getLastRow();
    var row = -1, count = 0;
    if (last >= 2) {
      var ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] === id) { row = i + 2; break; }
      }
    }
    if (row > 0) count = Number(sh.getRange(row, 2).getValue()) || 0;
    if (act === 'like' || act === 'unlike') {
      count = Math.max(0, count + (act === 'like' ? 1 : -1));
      if (row < 0) {
        if (last >= MAX_ROWS) return out_({ ok: false, error: 'full' });
        row = last + 1;
        sh.getRange(row, 1).setValue(id);
      }
      sh.getRange(row, 2, 1, 2).setValues([[count, new Date()]]);
    }
    return out_({ ok: true, id: id, count: count });
  } finally {
    lock.releaseLock();
  }
}

// 좋아요 탭: A1이 '글 주소'인 탭(처음 만든 '시트1'). 통계 탭이 앞에 와도 헷갈리지 않게 이름 대신 머리글로 찾습니다.
function likeSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getRange(1, 1).getValue() === '글 주소') return all[i];
  }
  var sh = all[0].getName() === STATS || all[0].getName() === LOG ? ss.insertSheet('좋아요') : all[0];
  sh.getRange(1, 1, 1, 3).setValues([['글 주소', '좋아요 수', '마지막 변경']]);
  return sh;
}

function section_(id) {
  if (id === '/') return '홈';
  if (id.indexOf('/weekly/') === 0) return '윤리로 읽는 뉴스 · 최신호';
  if (id.indexOf('/reading/') === 0) return '윤리로 읽는 책';
  if (id.indexOf('/thinker/') === 0) return '나와 닮은 사상가';
  if (id.indexOf('/channel/') === 0) return '윤리 채널';
  if (id.indexOf('/about/') === 0) return '소개·만든 책';
  if (id.indexOf('/board/') === 0) return '남기는 글';
  if (id.indexOf('/saved/') === 0) return '찜한 글';
  return '기타';
}

// 유입 경로 이름: ?from= 표시 > 앱 안 브라우저 > 이전 사이트 주소 > 직접
var FROM = { kakao: '카카오톡(공유 버튼)', link: '링크 복사', facebook: '페이스북(공유 버튼)', x: 'X(공유 버튼)',
  threads: '스레드(공유 버튼)', share: '휴대폰 공유', brunch: '브런치', blog: '네이버 블로그', insta: '인스타그램',
  channel: '길벗 카카오 채널', openchat: '카카오 오픈채팅', email: '이메일', qr: 'QR 코드' };
var APP = { k: '카카오톡', i: '인스타그램', f: '페이스북', n: '네이버 앱', t: '스레드', d: '다음 앱', l: '라인' };
function source_(fr, app, ref) {
  if (fr) return FROM[fr] || ('표시: ' + fr);
  if (app && APP[app]) return APP[app] + '(앱 안 브라우저)';
  var h = String(ref || '').toLowerCase();
  if (!h) return '직접·알 수 없음';
  var rules = [
    [/(^|\.)search\.naver\.com$/, '네이버 검색'], [/(^|\.)blog\.naver\.com$/, '네이버 블로그'], [/(^|\.)cafe\.naver\.com$/, '네이버 카페'],
    [/(^|\.)naver\.com$/, '네이버(기타)'], [/(^|\.)google\./, '구글 검색'], [/(^|\.)search\.daum\.net$/, '다음 검색'],
    [/(^|\.)daum\.net$/, '다음(기타)'], [/(^|\.)kakao\.com$/, '카카오(웹)'], [/(^|\.)bing\.com$/, '빙 검색'],
    [/(^|\.)instagram\.com$/, '인스타그램'], [/(^|\.)facebook\.com$/, '페이스북'], [/(^|\.)threads\.(net|com)$/, '스레드'],
    [/(^|\.)(t\.co|x\.com|twitter\.com)$/, 'X'], [/(^|\.)brunch\.co\.kr$/, '브런치'], [/(^|\.)youtube\.com$/, '유튜브'],
    [/(^|\.)gilbut\.co\.kr$/, '길벗 홈페이지'], [/(^|\.)github\.(com|io)$/, 'GitHub']
  ];
  for (var i = 0; i < rules.length; i++) if (rules[i][0].test(h)) return rules[i][1];
  return '기타 사이트(' + h + ')';
}

function hit_(p, id) {
  var v = String(p.v || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
  if (!v) return out_({ ok: false, error: 'no visitor' });
  var f = String(p.f || '');
  var title = String(p.t || '').replace(/[\r\n\t]/g, ' ').slice(0, 120);
  var ref = String(p.r || '').replace(/[^a-z0-9.\-]/gi, '').slice(0, 60);
  var c = String(p.cn || ''); if (CORNERS.indexOf(c) < 0) c = section_(id); // 'c'는 Apps Script 예약어라 cn으로 받음
  var fr = String(p.fr || '').replace(/[^a-z0-9\-]/gi, '').toLowerCase().slice(0, 20);
  var app = String(p.app || '').replace(/[^a-z]/g, '').slice(0, 2);
  var pv = String(p.pv || ''); if (!ID_RULE.test(pv)) pv = '';
  var now = new Date();
  var day = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  var dow = Number(Utilities.formatDate(now, TZ, 'u')); // 1=월 … 7=일
  var mon = new Date(now.getTime() - (dow - 1) * 86400000);
  var week = Utilities.formatDate(mon, TZ, 'yyyy-MM-dd') + ' 주';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = logSheet_();
    sh.appendRow([now, "'" + day, "'" + week, "'" + day.slice(0, 7), "'" + day.slice(0, 4), c, id, title, v,
      f.indexOf('d') >= 0 ? 1 : 0, f.indexOf('w') >= 0 ? 1 : 0, f.indexOf('m') >= 0 ? 1 : 0,
      f.indexOf('y') >= 0 ? 1 : 0, f.indexOf('n') >= 0 ? 1 : 0, ref || '(직접·알 수 없음)',
      source_(fr, app, ref), pv]);
    post_(id, title, c, day);
  } finally {
    lock.releaseLock();
  }
  return out_({ ok: true });
}

var LOG_HEAD = ['시각', '날짜', '주(월요일 시작)', '월', '연도', '코너', '주소', '제목', '방문자 번호',
  '오늘 첫 방문', '이번 주 첫 방문', '이번 달 첫 방문', '올해 첫 방문', '처음 방문', '유입 사이트', '유입 경로', '사이트 안 이전 페이지'];
function logSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LOG);
  if (!sh) {
    sh = ss.insertSheet(LOG);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sh.getRange('B:E').setNumberFormat('@');
  }
  if (sh.getRange(1, 16).getValue() !== '유입 경로') sh.getRange(1, 1, 1, LOG_HEAD.length).setValues([LOG_HEAD]);
  return sh;
}

// 글목록 탭: 주소마다 한 줄. 제목은 가장 최근에 본 제목으로 바꿔 둡니다(제목이 바뀌어도 한 글로 셈).
function postSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(POSTS);
  if (!sh) {
    sh = ss.insertSheet(POSTS);
    sh.getRange(1, 1, 1, 4).setValues([['주소', '제목(최근)', '코너(최근)', '처음 기록']]);
    sh.setFrozenRows(1);
    sh.getRange('D:D').setNumberFormat('@');
  }
  return sh;
}
function post_(id, title, c, day) {
  var sh = postSheet_();
  var last = sh.getLastRow();
  if (last >= 2) {
    var ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] === id) { sh.getRange(i + 2, 2, 1, 2).setValues([[title, c]]); return; }
    }
  }
  sh.appendRow([id, title, c, "'" + day]);
}

// 통계 탭을 만듭니다. 편집기에서 한 번 실행하면 됩니다(다시 실행하면 통계 탭을 새로 그립니다).
// 예전 기록의 코너 이름·유입 경로를 새 기준으로 고치고, 글목록을 다시 만듭니다.
function setupStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);
  var lg = logSheet_();
  likeSheet_().setName('좋아요');
  lg.getRange('B:E').setNumberFormat('@');
  // 예전 기록 고치기
  var n = lg.getLastRow() - 1;
  if (n > 0) {
    var rows = lg.getRange(2, 1, n, 17).getValues();
    var old = { '윤리로 읽는 뉴스': '윤리로 읽는 뉴스 · 최신호', '길벗 채널': '윤리 채널' };
    rows.forEach(function (r) {
      if (old[r[5]]) r[5] = old[r[5]];
      if (CORNERS.indexOf(r[5]) < 0) r[5] = section_(String(r[6]));
      if (!r[15]) { var h = String(r[14] || ''); r[15] = source_('', '', h.charAt(0) === '(' ? '' : h); }
    });
    lg.getRange(2, 6, n, 1).setValues(rows.map(function (r) { return [r[5]]; }));
    lg.getRange(2, 16, n, 1).setValues(rows.map(function (r) { return [r[15]]; }));
    // 글목록 다시 만들기
    var ps = postSheet_();
    if (ps.getLastRow() > 1) ps.getRange(2, 1, ps.getLastRow() - 1, 4).clearContent();
    var seen = {}, order = [];
    rows.forEach(function (r) {
      var id = String(r[6]); if (!id) return;
      if (!seen[id]) { seen[id] = [id, r[7], r[5], "'" + String(r[1])]; order.push(id); }
      else { seen[id][1] = r[7]; seen[id][2] = r[5]; }
    });
    if (order.length) ps.getRange(2, 1, order.length, 4).setValues(order.map(function (k) { return seen[k]; }));
  } else postSheet_();

  var st = ss.getSheetByName(STATS);
  if (st) st.clear(); else st = ss.insertSheet(STATS, 0);
  if (st.getMaxColumns() < 40) st.insertColumnsAfter(st.getMaxColumns(), 40 - st.getMaxColumns());
  var L = "'" + LOG + "'!", P = "'" + POSTS + "'!";
  var today = 'TEXT(TODAY(),"yyyy-mm-dd")', wk7 = 'TEXT(TODAY()-6,"yyyy-mm-dd")';
  st.getRange('A1').setValue('Ethink · 방문 통계').setFontSize(14).setFontWeight('bold');
  st.getRange('A2').setValue('방문자는 브라우저 기준 추정치입니다(한 사람이 기기나 브라우저를 바꾸면 다른 방문자로 셉니다). 조회수는 페이지가 열린 횟수입니다. 숫자는 새 방문이 들어오면 자동으로 바뀝니다.').setFontColor('#666666');
  var cards = [
    ['A4', '오늘 방문자', '=SUMIFS(' + L + 'J:J,' + L + 'B:B,' + today + ')'],
    ['B4', '오늘 조회수', '=COUNTIF(' + L + 'B:B,' + today + ')'],
    ['C4', '최근 7일 방문자', '=COUNTUNIQUE(IFERROR(FILTER(' + L + 'I2:I,' + L + 'B2:B>=' + wk7 + ')))'],
    ['D4', '최근 7일 조회수', '=SUMPRODUCT((' + L + 'B2:B>=' + wk7 + ')*(' + L + 'B2:B<>""))'],
    ['E4', '이번 달 방문자', '=SUMIFS(' + L + 'L:L,' + L + 'D:D,TEXT(TODAY(),"yyyy-mm"))'],
    ['G4', '이번 달 조회수', '=COUNTIF(' + L + 'D:D,TEXT(TODAY(),"yyyy-mm"))'],
    ['H4', '총 방문자', '=SUM(' + L + 'N:N)'],
    ['I4', '총 조회수', '=MAX(0,COUNTA(' + L + 'B:B)-1)']
  ];
  cards.forEach(function (c) {
    st.getRange(c[0]).setValue(c[1]).setFontWeight('bold');
    st.getRange(c[0]).offset(1, 0).setFormula(c[2]).setFontSize(16).setHorizontalAlignment('left');
  });
  function title_(cell, t) { st.getRange(cell).setValue(t).setFontWeight('bold').setFontColor('#23614f'); }
  var R = L + 'A2:Q';
  function q(cell, t, sql) {
    title_(st.getRange(cell).offset(-1, 0).getA1Notation(), t);
    st.getRange(cell).setFormula('=IFERROR(QUERY(' + R + ',"' + sql + '",0),"아직 기록 없음")');
  }
  // 1) 코너별: A~E
  title_('A7', '코너별 방문자·조회수');
  st.getRange('A8:E8').setValues([['코너', '방문자', '조회수', '최근 7일 방문자', '최근 7일 조회수']]).setFontWeight('bold');
  CORNERS.forEach(function (c, i) {
    var r = 9 + i, a = 'A' + r;
    st.getRange(a).setValue(c);
    st.getRange('B' + r).setFormula('=COUNTUNIQUE(IFERROR(FILTER(' + L + 'I2:I,' + L + 'F2:F=' + a + ')))');
    st.getRange('C' + r).setFormula('=COUNTIF(' + L + 'F2:F,' + a + ')');
    st.getRange('D' + r).setFormula('=COUNTUNIQUE(IFERROR(FILTER(' + L + 'I2:I,' + L + 'F2:F=' + a + ',' + L + 'B2:B>=' + wk7 + ')))');
    st.getRange('E' + r).setFormula('=SUMPRODUCT((' + L + 'F2:F=' + a + ')*(' + L + 'B2:B>=' + wk7 + '))');
  });
  // 2) 유입 경로: G~I
  title_('G7', '어디서 들어왔나 (유입 경로)');
  st.getRange('G8:I8').setValues([['유입 경로', '방문자', '조회수']]).setFontWeight('bold');
  st.getRange('G9').setFormula('=IFERROR(LET(s,UNIQUE(FILTER(' + L + 'P2:P,' + L + 'P2:P<>"")),v,MAP(s,LAMBDA(x,COUNTUNIQUE(FILTER(' + L + 'I2:I,' + L + 'P2:P=x)))),n,MAP(s,LAMBDA(x,COUNTIF(' + L + 'P2:P,x))),SORT(HSTACK(s,v,n),3,FALSE)),"아직 기록 없음")');
  // 3) 글·페이지별: K~O
  title_('K7', '글·페이지별 방문자·조회수 (제목은 가장 최근 제목)');
  st.getRange('K8:O8').setValues([['주소', '제목', '코너', '방문자', '조회수']]).setFontWeight('bold');
  st.getRange('K9').setFormula('=IFERROR(LET(p,FILTER(' + P + 'A2:A,' + P + 'A2:A<>""),t,FILTER(' + P + 'B2:C,' + P + 'A2:A<>""),v,MAP(p,LAMBDA(x,COUNTUNIQUE(FILTER(' + L + 'I2:I,' + L + 'G2:G=x)))),n,MAP(p,LAMBDA(x,COUNTIF(' + L + 'G2:G,x))),SORT(HSTACK(p,t,v,n),5,FALSE)),"아직 기록 없음")');
  // 4) 사이트 안 이동: Q~S
  q('Q8', '사이트 안에서 어디를 거쳐 왔나', "select Q, G, count(G) where Q is not null and Q <> '' group by Q, G order by count(G) desc label Q '이전 페이지', G '이 페이지', count(G) '조회수'");
  // 5) 기간별: U~AH
  q('U8', '일별', "select B, sum(J), count(B) where B is not null group by B order by B desc label B '날짜', sum(J) '방문자', count(B) '조회수'");
  q('Y8', '주별', "select C, sum(K), count(C) where C is not null group by C order by C desc label C '주', sum(K) '방문자', count(C) '조회수'");
  q('AC8', '월별', "select D, sum(L), count(D) where D is not null group by D order by D desc label D '월', sum(L) '방문자', count(D) '조회수'");
  q('AG8', '연도별', "select E, sum(M), count(E) where E is not null group by E order by E desc label E '연도', sum(M) '방문자', count(E) '조회수'");
  // 6) 유입 사이트 원래 주소: AK~AL
  q('AK8', '유입 사이트(원래 주소)', "select O, count(O) where O is not null group by O order by count(O) desc label O '유입 사이트', count(O) '조회수'");
  st.setFrozenRows(5);
  st.setColumnWidths(1, 40, 110);
  st.setColumnWidth(1, 190); st.setColumnWidth(7, 190); st.setColumnWidth(11, 200); st.setColumnWidth(12, 320); st.setColumnWidth(13, 170);
  st.setColumnWidth(17, 200); st.setColumnWidth(18, 200); st.setColumnWidth(37, 200);
  [6, 10, 16, 20, 24, 28, 32, 36].forEach(function (c) { st.setColumnWidth(c, 24); });
  return '통계 탭 준비 완료';
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ───────── 남기는 글(비공개 게시판) ─────────
// 방문자: 제목·본문·숫자 4자리 비밀번호. 이름·연락처는 받지 않음.
// 공개: '승인'에 체크하고 '숨김'에 체크하지 않은 글의 제목·날짜·답변 여부만. 본문과 댓글은 비밀번호를 맞힌 글쓴이에게만.
// 운영: 시트 '남기는 글' 탭에서 승인·숨김 칸 체크, 댓글 칸에 답을 씀. 새 글이 오면 BOARD_MAIL로 알림.
var BOARD = '남기는 글';
var BOARD_MAIL = 'drumset@nate.com';
var BOARD_HEAD = ['번호', '올린 시각', '승인', '숨김', '제목', '본문', '댓글', '비밀번호(변환값)', '소금', '방문자 번호'];
var B_TITLE = 40, B_BODY = 2000, B_GAP_SEC = 600, B_PER_DAY = 5, B_ALL_DAY = 60, B_FAIL = 5, B_LOCK_SEC = 3600;

function doPost(e) {
  var d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return out_({ ok: false, error: 'bad request' }); }
  if (d.act === 'bpost') return boardPost_(d);
  if (d.act === 'bread') return boardRead_(d);
  return out_({ ok: false, error: 'bad act' });
}

function boardSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(BOARD);
  if (!sh) {
    sh = ss.insertSheet(BOARD);
    sh.getRange(1, 1, 1, BOARD_HEAD.length).setValues([BOARD_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm');
    sh.getRange('E:G').setNumberFormat('@').setWrap(true).setVerticalAlignment('top');
    sh.getRange('C2:D2000').insertCheckboxes();
    sh.setColumnWidth(1, 50); sh.setColumnWidth(2, 130); sh.setColumnWidth(3, 50); sh.setColumnWidth(4, 50);
    sh.setColumnWidth(5, 240); sh.setColumnWidth(6, 420); sh.setColumnWidth(7, 320);
    sh.hideColumns(8, 3);
  }
  return sh;
}
function clean_(s, max, multi) {
  s = String(s || '').replace(multi ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ');
  s = s.replace(/\r\n?/g, '\n').trim();
  return s.length > max ? '' : s;
}
function hash_(salt, pw) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pw, Utilities.Charset.UTF_8));
}
function boardPost_(d) {
  if (d.hp) return out_({ ok: true, n: 0 }); // 자동 등록 프로그램이 채우는 숨은 칸
  var t = clean_(d.t, B_TITLE, false), b = clean_(d.b, B_BODY, true), pw = String(d.pw || '');
  var v = String(d.v || '').replace(/[^a-z0-9]/gi, '').slice(0, 24) || 'none';
  if (t.length < 2) return out_({ ok: false, error: 'title' });
  if (b.length < 2) return out_({ ok: false, error: 'body' });
  if (!/^\d{4}$/.test(pw)) return out_({ ok: false, error: 'pw' });
  var cache = CacheService.getScriptCache();
  var day = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd');
  if (cache.get('bgap:' + v)) return out_({ ok: false, error: 'wait' });
  var mine = Number(cache.get('bday:' + v + ':' + day) || 0), all = Number(cache.get('ball:' + day) || 0);
  if (mine >= B_PER_DAY || all >= B_ALL_DAY) return out_({ ok: false, error: 'limit' });
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var n;
  try {
    var sh = boardSheet_();
    var last = sh.getLastRow();
    n = last >= 2 ? (Number(sh.getRange(last, 1).getValue()) || last - 1) + 1 : 1;
    var salt = Utilities.getUuid();
    var row = last + 1;
    sh.getRange(row, 1, 1, BOARD_HEAD.length).setValues([[n, new Date(), false, false, t, b, '', hash_(salt, pw), salt, v]]);
    sh.getRange(row, 3, 1, 2).insertCheckboxes();
  } finally {
    lock.releaseLock();
  }
  cache.put('bgap:' + v, '1', B_GAP_SEC);
  cache.put('bday:' + v + ':' + day, String(mine + 1), 86400);
  cache.put('ball:' + day, String(all + 1), 86400);
  try {
    MailApp.sendEmail(BOARD_MAIL, '[Ethink 남기는 글] 새 글 ' + n + '번: ' + t,
      '새 글이 올라왔습니다. 시트의 「' + BOARD + '」 탭에서 승인·숨김을 정하고 댓글을 달 수 있습니다.\n\n' +
      '번호: ' + n + '\n제목: ' + t + '\n\n' + b + '\n\n시트: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  } catch (err) {}
  return out_({ ok: true, n: n });
}
function boardRows_() {
  var sh = boardSheet_(), last = sh.getLastRow();
  return last >= 2 ? sh.getRange(2, 1, last - 1, BOARD_HEAD.length).getValues() : [];
}
function boardList_() {
  var rows = boardRows_(), out = [];
  for (var i = rows.length - 1; i >= 0 && out.length < 300; i--) {
    var r = rows[i];
    if (r[2] === true && r[3] !== true && r[4]) {
      out.push({ n: r[0], t: String(r[4]), d: Utilities.formatDate(new Date(r[1]), TZ, 'yyyy. M. d.'), a: String(r[6] || '').trim() ? 1 : 0 });
    }
  }
  return out_({ ok: true, list: out });
}
function boardRead_(d) {
  var n = Number(d.n), pw = String(d.pw || '');
  if (!(n > 0) || !/^\d{4}$/.test(pw)) return out_({ ok: false, error: 'input' });
  var cache = CacheService.getScriptCache(), key = 'bfail:' + n;
  var fails = Number(cache.get(key) || 0);
  if (fails >= B_FAIL) return out_({ ok: false, error: 'locked' });
  var rows = boardRows_();
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (Number(r[0]) !== n) continue;
    if (hash_(String(r[8]), pw) !== String(r[7])) {
      cache.put(key, String(fails + 1), B_LOCK_SEC);
      return out_({ ok: false, error: 'pw', left: B_FAIL - fails - 1 });
    }
    if (r[3] === true) return out_({ ok: false, error: 'hidden' });
    return out_({ ok: true, n: n, t: String(r[4]), b: String(r[5]), c: String(r[6] || ''),
      d: Utilities.formatDate(new Date(r[1]), TZ, 'yyyy. M. d. HH:mm'), ap: r[2] === true });
  }
  cache.put(key, String(fails + 1), B_LOCK_SEC);
  return out_({ ok: false, error: 'pw', left: B_FAIL - fails - 1 });
}
// 편집기에서 한 번 실행: '남기는 글' 탭을 만들고, 메일 보내기 권한을 승인받고, 시험 메일을 한 통 보냅니다.
function setupBoard() {
  boardSheet_();
  MailApp.sendEmail(BOARD_MAIL, '[Ethink 남기는 글] 알림 설정 완료', '새 글이 올라오면 이 주소로 알림이 옵니다.');
  return '남기는 글 탭 준비 완료';
}
