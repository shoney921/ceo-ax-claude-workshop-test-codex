'use strict';

/* Google Sheets 연결: 조회(get), 추가(append), 수정(update)만 사용합니다. */
const SHEETS_DISCOVERY = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const sheetConnection = { gapiReady: false, gisReady: false, connected: false, loading: false, tokenClient: null };

const byId = id => document.getElementById(id);
const value = (row, key) => row[key] ?? '';
const number = input => {
  if (typeof input === 'number') return input;
  const text = String(input ?? '').replace(/,/g, '').replace(/[^0-9.-]/g, '');
  return Number(text) || 0;
};
const percent = input => String(input ?? '').includes('%') ? number(input) : number(input) * 100;
const asDate = input => {
  if (typeof input === 'number') return new Date(Date.UTC(1899, 11, 30) + input * 86400000).toISOString().slice(0, 10);
  const text = String(input ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/(\d{4})[.\/년\- ]+(\d{1,2})[.\/월\- ]+(\d{1,2})/);
  return match ? `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}` : text;
};
const dateToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
const quoteRange = (sheet, columns = 'A:Z') => `'${sheet.replace(/'/g, "''")}'!${columns}`;
const rowsAsObjects = rows => {
  const [headers = [], ...data] = rows || [];
  return data.filter(row => row.some(cell => cell !== '')).map((row, index) => Object.fromEntries(headers.map((header, col) => [header, row[col] ?? '']).concat([['__row', index + 2]])));
};

function setConnectionStatus(message, type = '') {
  const node = byId('connectionStatus');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('error', type === 'error');
}

function setBusy(busy, label = 'Google 계정으로 연결') {
  sheetConnection.loading = busy;
  const button = byId('connectBtn');
  if (!button) return;
  button.disabled = busy || !sheetConnection.gapiReady || !sheetConnection.gisReady || !CLIENT_ID;
  button.textContent = busy ? '시트 동기화 중…' : label;
}

function showSheetError(error) {
  const status = error?.status || error?.result?.error?.code;
  const message = error?.result?.error?.message || error?.message || '알 수 없는 오류';
  let help = '연결을 다시 시도해 주세요.';
  if (status === 401) help = '로그인 권한이 만료되었습니다. “Google 계정으로 연결”을 다시 눌러 주세요.';
  if (status === 403) help = 'Google 로그인 동의 화면에서 Sheets 권한을 허용했는지와 시트 공유 권한을 확인해 주세요.';
  setConnectionStatus(`연결 오류: ${message}`, 'error');
  window.toast?.('Google Sheet 연결에 실패했습니다', help);
}

async function gapiLoaded() {
  try {
    await new Promise(resolve => gapi.load('client', resolve));
    await gapi.client.init({ discoveryDocs: [SHEETS_DISCOVERY] });
    sheetConnection.gapiReady = true;
    readyForConnection();
  } catch (error) { showSheetError(error); }
}

function gisLoaded() {
  if (!CLIENT_ID) {
    setConnectionStatus('config.js에 클라이언트 ID를 넣어 주세요', 'error');
    return;
  }
  sheetConnection.tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SHEETS_SCOPE,
    callback: async response => {
      if (response.error) return showSheetError(response);
      gapi.client.setToken(response);
      sheetConnection.connected = true;
      await loadSheetData();
    }
  });
  sheetConnection.gisReady = true;
  readyForConnection();
}

function readyForConnection() {
  if (!CLIENT_ID) return;
  if (sheetConnection.gapiReady && sheetConnection.gisReady) {
    setBusy(false);
    setConnectionStatus('Google Sheet 연결 준비 완료');
  }
}

function requestSheetConnection() {
  if (!CLIENT_ID) {
    setConnectionStatus('config.js의 CLIENT_ID 설정이 필요합니다', 'error');
    window.toast?.('클라이언트 ID 설정이 필요합니다', 'STEP05 안내에 따라 Google Cloud의 웹 클라이언트 ID를 config.js에 넣어 주세요.');
    return;
  }
  if (!sheetConnection.tokenClient) return;
  sheetConnection.tokenClient.requestAccessToken({ prompt: gapi.client.getToken() ? '' : 'consent' });
}

async function getSheet(sheet, columns) {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: quoteRange(sheet, columns),
    valueRenderOption: 'FORMATTED_VALUE'
  });
  return response.result.values || [];
}

function replaceData(target, next) { target.splice(0, target.length, ...next); }

