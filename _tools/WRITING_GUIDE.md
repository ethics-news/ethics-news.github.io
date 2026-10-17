# 「수업에 바로 쓰는 시사 윤리」 원고 지침

매주 금요일 발행. 운영자 박재형(호칭 "재형 님"). 이 문서는 주간 초안 작업과 발행 작업이 따르는 규칙이다.

## 1. 한 호의 구성
- 최근 1~2주 뉴스에서 도덕·윤리 수업에 쓸 소재 3편(많아야 4편). 국내·국제를 섞고, 주제가 겹치지 않게 한다.
- 이미 낸 호(_issues, _items)와 같은 소재·같은 각도는 피한다.
- 호 파일 `_issues/YYYY-MM-DD.md`: issue_id, num(이전 호 +1), date(발행 금요일), title(세 소재를 쉼표로 잇는 한 줄), lead("이번 호에는 …을 골랐습니다." 한두 문장).
- 항목 파일 `_items/YYYY-MM-DD/N.md` 앞머리: issue, num, date(발행 금요일, 반드시 넣음), section(묶음 이름, 예: 인권과 평화), kicker(국내/국제 · 날짜·사건 성격), title, question(수업에서 던질 질문 한 문장), caution(다룰 때 주의할 점: 사실관계의 한계, 교실에서 조심할 부분), subjects(교과 연계: 과목 · 단원), lenses(사상가 렌즈), sources(name: "매체 (월.일)", url).
- 본문 소제목 세 개: `##### 무슨 일이 있었나` / `##### 왜 윤리 문제인가` / `##### 수업에서 쓰는 법`.

## 2. 문체
- 제목·소제목은 평어, 본문은 경어(~습니다/~입니다). 문단은 3~5문장.
- 금지: "~하는 자리이다", "~이기 때문이다" 같은 AI투, "두 갈래"(→ "두 가지"), "여기서 중요한 것은", "눈여겨볼 것이 하나 더 있습니다" 같은 완충 표현, 불필요한 부사·추측 표현. 할 말은 바로 한다.
- 외국 사례를 "○○신문은 ~라고 전했습니다"처럼 한국 언론을 거쳐 전하지 않는다. 사실은 단정형으로 쓰고 출처는 sources에만 둔다.
- 표기: 도덕·윤리처럼 함께 쓰는 두 단어 사이에 중점. 책은 『』, 글·작품·교과서 과목명은 「」.
- 출처 표기에 연도를 넣지 않는다(sources name은 "매체 (월.일)").
- 정치·국제 분쟁 소재는 어느 한쪽을 단죄하지 않게 쓰고, caution에 그 점을 적는다.

## 3. 사실 확인
- 모든 사실은 기사 원문으로 확인한다. 확인하지 못한 수치·인용·날짜는 쓰지 않는다.
- 불확실한 부분은 초안 보고에 "확인 필요"로 따로 적는다(본문에 지어 넣지 않는다).

## 4. 사상가 원문
- 사상가가 나오면 원문을 함께 싣는다: `<figure class="src"><blockquote><p>원문</p></blockquote><figcaption>사상가, 『책』(옮긴이 옮김, 출판사, 연도) · 교과서/단행본 수록 위치</figcaption></figure>`. 두 입장 비교는 `<div class="vs">` 안에 figure 두 개, 각 figure에 `<p class="vs-head">입장 · 사상가</p>`.
- 원문은 반드시 실제 텍스트에서 가져온다: 재형 님 옵시디언 볼트 `Vault/_library/`(책 OCR 원문, 읽기 전용)와 `Vault/textbook/`, 또는 확인 가능한 공개 원문. 기억으로 쓰거나 다듬어 만든 문장을 원문처럼 싣지 않는다. 찾지 못하면 그 자리에 `[원문 확인 필요: 사상가, 책, 찾을 대목]`을 남기고 보고한다.
- 교과서 수록 원문이면 교과서와 사상가 책을 모두 출처로 적는다(길벗 『윤리 사상가로 읽는 통합사회』, 「인문학과 윤리」, 「윤리문제 탐구」 등). 아니면 사상가의 어느 책인지 밝힌다.

## 5. 수업에서 쓰는 법
- 설명과 함께 도식을 넣는다: `<figure class="fig"><p class="fig-title">수업 흐름</p><ol class="flow"><li><span class="flow-step">단계</span><span class="flow-desc">설명</span></li>…</ol></figure>`. 개념 대비는 `<div class="scale">`(scale-cell, scale-arrow, scale-cell-strong), 표는 `<table class="tbl">`. 기존 `_items/2026-10-16/*.md`를 본보기로 삼는다.
- 활동지 파일은 만들지 않는다(사이트는 파일 배포를 하지 않음).

## 6. 썸네일
- 호마다 `assets/og/YYYY-MM-DD.jpg`: `NODE_PATH=$(npm root -g) node _tools/og-issue.cjs YYYY-MM-DD 호수 "호 제목" "소재1 · 소재2 · 소재3" 건수`.

## 7. 볼트 사본
- 재형 님 옵시디언 볼트 `Vault/윤리로 읽는 뉴스/`에 항목마다 `nw_YYYY-MM-DD-N 제목.md`(앞머리: series, corner, issue, num, section, kicker, title, status(초안/확정/발행), published, url, question, caution, subjects, lenses, sources)와 `00 홈.md`의 호 목록을 갱신한다. 기존 파일 형식을 그대로 따른다.
