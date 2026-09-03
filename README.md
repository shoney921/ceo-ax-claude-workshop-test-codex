# 실전 개발 워크샵 템플릿

워크샵에서 사용하는 **출발점 저장소**입니다.

> [!NOTE]
> 이 파일(README.md)은 **"저장소의 안내판"** 입니다.
> GitHub가 가장 먼저 보여주는 문서입니다.

---

## 이 워크샵의 목표

**"내 URL에서 내 데이터를 활용하는" 웹 화면을 Claude 기반 바이브코딩을 통해 제작해봅니다.**

| 순서 | 무엇을 | 사용 프로그램 |
|---|---|---|
| STEP 01 | 흩어진 파일을 **MasterDB**로 정리 | Claude Desktop · Cowork |
| STEP 02 | MasterDB를 **Google Sheets**에 올림 | Google Drive |
| STEP 03 | 내 저장소 만들기 → **Hello, World!** 배포 → 내 주소가 생김 | GitHub · Claude Code |
| STEP 04 | 시트 구조 + 스케치로 **내 화면(UI)** 만들기 | Claude Code |
| STEP 05 | 내 **클라이언트 ID** 만들기 | Google Cloud |
| STEP 06 | 내 화면을 **시트와 연결** (생성·조회·수정) | Claude Code |
| STEP 07 | (선택) 내 화면을 **더 좋게** — 정렬·검색·요약·그래프 | Claude Code |

---

## 워크샵 실습

위 목표 표의 STEP과 같은 순서입니다. 순서대로 진행하면 워크샵 전체를 혼자서도 완주할 수 있습니다.

| STEP | 실습 문서 | 하는 일 |
|---|---|---|
| STEP 01 | [STEP01-cowork-masterdb.md](docs/workshop/STEP01-cowork-masterdb.md) | 흩어진 파일을 MasterDB로 정리 |
| STEP 02 | [STEP02-sheets-upload.md](docs/workshop/STEP02-sheets-upload.md) | MasterDB를 Google Sheets에 올리기 |
| STEP 03 | [STEP03-skeleton-prompt.md](docs/workshop/STEP03-skeleton-prompt.md) | 내 저장소 만들기 → 폴더 구조 뼈대 잡기 → Hello, World! 배포 |
| STEP 04 | [STEP04-build-ui.md](docs/workshop/STEP04-build-ui.md) | 내 화면(UI) 만들기 |
| STEP 05 | [STEP05-google-cloud-setup.md](docs/workshop/STEP05-google-cloud-setup.md) | 내 클라이언트 ID 만들기 (시트 연결의 준비물) |
| STEP 06 | [STEP06-connect-sheets.md](docs/workshop/STEP06-connect-sheets.md) | 화면을 내 시트에 연결 (데이터 생성/조회/수정) |
| STEP 07 | [STEP07-ideas.md](docs/workshop/STEP07-ideas.md) | (선택) 더 좋게 만들기 |

## 참고 자료 (필요하거나 궁금할 때)

| 문서 | 내용 |
|---|---|
| [github-basics.md](docs/github-basics.md) | GitHub가 뭔지 궁금할 때 |
| [debugging.md](docs/debugging.md) | 뭔가 안 될 때 |
| [about-data.md](docs/about-data.md) | 정규화 이야기 |
| [about-delete.md](docs/about-delete.md) | 삭제 기능을 만들지 않은 이유 |
| [logout.md](docs/logout.md) | 공용 PC 계정 정리 |
| [next-steps.md](docs/next-steps.md) | 집에서 이어서 하기 |

## 화면 샘플

- [엑셀 기반 구매·재고 관리 HTML 목업](samples/factory-purchase-inventory/README.md)

## 구매·재고 관리 시스템 화면

저장소 루트의 `index.html`은 `우리공장_구매재고관리_운영본`과 연결되는 운영 화면입니다. 처음 한 번만 [STEP05](docs/workshop/STEP05-google-cloud-setup.md)의 Google Cloud 설정을 마친 뒤, 발급받은 웹 클라이언트 ID를 `config.js`의 `CLIENT_ID`에 넣고 GitHub Pages 주소에서 열면 됩니다.

연결 후 자재·거래처·발주·재고·예약 데이터를 최신 시트 값으로 조회하며, 추천 발주 생성·발주 승인·입고 처리·입출고·생산 예약·기준정보 등록은 원본 시트에 반영됩니다. 삭제 기능은 제공하지 않습니다.

---

## 이 저장소에 기본적으로 있는 파일들

```
├── README.md                  👈 지금 보고 있는 안내판
├── CLAUDE.md                  👈 Claude Code가 항상 먼저 읽는 업무 지침서
├── docs/                      👈 워크샵 교재 전부
│   ├── workshop/              👈 STEP 01~07 실습 문서
│   └── reference/             👈 사전 과제로 만든 화면 스케치 HTML을 넣습니다
├── samples/                   👈 이후 개발에 참고할 화면 샘플
└── .claude/skills/            👈 "배포해줘" / "저장해줘" 라고 말하면 실행되는 자동화
```

---

## 막혔을 때

1. 같은 프롬프트를 한 번 더 실행해 봅니다 (의외로 자주 해결됩니다)
2. 위 표에서 해당하는 내용의 문서를 읽어봅니다
3. [debugging.md](docs/debugging.md)의 **상황 설명 4줄**로 Claude Code에게 말합니다
4. 그래도 안 되면 도움을 요청합니다