function syncModels(raw) {
  const masters = rowsAsObjects(raw.material);
  const inventories = rowsAsObjects(raw.inventory);
  const suppliersRaw = rowsAsObjects(raw.supplier);
  const purchasesRaw = rowsAsObjects(raw.purchase);
  const reservationsRaw = rowsAsObjects(raw.reservation);
  const inventoryByCode = new Map(inventories.map(row => [value(row, '자재코드'), row]));

  replaceData(suppliers, suppliersRaw.map(row => ({
    code: value(row, '거래처코드'), name: value(row, '거래처명'), type: value(row, '구분'), manager: value(row, '담당자'),
    phone: value(row, '연락처'), email: value(row, '이메일'), terms: value(row, '결제조건'), group: value(row, '주요품목군'),
    lead: number(value(row, '평균납기일')), min: number(value(row, '최소주문금액')), quality: number(value(row, '품질점수')),
    ontime: percent(value(row, '납기준수율')), status: value(row, '사용여부') || '사용', note: value(row, '비고'), sheetRow: row.__row
  })));

  replaceData(inventory, masters.map(row => {
    const snapshot = inventoryByCode.get(value(row, '자재코드')) || {};
    return {
      code: value(row, '자재코드'), name: value(row, '자재명'), cat: value(row, '분류'), spec: value(row, '규격'), unit: value(row, '단위'),
      safety: number(value(row, '안전재고')), price: number(value(row, '표준단가')), supplier: value(row, '기본거래처코드'),
      lead: number(value(row, '조달기간(일)')), moq: Math.max(1, number(value(row, '최소주문량'))), loc: value(row, '보관위치'),
      current: number(value(snapshot, '현재고')), onOrder: number(value(snapshot, '발주중수량')), reserved: number(value(snapshot, '예약수량')),
      daily: number(value(snapshot, '일평균사용량')), reorder: number(value(snapshot, '재주문점')), target: number(value(snapshot, '목표재고')),
      lastIn: asDate(value(snapshot, '최근입고일')) || '-', lastPrice: number(value(snapshot, '최근입고단가')), sheetRow: row.__row
    };
  }));

  replaceData(orders, purchasesRaw.map(row => ({
    no: value(row, '발주번호'), date: asDate(value(row, '발주일')), due: asDate(value(row, '예정입고일')),
    supplier: value(row, '거래처코드'), item: value(row, '자재코드'), qty: number(value(row, '발주수량')),
    received: number(value(row, '입고수량')), unitPrice: number(value(row, '계약단가')), status: value(row, '상태'),
    owner: value(row, '내부담당자'), approver: value(row, '승인자'), note: value(row, '비고'), sheetRow: row.__row
  })));

  replaceData(reservations, reservationsRaw.filter(row => value(row, '상태') !== '완료' && number(value(row, '잔여예약')) > 0).map(row => ({
    no: value(row, '예약번호'), request: asDate(value(row, '요청일')), need: asDate(value(row, '필요일')), wo: value(row, '작업지시번호'),
    item: value(row, '자재코드'), qty: number(value(row, '예약수량')), used: number(value(row, '사용수량')),
    dept: value(row, '요청부서'), note: value(row, '비고'), sheetRow: row.__row
  })));
  rebuildTasks();
}

function rebuildTasks() {
  const next = [];
  orders.filter(order => isLate(order)).forEach((order, index) => next.push({ id: `late-${index}`, kind: 'red', icon: 'clock', title: `${itemName(order.item)} 납기 확인`, sub: `${order.no} · ${supplierName(order.supplier)} · 예정일 ${fmtDate(order.due)}`, action: 'contact', ref: order.no, label: '거래처 확인', done: false }));
  orders.filter(order => order.status === '승인대기').forEach((order, index) => next.push({ id: `approve-${index}`, kind: 'violet', icon: 'clipboard', title: `${itemName(order.item)} 발주 승인`, sub: `${order.no} · ${won(order.qty * order.unitPrice)}`, action: 'approve', ref: order.no, label: '승인 검토', done: false }));
  const risk = inventory.map(inventoryCalc).filter(item => item.status === '발주필요');
  if (risk.length) next.push({ id: 'recommend', kind: 'blue', icon: 'wand', title: '부족 품목 추천발주 검토', sub: `${risk.length}개 품목 · MOQ 기준 추천수량 계산 완료`, action: 'bulk', ref: '', label: '추천안 열기', done: false });
  if (reservations.length) next.push({ id: 'reservation', kind: 'green', icon: 'calendar', title: `생산 예약 ${reservations.length}건 충족 여부 확인`, sub: '현재고와 예정입고를 반영해 자동 판정', action: 'reservation-view', ref: '', label: '영향 보기', done: false });
  replaceData(tasks, next);
}

