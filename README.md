# Ethink(에씽크) — GitHub Pages 사이트

Ethink(에씽크) 사이트입니다. 대표 코너는 「윤리로 읽는 뉴스 — 수업에 바로 쓰는 시사 윤리」와 「윤리로 읽는 책」입니다. 사이트 이름은 `_config.yml`의 `title`, 코너 이름은 `news_title`에서 바꿉니다. 발행 주기는 정하지 않았습니다(격주·휴간 가능). GitHub가 Jekyll로 자동 빌드하므로 따로 설치할 것이 없습니다. 비용은 들지 않습니다.

## 처음 한 번: 사이트 열기

1. github.com에 가입합니다. 아이디가 주소가 됩니다 (`아이디.github.io`).
2. 오른쪽 위 **+ → New repository**. 이름을 정확히 `아이디.github.io`로, **Public**으로 만듭니다.
3. 저장소 화면에서 **Add file → Upload files**. 이 폴더 안의 파일과 폴더를 통째로 끌어다 놓고 **Commit changes**. (`_site` 폴더는 올리지 않습니다.)
   - 숨김 파일(`.gitignore`)은 없어도 됩니다.
   - 꾸준히 쓰려면 GitHub Desktop 앱을 권합니다. 이 폴더를 저장소로 연결해 두면 저장 → Commit → Push 세 번 클릭으로 발행됩니다.
4. 저장소 **Settings → Pages → Build and deployment**에서 Source를 **Deploy from a branch**, Branch를 **main / (root)**로 두고 Save.
5. 1~3분 뒤 `https://아이디.github.io`에 사이트가 열립니다.

> 저장소 이름을 `아이디.github.io`가 아닌 다른 이름(예: `ethics`)으로 만들었다면 `_config.yml`의 `baseurl`을 `"/ethics"`로 바꿔야 합니다.

## 처음 한 번: 내 정보 고치기

`_config.yml` 맨 위의 `author`(표시 이름), `author_role`, `email`만 고치면 전체 페이지에 반영됩니다.

## 새 호 발행

1. `_issues/` 에 `_templates/새-호.md`를 복사해 `2026-10-23.md`처럼 날짜 이름으로 저장하고 앞부분(`issue_id`, `num`, `date`, `title`, `lead`)을 채웁니다.
2. `_items/2026-10-23/` 폴더를 만들고 `_templates/새-항목.md`를 `1.md`, `2.md` … 로 복사해 채웁니다.
   - `issue`는 호 파일의 `issue_id`와 같아야 합니다.
   - `section`이 같은 항목끼리 한 묶음으로 모입니다.
   - 본문 소제목은 `#####`로 씁니다.
3. 올리면(Commit) 몇 분 뒤 홈의 최신호와 지난 호 목록이 자동으로 바뀝니다.

## 「윤리로 읽는 책」 새 글

1. `_templates/새-책-글.md`를 복사해 `_reads/` 폴더에 `YYYY-MM-DD-짧은영문이름.md`로 저장합니다. 예: `_reads/2026-10-24-justice.md` → 주소 `/reading/2026-10-24-justice/`
2. 표지 이미지가 있으면 `assets/reading/`에 넣고 `cover:`에 경로를 적습니다(가로 600px 정도).
3. 밑줄 친 문장은 `underlines:`에 한 줄씩 넣습니다. 인용은 꼭 필요한 만큼 짧게 둡니다.
4. 날짜가 오늘보다 뒤이면 사이트에 나타나지 않습니다. 발행일에 맞춰 날짜를 적습니다.

## 좋아요·찜·공유하기

- 글마다 「좋아요」, 「찜」, 「공유하기」 단추가 있습니다.
- 「공유하기」를 누르면 카카오톡·Facebook·X·Threads·링크 복사(고리 기호) 메뉴가 열립니다. 카카오톡은 휴대폰에서 기기 공유 창을 열고, 컴퓨터에서는 링크를 복사합니다.
- 「찜」은 독자의 브라우저에만 저장되고, 위쪽 메뉴 「찜한 글」(/saved/)에서 모아 봅니다.
- 좋아요 수는 구글 시트 「윤리로 읽는 뉴스 · 좋아요 카운터」에 쌓입니다. `_config.yml`의 `likes_api:`를 비우면 하트가 숨겨집니다.

## 활동지 파일 올리기 (직접 만든 것만)

`files/` 폴더에 PDF·HWP를 넣고 항목 앞부분에 적습니다.

```
downloads:
  - name: 수업 활동지 (PDF)
    file: /files/2026-10-23-1-활동지.pdf
```


## 주소 구조

| 페이지 | 주소 |
|---|---|
| 홈(최신호 + 지난 호) | `/` |
| 호 | `/weekly/2026-10-16/` |
| 항목 하나 | `/weekly/2026-10-16/1/` |
| 소개 | `/about/` |

## 확인할 것


## 공유 썸네일(OG 이미지)

메신저·SNS에 주소를 붙이면 뜨는 미리보기 그림은 `assets/og/` 폴더에 있습니다.
- `site.jpg` 홈·기본, `about.jpg` 소개, `호날짜.jpg`(예: `2026-10-16.jpg`) 해당 호와 그 호의 항목 페이지.
- 새 호를 내면 같은 틀로 `assets/og/새호날짜.jpg`(1200×630)를 만들어 넣습니다. 없으면 `site.jpg`가 대신 쓰입니다.
- 한 번 공유된 주소의 그림은 카카오톡 등이 저장해 두므로, 바꾼 그림이 바로 보이지 않을 수 있습니다.

## 방문 통계 (운영자 전용)
- 페이지가 열릴 때마다 `_includes/page-actions.html`이 좋아요와 같은 Apps Script 웹 앱에 `act=hit`로 한 줄을 보냅니다(주소, 제목, 브라우저별 무작위 번호, 유입 사이트). 이름·이메일·IP는 보내지 않습니다.
- 기록과 통계는 구글 시트 「윤리로 읽는 뉴스 · 방문 통계·좋아요」의 '방문기록'·'통계' 탭에 쌓입니다. 시트는 비공개라 운영자만 봅니다.
- 내 브라우저를 집계에서 빼려면 그 브라우저로 `https://ethink-kr.github.io/?nostats=1`을 한 번 엽니다(`?nostats=0`이면 다시 셉니다).
- Apps Script 코드 사본: `_tools/apps-script-Code.gs`. 통계 탭을 다시 그리려면 편집기에서 `setupStats`를 실행합니다.
