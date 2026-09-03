⬅️ **이전** : [STEP 01 · Cowork로 MasterDB 만들기](STEP01-cowork-masterdb.md)

# STEP 02 · MasterDB를 Google Sheets에 올리기

> [!NOTE]
> STEP 01에서 MasterDB를 만든 다음에 STEP 02를 진행해야 합니다.

STEP 01에서 만든 MasterDB 엑셀 파일을 Google Sheets로 바꿉니다.
**지금부터 이 시트가 여러분 데이터의 원본입니다.**

---

## 1단계 : 업로드

1. 브라우저에서 [drive.google.com](https://drive.google.com)에 접속합니다. (**개인 Google 계정**으로 로그인)
2. 왼쪽 위 **`+ 신규`** → **`파일 업로드`** 순서로 클릭합니다.
3. STEP 01에서 만든 MasterDB 엑셀 파일을 선택합니다.
4. 업로드가 끝나면 파일 이름 위에서 **마우스 오른쪽 버튼**을 클릭합니다.
5. **`연결 프로그램`** → **`Google 스프레드시트`** 순서로 클릭합니다.
6. 새 탭에서 시트가 열립니다. 아래쪽 **탭 이름들이 그대로 살아 있는지** 확인합니다.

> [!NOTE]
> 6번에서 열린 것은 "변환된 새 파일"입니다. 원본 엑셀도 Drive에 그대로 남아 있습니다.
> 앞으로 쓸 것은 **변환된 쪽**입니다. 이름 끝에 `.xlsx`가 없는 파일입니다.

---

## 2단계 : 시트 ID 적어 두기 ⭐

다음 단계들에서 **반드시** 필요합니다. 지금 메모장에 적어 두세요.

브라우저 주소창을 보면 이렇게 생겼습니다 :

```
https://docs.google.com/spreadsheets/d/1a2B3cD4eF5gH6iJ7kL8mN9oP0qR/edit#gid=0
                                      └────────── 이 부분이 시트 ID ──────────┘
```

`/d/` 와 `/edit` **사이의 긴 글자**가 시트 ID입니다.

**적어 둘 것 3가지** :

```
시트 ID   : 1a2B3cD4eF5gH6iJ7kL8mN9oP0qR
탭 이름   : (아래쪽 탭에 적힌 이름 그대로. 예: 입고기록, 거래처)
열 이름   : (1행에 있는 열 이름들. 예: 날짜, 자재명, 수량, 거래처)
```

---

## 3단계 : Claude에 Google Drive 연결해 두기

다음 단계에서 Claude Code가 이 시트를 **직접 읽습니다.** 그러려면 여러분의 Claude 계정에
Google Drive가 연결되어 있어야 합니다. 지금 미리 해 둡니다.

1. Claude Desktop 앱 → 왼쪽 아래 프로필 → **`설정(Settings)`** 순서로 클릭합니다.
2. **`커넥터(Connectors)`** 메뉴를 클릭합니다.
3. 목록에서 **`Google Drive`** 를 찾아 **`연결(Connect)`** 을 클릭합니다.
4. 브라우저가 열리면 **시트를 올린 그 Google 계정**으로 로그인하고 허용합니다.
5. 커넥터 목록에서 Google Drive가 `연결됨`으로 바뀌었는지 확인합니다.

> [!NOTE]
> 이 설정은 **여러분의 Claude 계정**에 연결되는 것입니다.
> 시트를 외부에 공개하는 게 아니라, 여러분의 Claude가 여러분의 Drive를 읽을 수 있게 되는 것뿐입니다.
> 집 PC에서 같은 Claude 계정으로 로그인하면 이 연결이 그대로 존재합니다.

---

## ✅ 체크포인트

- [ ] 내 Google Drive에 스프레드시트가 있다
- [ ] 탭 구성과 열이 MasterDB와 똑같다
- [ ] 시트 ID·탭 이름·열 이름을 메모해 뒀다
- [ ] Claude 설정의 커넥터에서 Google Drive가 `연결됨`이다

---

➡️ **다음** : [STEP 03 · 내 저장소 만들기 & 뼈대 잡기](STEP03-skeleton-prompt.md)