async function loadSheetData() {
  if (!sheetConnection.connected || sheetConnection.loading) return;
  setBusy(true);
  setConnectionStatus('운영본을 불러오는 중입니다');
  try {
    const [material, supplier, purchase, reservation, inventory] = await Promise.all([
      getSheet(SHEET_NAME.MATERIAL, 'A:M'), getSheet(SHEET_NAME.SUPPLIER, 'A:N'), getSheet(SHEET_NAME.PURCHASE, 'A:P'),
      getSheet(SHEET_NAME.RESERVATION, 'A:L'), getSheet(SHEET_NAME.INVENTORY, 'A:Q')
    ]);
    syncModels({ material, supplier, purchase, reservation, inventory });
    window.renderAll?.();
    byId('sourceSheetLink').href = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
    byId('sourceSheetLink').target = '_blank';
    byId('syncStatus').textContent = `Google Sheet 동기화 · ${dateToday()}`;
    byId('connectBtn').classList.add('connected');
    setConnectionStatus(`연결됨 · ${dateToday()} 데이터`);
    setBusy(false, '연결됨 · 새로고침');
    window.toast?.('Google Sheet 동기화 완료', '운영본 최신 데이터로 화면을 갱신했습니다.');
  } catch (error) { setBusy(false); showSheetError(error); }
}

async function appendRow(sheet, row) {
  return gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: quoteRange(sheet), valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS', resource: { values: [row] } });
}
async function updateRange(sheet, range, values) {
  return gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: quoteRange(sheet, range), valueInputOption: 'USER_ENTERED', resource: { values } });
}
function newNumber(prefix, existing) {
  const stamp = dateToday().replaceAll('-', '').slice(2);
  const used = existing.filter(item => item.no?.startsWith(`${prefix}-${stamp}-`)).length + 1;
  return `${prefix}-${stamp}-${String(used).padStart(2, '0')}`;
}
function newMovementNumber() {
  const stamp = dateToday().replaceAll('-', '').slice(2);
  return `MV-${stamp}-${String(Date.now()).slice(-6)}`;
}
async function afterWrite(message, detail) { closeModal(); closeDrawer(); await loadSheetData(); toast(message, detail); }
function requireConnection() { if (sheetConnection.connected) return true; requestSheetConnection(); window.toast?.('먼저 Google 계정을 연결해 주세요', '연결 후 시트의 실제 데이터에 저장됩니다.'); return false; }

