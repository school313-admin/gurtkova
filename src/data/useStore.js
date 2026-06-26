// src/data/useStore.js
import { useState, useEffect, useCallback } from 'react';
import { CURRENT_YEAR } from './constants';
import {
  fetchAll,
  apiSaveGurtok, apiUpdateGurtok, apiDeleteGurtok,
  apiSaveMember, apiUpdateMember, apiDeleteMember,
  apiSaveKtp, apiUpdateKtp, apiDeleteKtp,
  apiSaveLesson, apiUpdateLesson, apiDeleteLesson,
  apiSaveAttendance,
  apiSaveLeader, apiUpdateLeader, apiDeleteLeader,
  apiSaveSubstitution, apiDeleteSubstitution,
  apiSaveHoliday, apiUpdateHoliday, apiUpsertSeasonHoliday, apiDeleteHoliday, apiCleanupHolidays,
  apiSyncLessonsFromKtp,
  apiUpdateSetting,
  apiSaveSchoolYear, apiUpdateSchoolYear, apiSetActiveYear, apiRolloverYear,
  apiArchiveYear,
} from './api';

function defaultState() {
  return {
    gurtky:       [],
    members:      [],
    ktp:          [],
    lessons:      [],
    attendance:   [],
    leaders:      [],
    loginLog:     [],
    substitutions: [],
    holidays:     [],
    schoolYears:  [],
    archive:      [],
    adminPassword: '1221',
    currentYear:   CURRENT_YEAR,
    schoolSettings: {
      yearStart: '2026-09-01',
      yearEnd:   '2027-08-31',
      sem1End:   '2026-12-30',
      sem2End:   '2027-05-31',
    },
  };
}

