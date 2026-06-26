// src/data/api.js
// Всі запити до Google Apps Script — GET з payload в URL (надійно при redirect)

const GAS_URL = import.meta.env.VITE_GAS_URL
  || 'https://script.google.com/macros/s/AKfycbyJBZ2wZZzK3K-FXVmvzDeVUfdM2qAjKi3Xp5bLTOQDG0SEIMTju9pXKIndau1bu3Hg/exec';

async function request(body) {
  const payload  = encodeURIComponent(JSON.stringify(body));
  const url      = `${GAS_URL}?payload=${payload}`;

  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await response.text();

  if (!text || text.trim() === '')
    throw new Error('Сервер повернув порожню відповідь');
  if (text.trim().startsWith('<'))
    throw new Error('Помилка авторизації GAS — перевір розгортання');

  let result;
  try { result = JSON.parse(text); }
  catch(e) { throw new Error('Невалідна відповідь: ' + text.slice(0, 150)); }

  if (!result.ok) throw new Error(result.error || 'Помилка сервера');
  return result;
}

export async function fetchAll() {
  return request({ action: 'getAll' });
}

// ---- Гуртки ----
export async function apiSaveGurtok(data) {
  return request({ action: 'saveGurtok', ...data });
}
export async function apiUpdateGurtok(id, data) {
  return request({ action: 'updateGurtok', id, ...data });
}
export async function apiDeleteGurtok(id) {
  return request({ action: 'deleteGurtok', id });
}

// ---- Члени гуртка ----
export async function apiSaveMember(data) {
  return request({ action: 'saveMember', ...data });
}
export async function apiUpdateMember(id, data) {
  return request({ action: 'updateMember', id, ...data });
}
export async function apiDeleteMember(id) {
  return request({ action: 'deleteMember', id });
}

// ---- КТП ----
export async function apiSaveKtp(data) {
  return request({ action: 'saveKtp', ...data });
}
export async function apiUpdateKtp(id, data) {
  return request({ action: 'updateKtp', id, ...data });
}
export async function apiDeleteKtp(id) {
  return request({ action: 'deleteKtp', id });
}

// ---- Заняття (журнал) ----
export async function apiSaveLesson(data) {
  return request({ action: 'saveLesson', ...data });
}
export async function apiUpdateLesson(id, data) {
  return request({ action: 'updateLesson', id, ...data });
}
export async function apiDeleteLesson(id) {
  return request({ action: 'deleteLesson', id });
}

// ---- Відвідуваність ----
export async function apiSaveAttendance(data) {
  return request({ action: 'saveAttendance', ...data });
}

// ---- Керівники (адмін) ----
export async function apiSaveLeader(data) {
  return request({ action: 'saveLeader', ...data });
}
export async function apiUpdateLeader(id, data) {
  return request({ action: 'updateLeader', id, ...data });
}
export async function apiDeleteLeader(id) {
  return request({ action: 'deleteLeader', id });
}

// ---- Заміни вчителя (тільки адмін) ----
export async function apiSaveSubstitution(data) {
  return request({ action: 'saveSubstitution', ...data });
}
export async function apiDeleteSubstitution(id) {
  return request({ action: 'deleteSubstitution', id });
}

// ---- Канікули (єдиний шкільний календар) ----
export async function apiSaveHoliday(data) {
  return request({ action: 'saveHoliday', ...data });
}
export async function apiUpdateHoliday(id, data) {
  return request({ action: 'updateHoliday', id, ...data });
}
export async function apiUpsertSeasonHoliday(data) {
  return request({ action: 'upsertSeasonHoliday', ...data });
}
export async function apiCleanupHolidays() {
  return request({ action: 'cleanupHolidays' });
}
export async function apiDeleteHoliday(id) {
  return request({ action: 'deleteHoliday', id });
}

// ---- Синхронізація занять з КТП за розкладом ----
export async function apiSyncLessonsFromKtp(gurtokId, items) {
  return request({ action: 'syncLessonsFromKtp', gurtokId, items });
}

// ---- Налаштування ----
export async function apiUpdateSetting(key, value) {
  return request({ action: 'updateSettings', key, value });
}

// ---- Навчальні роки ----
export async function apiSaveSchoolYear(data) {
  return request({ action: 'saveSchoolYear', ...data });
}
export async function apiUpdateSchoolYear(id, data) {
  return request({ action: 'updateSchoolYear', id, ...data });
}
export async function apiSetActiveYear(year) {
  return request({ action: 'setActiveYear', year });
}
export async function apiRolloverYear(data) {
  return request({ action: 'rolloverYear', ...data });
}

// ---- Архів ----
export async function apiArchiveYear(year, files) {
  return request({ action: 'archiveYear', year, files });
}

// ---- Авторизація ----
export async function apiLogin(login, password) {
  return request({ action: 'login', login, password });
}