async function saveReservation() {
  const item = itemBy(byId('nrItem').value), qty = number(byId('nrQty').value), need = byId('nrNeed').value;
  if (!item || qty < 1 || !need) return window.toast?.('필수 값을 확인해 주세요', '자재, 예약 수량, 필요일은 필수입니다.');
  const no = newNumber('RSV', reservations);
  await appendRow(SHEET_NAME.RESERVATION, [no, dateToday(), need, byId('nrWo').value || 'WO-미지정', item.code, item.name, qty, 0, qty, '예약', byId('nrDept').value, byId('nrNote').value || '웹앱 등록']);
  await afterWrite('생산 예약을 등록했습니다', `${no} · ${item.name} ${num(qty)}${item.unit}`);
}
async function saveMovement() {
  const item = itemBy(byId('mvItem').value), qty = number(byId('mvQty').value), type = byId('mvType').value;
  if (!item || qty < 1) return window.toast?.('수량을 확인해 주세요');
  if (type === 'out' && qty > item.current) return window.toast?.('현재고보다 많이 출고할 수 없습니다', `현재고 ${num(item.current)}${item.unit}`);
  const movementType = type === 'in' ? '입고' : '출고', change = type === 'in' ? qty : -qty;
  await appendRow(SHEET_NAME.MOVEMENT, [newMovementNumber(), byId('mvDate').value || dateToday(), movementType, item.code, item.name, item.loc || '-', qty, change, '', byId('mvLot').value || '', '웹앱', byId('mvReason').value || '현장 수불 조정', '', item.price, '웹앱 등록']);
  await afterWrite('재고 이동을 기록했습니다', `${item.name} ${type === 'in' ? '+' : '-'}${num(qty)}${item.unit}`);
}
async function saveMaster() {
  const type = byId('nmType').value, code = byId('nmCode').value.trim(), name = byId('nmName').value.trim();
  if (!code || !name) return window.toast?.('코드와 이름은 필수입니다.');
  if (type === 'material') {
    if (inventory.some(item => item.code === code)) return window.toast?.('이미 존재하는 자재코드입니다.');
    await appendRow(SHEET_NAME.MATERIAL, [code, name, byId('nmGroup').value || '기타', byId('nmNote').value || '-', byId('nmUnit').value || '개', 0, 0, '', 0, 1, '미지정', '사용', '웹앱 등록']);
  } else {
    if (suppliers.some(supplier => supplier.code === code)) return window.toast?.('이미 존재하는 거래처코드입니다.');
    await appendRow(SHEET_NAME.SUPPLIER, [code, name, '구매처', byId('nmUnit').value || '-', '', '', '협의 필요', byId('nmGroup').value || '기타', 0, 0, 0, 0, '사용', byId('nmNote').value || '웹앱 등록']);
  }
  await afterWrite('기준정보를 등록했습니다', `${code} · ${name}`);
}
async function saveApproval() {
  const modalText = byId('modalSub').textContent;
  const target = orders.find(item => modalText.includes(item.no)) || orders.find(item => item.status === '승인대기');
  if (!target) return window.toast?.('승인할 발주를 찾지 못했습니다.');
  await updateRange(SHEET_NAME.PURCHASE, `M${target.sheetRow}`, [['발주완료']]);
  await afterWrite('발주 승인을 반영했습니다', `${target.no} 상태를 발주완료로 변경했습니다.`);
}
async function saveInbound() {
  const order = orders.find(item => item.no === byId('inPo').value), qty = number(byId('inQty').value);
  if (!order || qty < 1 || qty > Math.max(0, order.qty - order.received)) return window.toast?.('입고수량을 확인해 주세요.');
  const item = itemBy(order.item), received = order.received + qty, remaining = order.qty - received, status = remaining === 0 ? '입고완료' : '부분입고';
  await updateRange(SHEET_NAME.PURCHASE, `I${order.sheetRow}:M${order.sheetRow}`, [[received, remaining, order.unitPrice, order.qty * order.unitPrice, status]]);
  await appendRow(SHEET_NAME.MOVEMENT, [newMovementNumber(), byId('inDate').value || dateToday(), '입고', item.code, item.name, item.loc || '-', qty, qty, order.no, byId('inLot').value || '', '웹앱', '발주 입고 처리', '', order.unitPrice, '웹앱 등록']);
  await afterWrite('입고를 반영했습니다', `${order.no} · ${item.name} ${num(qty)}${item.unit}`);
}
async function saveDelivery() {
  const modalText = byId('drawerTitle').textContent;
  const order = orders.find(item => byId('drawerBody').textContent.includes(item.no));
  const due = byId('promiseDate').value;
  if (!order || !due) return window.toast?.('납기일을 확인해 주세요.');
  await updateRange(SHEET_NAME.PURCHASE, `C${order.sheetRow}:P${order.sheetRow}`, [[due, order.supplier, supplierName(order.supplier), order.item, itemName(order.item), order.qty, order.received, order.qty - order.received, order.unitPrice, order.qty * order.unitPrice, order.status, order.owner, order.approver, `확정 입고 ${due}`]]);
  await afterWrite('확정 납기일을 반영했습니다', `${order.no} · ${due}`);
}
async function saveBulkOrders() {
  const selected = [...document.querySelectorAll('.bulk-check:checked')];
  if (!selected.length) return window.toast?.('품목을 선택해 주세요.');
  const stamp = dateToday().replaceAll('-', '').slice(2), start = orders.filter(order => order.no.startsWith(`PO-${stamp}-`)).length;
  for (let index = 0; index < selected.length; index += 1) {
    const item = itemBy(selected[index].value), qty = Math.max(item.moq, number(document.querySelector(`.bulk-qty[data-code="${item.code}"]`).value));
    const no = `PO-${stamp}-${String(start + index + 1).padStart(2, '0')}`;
    const due = addDays(dateToday(), item.lead);
    await appendRow(SHEET_NAME.PURCHASE, [no, dateToday(), due, item.supplier, supplierName(item.supplier), item.code, item.name, qty, 0, qty, item.price, qty * item.price, '발주완료', '웹앱', '', '시스템 추천 발주']);
  }
  await afterWrite('추천 발주를 생성했습니다', `${selected.length}개 품목을 발주기록에 추가했습니다.`);
}

document.addEventListener('DOMContentLoaded', () => {
  byId('sourceSheetLink').href = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
  byId('sourceSheetLink').target = '_blank';
  byId('connectBtn').addEventListener('click', requestSheetConnection);
  document.addEventListener('click', async event => {
    const id = event.target.closest('button')?.id;
    const saveActions = { saveReservation, saveMovement, saveMaster, approvePo: saveApproval, saveInbound, confirmDelivery: saveDelivery, createBulk: saveBulkOrders };
    if (id === 'refreshBtn') { event.preventDefault(); event.stopImmediatePropagation(); if (sheetConnection.connected) await loadSheetData(); else requestSheetConnection(); return; }
    if (!saveActions[id]) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!requireConnection()) return;
    try { await saveActions[id](); } catch (error) { showSheetError(error); }
  }, true);
});

window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;
window.refreshSheetData = loadSheetData;
