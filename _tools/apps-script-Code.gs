// 윤리로 읽는 뉴스 · 좋아요 카운터 + 방문 통계
// 좋아요: ?id=/weekly/2026-10-16/1/&act=get|like|unlike
// 방문:   ?act=hit&id=/경로/&t=제목&v=방문자번호&f=dwmyn(첫 방문 표시)&r=유입 사이트
// 개인정보(이름, 이메일, IP)는 받지도 저장하지도 않습니다.
var ID_RULE = /^\/[a-z0-9\-\/]{0,100}$/;
var MAX_ROWS = 2000;
var TZ = 'Asia/Seoul';
var LOG = '방문기록';
var STATS = '통계';

function doGet(e) {
  var p = (e && e.parameter) || {};
  var id = String(p.id || '');
  var act = String(p.act || 'get');
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
  if (id.indexOf('/weekly/') === 0) return '윤리로 읽는 뉴스';
  if (id.indexOf('/reading/') === 0) return '윤리로 읽는 책';
  if (id.indexOf('/channel/') === 0) return '길벗 채널';
  if (id.indexOf('/about/') === 0) return '소개·만든 책';
  if (id.indexOf('/saved/') === 0) return '찜한 글';
  return '기타';
}

function hit_(p, id) {
  var v = String(p.v || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
  if (!v) return out_({ ok: false, error: 'no visitor' });
  var f = String(p.f || '');
  var title = String(p.t || '').replace(/[\r\n\t]/g, ' ').slice(0, 120);
  var ref = String(p.r || '').replace(/[^a-z0-9.\-]/gi, '').slice(0, 60);
  var now = new Date();
  var day = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  var dow = Number(Utilities.formatDate(now, TZ, 'u')); // 1=월 … 7=일
  var mon = new Date(now.getTime() - (dow - 1) * 86400000);
  var week = Utilities.formatDate(mon, TZ, 'yyyy-MM-dd') + ' 주';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = logSheet_();
    sh.appendRow([now, "'" + day, "'" + week, "'" + day.slice(0, 7), "'" + day.slice(0, 4), section_(id), id, title, v,
      f.indexOf('d') >= 0 ? 1 : 0, f.indexOf('w') >= 0 ? 1 : 0, f.indexOf('m') >= 0 ? 1 : 0,
      f.indexOf('y') >= 0 ? 1 : 0, f.indexOf('n') >= 0 ? 1 : 0, ref || '(직접·알 수 없음)']);
  } finally {
    lock.releaseLock();
  }
  return out_({ ok: true });
}

function logSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LOG);
  if (!sh) {
    sh = ss.insertSheet(LOG);
    sh.getRange(1, 1, 1, 15).setValues([['시각', '날짜', '주(월요일 시작)', '월', '연도', '코너', '주소', '제목', '방문자 번호',
      '오늘 첫 방문', '이번 주 첫 방문', '이번 달 첫 방문', '올해 첫 방문', '처음 방문', '유입 사이트']]);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sh.getRange('B:E').setNumberFormat('@');
  }
  return sh;
}

// 통계 탭을 만듭니다. 편집기에서 한 번 실행하면 됩니다(다시 실행하면 통계 탭을 새로 그립니다).
function setupStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);
  logSheet_();
  likeSheet_().setName('좋아요');
  var st = ss.getSheetByName(STATS);
  var lg = ss.getSheetByName(LOG);
  lg.getRange('B:E').setNumberFormat('@');
  if (st) st.clear(); else st = ss.insertSheet(STATS, 0);
  var L = "'" + LOG + "'!";
  var today = 'TEXT(TODAY(),"yyyy-mm-dd")';
  st.getRange('A1').setValue('윤리로 읽는 뉴스 · 방문 통계').setFontSize(14).setFontWeight('bold');
  st.getRange('A2').setValue('방문자 수는 브라우저 기준 추정치입니다. 한 사람이 브라우저나 기기를 바꾸면 다른 방문자로 셉니다. 숫자는 새 방문이 들어오면 자동으로 바뀝니다.').setFontColor('#666666');
  var cards = [
    ['A4', '오늘 방문자', '=SUMIFS(' + L + 'J:J,' + L + 'B:B,' + today + ')'],
    ['B4', '오늘 조회수', '=COUNTIF(' + L + 'B:B,' + today + ')'],
    ['E4', '이번 달 방문자', '=SUMIFS(' + L + 'L:L,' + L + 'D:D,TEXT(TODAY(),"yyyy-mm"))'],
    ['F4', '이번 달 조회수', '=COUNTIF(' + L + 'D:D,TEXT(TODAY(),"yyyy-mm"))'],
    ['I4', '총 방문자', '=SUM(' + L + 'N:N)'],
    ['J4', '총 조회수', '=MAX(0,COUNTA(' + L + 'B:B)-1)']
  ];
  cards.forEach(function (c) {
    st.getRange(c[0]).setValue(c[1]).setFontWeight('bold');
    st.getRange(c[0]).offset(1, 0).setFormula(c[2]).setFontSize(16).setHorizontalAlignment('left');
  });
  var R = L + 'A2:O';
  function q(cell, title, sql) {
    st.getRange(cell).offset(-1, 0).setValue(title).setFontWeight('bold').setFontColor('#23614f');
    st.getRange(cell).setFormula('=IFERROR(QUERY(' + R + ',"' + sql + '",0),"아직 기록 없음")');
  }
  q('A8', '일별', "select B, sum(J), count(B) where B is not null group by B order by B desc label B '날짜', sum(J) '방문자', count(B) '조회수'");
  q('E8', '주별', "select C, sum(K), count(C) where C is not null group by C order by C desc label C '주', sum(K) '방문자', count(C) '조회수'");
  q('I8', '월별', "select D, sum(L), count(D) where D is not null group by D order by D desc label D '월', sum(L) '방문자', count(D) '조회수'");
  q('M8', '연도별', "select E, sum(M), count(E) where E is not null group by E order by E desc label E '연도', sum(M) '방문자', count(E) '조회수'");
  q('Q8', '코너별 조회수', "select F, count(F) where F is not null group by F order by count(F) desc label F '코너', count(F) '조회수'");
  q('T8', '글·페이지별 조회수', "select G, H, count(G) where G is not null group by G, H order by count(G) desc label G '주소', H '제목', count(G) '조회수'");
  q('X8', '유입 사이트', "select O, count(O) where O is not null group by O order by count(O) desc label O '유입', count(O) '조회수'");
  st.setFrozenRows(5);
  st.setColumnWidth(20, 260); st.setColumnWidth(21, 360);
  [4, 8, 12, 16, 19, 23].forEach(function (c) { st.setColumnWidth(c, 24); });
  return '통계 탭 준비 완료';
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