export function useStore() {
  const [state,   setState]   = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const data = await fetchAll();

      const schoolYears = data.schoolYears || [];
      const currentYear = data.settings?.currentYear || CURRENT_YEAR;
      const activeYearRow = schoolYears.find(y => y.year === currentYear);

      setState(prev => ({
        ...prev,
        gurtky:        data.gurtky      || [],
        members:       data.members     || [],
        ktp:           data.ktp         || [],
        lessons:       data.lessons     || [],
        attendance:    data.attendance  || [],
        leaders:       data.leaders     || [],
        loginLog:      data.loginLog    || [],
        substitutions: data.substitutions || [],
        holidays:      data.holidays    || [],
        schoolYears:   schoolYears,
        archive:       data.archive     || [],
        adminPassword: String(data.settings?.adminPassword || '1221'),
        currentYear:   currentYear,
        schoolSettings: {
          yearStart: activeYearRow?.yearStart || '2026-09-01',
          yearEnd:   activeYearRow?.yearEnd   || '2027-08-31',
          sem1End:   activeYearRow?.sem1End   || '2026-12-30',
          sem2End:   activeYearRow?.sem2End   || '2027-05-31',
        },
      }));
    } catch(err) {
      setError('Не вдалось завантажити дані: ' + err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateLocal = (fn) => setState(prev => ({ ...prev, ...fn(prev) }));

  // ===== ГУРТКИ =====
  const addGurtok = async (data) => {
    setSyncing(true);
    try {
      const result = await apiSaveGurtok(data);
      updateLocal(s => ({ gurtky: [...s.gurtky, { ...data, id: result.id, createdAt: result.createdAt }] }));
      return result;
    } finally { setSyncing(false); }
  };

  const editGurtok = async (id, data) => {
    setSyncing(true);
    try {
      await apiUpdateGurtok(id, data);
      updateLocal(s => ({ gurtky: s.gurtky.map(g => g.id === id ? { ...g, ...data } : g) }));
    } finally { setSyncing(false); }
  };

  const removeGurtok = async (id) => {
    setSyncing(true);
    try {
      await apiDeleteGurtok(id);
      updateLocal(s => ({
        gurtky:     s.gurtky.filter(g => g.id !== id),
        members:    s.members.filter(m => m.gurtokId !== id),
        ktp:        s.ktp.filter(k => k.gurtokId !== id),
        lessons:    s.lessons.filter(l => l.gurtokId !== id),
        attendance: s.attendance.filter(a => a.gurtokId !== id),
      }));
    } finally { setSyncing(false); }
  };

  // ===== ЧЛЕНИ ГУРТКА =====
  const addMember = async (data) => {
    setSyncing(true);
    try {
      const result = await apiSaveMember(data);
      updateLocal(s => ({ members: [...s.members, { ...data, id: result.id, createdAt: result.createdAt }] }));
      return result;
    } finally { setSyncing(false); }
  };

  const editMember = async (id, data) => {
    setSyncing(true);
    try {
      await apiUpdateMember(id, data);
      updateLocal(s => ({ members: s.members.map(m => m.id === id ? { ...m, ...data } : m) }));
    } finally { setSyncing(false); }
  };

  const removeMember = async (id) => {
    setSyncing(true);
    try {
      await apiDeleteMember(id);
      updateLocal(s => ({ members: s.members.filter(m => m.id !== id) }));
    } finally { setSyncing(false); }
  };

  // ===== КТП =====
  const addKtp = async (data) => {
    setSyncing(true);
    try {
      const result = await apiSaveKtp(data);
      updateLocal(s => ({ ktp: [...s.ktp, { ...data, id: result.id }] }));
      return result;
    } finally { setSyncing(false); }
  };

  const editKtp = async (id, data) => {
    setSyncing(true);
    try {
      await apiUpdateKtp(id, data);
      updateLocal(s => ({ ktp: s.ktp.map(k => k.id === id ? { ...k, ...data } : k) }));
    } finally { setSyncing(false); }
  };

  const removeKtp = async (id) => {
    setSyncing(true);
    try {
      await apiDeleteKtp(id);
      updateLocal(s => ({ ktp: s.ktp.filter(k => k.id !== id) }));
    } finally { setSyncing(false); }
  };

  // Масовий імпорт з Excel: оновлює існуючі теми (за семестром+назвою), додає нові
  const importKtpBatch = async (gurtokId, importedTopics) => {
    setSyncing(true);
    try {
      const existing = state.ktp.filter(k => k.gurtokId === gurtokId);
      let orderCounters = { sem1: 0, sem2: 0, summer: 0 };
      existing.forEach(k => {
        orderCounters[k.semester] = Math.max(orderCounters[k.semester] || 0, (k.order||0) + 1);
      });

      const results = { updated: 0, added: 0 };

      for (const item of importedTopics) {
        const match = existing.find(k =>
          k.semester === item.semester &&
          k.topic.trim().toLowerCase() === item.topic.trim().toLowerCase()
        );

        if (match) {
          await apiUpdateKtp(match.id, item);
          updateLocal(s => ({ ktp: s.ktp.map(k => k.id === match.id ? { ...k, ...item } : k) }));
          results.updated++;
        } else {
          const order = orderCounters[item.semester]++;
          const result = await apiSaveKtp({ ...item, gurtokId, order });
          updateLocal(s => ({ ktp: [...s.ktp, { ...item, gurtokId, order, id: result.id }] }));
          results.added++;
        }
      }
      return results;
    } finally { setSyncing(false); }
  };

  // ===== ЗАНЯТТЯ (ЖУРНАЛ) =====
  const addLesson = async (data) => {
    setSyncing(true);
    try {
      const result = await apiSaveLesson(data);
      updateLocal(s => ({ lessons: [...s.lessons, { ...data, id: result.id }] }));
      return result;
    } finally { setSyncing(false); }
  };

  const editLesson = async (id, data) => {
    setSyncing(true);
    try {
      await apiUpdateLesson(id, data);
      updateLocal(s => ({ lessons: s.lessons.map(l => l.id === id ? { ...l, ...data } : l) }));
    } finally { setSyncing(false); }
  };

  const removeLesson = async (id) => {
    setSyncing(true);
    try {
      await apiDeleteLesson(id);
      updateLocal(s => ({
        lessons:    s.lessons.filter(l => l.id !== id),
        attendance: s.attendance.filter(a => a.lessonId !== id),
      }));
    } finally { setSyncing(false); }
  };

  // ===== ВІДВІДУВАНІСТЬ =====
  // marks: { memberId: 'present'|'absent'|'sick' }
  const saveAttendance = async (gurtokId, lessonId, date, marks) => {
    setSyncing(true);
    try {
      await apiSaveAttendance({ gurtokId, lessonId, date, marks });
      updateLocal(s => {
        // Видаляємо старі записи для цього заняття і додаємо нові
        const filtered = s.attendance.filter(a => a.lessonId !== lessonId);
        const newRecords = Object.entries(marks).map(([memberId, mark]) => ({
          gurtokId, lessonId, date, memberId, mark,
        }));
        return { attendance: [...filtered, ...newRecords] };
      });
    } finally { setSyncing(false); }
  };

  // ===== КЕРІВНИКИ (АДМІН) =====
  const addLeader = async (data) => {
    setSyncing(true);
    try {
      const result = await apiSaveLeader(data);
      updateLocal(s => ({ leaders: [...s.leaders, { ...data, id: result.id }] }));
      return result;
    } finally { setSyncing(false); }
  };

  const editLeader = async (id, data) => {
    setSyncing(true);
    try {
      await apiUpdateLeader(id, data);
      updateLocal(s => ({ leaders: s.leaders.map(l => l.id === id ? { ...l, ...data } : l) }));
    } finally { setSyncing(false); }
  };

  const removeLeader = async (id) => {
    setSyncing(true);
    try {
      await apiDeleteLeader(id);
      updateLocal(s => ({ leaders: s.leaders.filter(l => l.id !== id) }));
    } finally { setSyncing(false); }
  };

  // ===== ЗАМІНИ ВЧИТЕЛЯ (АДМІН) =====
  const addSubstitution = async (data) => {
    setSyncing(true);
    try {
      const result = await apiSaveSubstitution(data);
      updateLocal(s => {
        // якщо заміна на цю дату й гурток вже була — оновлюємо, інакше додаємо
        const existing = s.substitutions.find(sub => sub.gurtokId === data.gurtokId && sub.date === data.date);
        if (existing) {
          return { substitutions: s.substitutions.map(sub => sub === existing ? { ...sub, ...data, id: result.id } : sub) };
        }
        return { substitutions: [...s.substitutions, { ...data, id: result.id, createdAt: result.createdAt }] };
      });
      return result;
    } finally { setSyncing(false); }
  };

  const removeSubstitution = async (id) => {
    setSyncing(true);
    try {
      await apiDeleteSubstitution(id);
      updateLocal(s => ({ substitutions: s.substitutions.filter(sub => sub.id !== id) }));
    } finally { setSyncing(false); }
  };

  // ===== ПАРОЛЬ АДМІНА =====
  const setAdminPassword = async (pwd) => {
    updateLocal(() => ({ adminPassword: pwd }));
    await apiUpdateSetting('adminPassword', pwd);
  };

  // ===== КАНІКУЛИ (єдиний шкільний календар) =====
  const addHoliday = async (data) => {
    setSyncing(true);
    try {
      const result = await apiSaveHoliday(data);
      updateLocal(s => ({ holidays: [...s.holidays, { ...data, id: result.id }] }));
      return result;
    } finally { setSyncing(false); }
  };

  const removeHoliday = async (id) => {
    setSyncing(true);
    try {
      await apiDeleteHoliday(id);
      updateLocal(s => ({ holidays: s.holidays.filter(h => h.id !== id) }));
    } finally { setSyncing(false); }
  };

  // Увімкнути/вимкнути канікули без видалення запису (для довільних канікул).
  const toggleHoliday = async (id, enabled) => {
    setSyncing(true);
    try {
      await apiUpdateHoliday(id, { enabled });
      updateLocal(s => ({ holidays: s.holidays.map(h => h.id === id ? { ...h, enabled } : h) }));
    } finally { setSyncing(false); }
  };

  // Створює/оновлює сезонний (типізований) період канікул поточного року:
  // один запис на тип (autumn/winter/spring/summer), без дублювання при повторному збереженні.
  const setSeasonHoliday = async ({ type, name, startDate, endDate, enabled }) => {
    setSyncing(true);
    try {
      const result = await apiUpsertSeasonHoliday({ year: state.currentYear, type, name, startDate, endDate, enabled });
      await loadData(true); // простіше — щоб отримати правильний id (новий або існуючий); тихо, без LoadingScreen
      return result;
    } finally { setSyncing(false); }
  };

  // Прибирає зіпсовані/порожні/дублікатні рядки канікул на сервері, тоді перезавантажує дані.
  const cleanupHolidaysData = async () => {
    setSyncing(true);
    try {
      const result = await apiCleanupHolidays();
      await loadData(true);
      return result;
    } finally { setSyncing(false); }
  };
  // Оновлює дати (yearStart/yearEnd/sem1End/sem2End) для активного навчального року.
  // ===== НАЛАШТУВАННЯ НАВЧАЛЬНОГО РОКУ (АДМІН) =====
  const setSchoolSetting = async (key, value) => {
    updateLocal(s => ({ schoolSettings: { ...s.schoolSettings, [key]: value } }));
    const activeYearRow = state.schoolYears.find(y => y.year === state.currentYear);
    if (activeYearRow) {
      await apiUpdateSchoolYear(activeYearRow.id, { [key]: value });
      updateLocal(s => ({
        schoolYears: s.schoolYears.map(y => y.id === activeYearRow.id ? { ...y, [key]: value } : y),
      }));
    }
  };

  // ===== НАВЧАЛЬНІ РОКИ =====
  // Перемикання активного року в інтерфейсі (вибір, який рік зараз переглядається/редагується).
  const switchYear = async (year) => {
    setSyncing(true);
    try {
      await apiSetActiveYear(year);
      const yearRow = state.schoolYears.find(y => y.year === year);
      updateLocal(() => ({
        currentYear: year,
        schoolSettings: {
          yearStart: yearRow?.yearStart || '',
          yearEnd:   yearRow?.yearEnd   || '',
          sem1End:   yearRow?.sem1End   || '',
          sem2End:   yearRow?.sem2End   || '',
        },
      }));
    } finally { setSyncing(false); }
  };

  // Перехід на новий навчальний рік: створює "чистий" рік без жодних даних.
  // dates: { yearStart, yearEnd, sem1End, sem2End }
  const rolloverToNewYear = async (toYear, dates) => {
    setSyncing(true);
    try {
      const result = await apiRolloverYear({ toYear, ...dates });
      if (result.ok) {
        await loadData(true);
        await switchYear(toYear);
      }
      return result;
    } finally { setSyncing(false); }
  };

  // ===== АРХІВ =====
  // Архівує поточний рік: приймає вже згенеровані PDF-файли (base64) з фронтенду
  // (jsPDF працює лише в браузері), зберігає їх у Drive через бекенд і позначає рік архівним.
  const archiveCurrentYear = async (files) => {
    setSyncing(true);
    try {
      const result = await apiArchiveYear(state.currentYear, files);
      if (result.ok) await loadData(true);
      return result;
    } finally { setSyncing(false); }
  };

  // ===== СИНХРОНІЗАЦІЯ ЗАНЯТЬ З КТП =====
  // items: [{ date, topic, duration }]
  const syncLessonsFromKtp = async (gurtokId, items) => {
    setSyncing(true);
    try {
      const result = await apiSyncLessonsFromKtp(gurtokId, items);
      await loadData(true); // простіше перезавантажити, бо генеруються нові id на сервері; тихо
      return result;
    } finally { setSyncing(false); }
  };

  return {
    state, loading, error, syncing,
    reload: loadData,
    addGurtok, editGurtok, removeGurtok,
    addMember, editMember, removeMember,
    addKtp, editKtp, removeKtp, importKtpBatch,
    addLesson, editLesson, removeLesson,
    saveAttendance,
    addLeader, editLeader, removeLeader,
    addSubstitution, removeSubstitution,
    addHoliday, removeHoliday, setSeasonHoliday, toggleHoliday, cleanupHolidaysData,
    setSchoolSetting,
    syncLessonsFromKtp,
    setAdminPassword,
    switchYear, rolloverToNewYear, archiveCurrentYear,
  };
}
