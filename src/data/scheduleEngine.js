// src/data/scheduleEngine.js
// Автоматична генерація дат занять за розкладом гуртка, з урахуванням канікул,
// та зіставлення тем КТП з конкретними датами.

import { WEEKDAYS } from './constants';

// Парсимо рядок типу "Пн, Ср" -> [1, 3]
export function parseWeekdays(daysStr) {
  if (!daysStr) return [];
  const tokens = String(daysStr).split(/[,;]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
  const result = [];
  tokens.forEach(t => {
    // Точне зіставлення за першими 2 літерами скорочення (Пн, Вт, Ср, Чт, Пт, Сб, Нд)
    const match = WEEKDAYS.find(wd => wd.short.toLowerCase() === t.slice(0, 2));
    if (match && !result.includes(match.id)) result.push(match.id);
  });
  return result;
}

function toDate(str) {
  // str у форматі YYYY-MM-DD
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isInHolidays(dateStr, holidays, year) {
  return holidays.some(h =>
    (h.enabled !== false) &&
    (!h.year || h.year === year) &&
    dateStr >= h.startDate && dateStr <= h.endDate
  );
}

// Генерує всі дати занять гуртка у межах навчального року, мінус канікули
// settings: { yearStart, yearEnd } (school-wide), holidays: [{startDate, endDate, name, year}]
export function generateScheduleDates(gurtok, schoolSettings, holidays = []) {
  if (!gurtok.days || !schoolSettings?.yearStart || !schoolSettings?.yearEnd) return [];

  const weekdayIds = parseWeekdays(gurtok.days);
  if (weekdayIds.length === 0) return [];

  const start = toDate(schoolSettings.yearStart);
  const end   = toDate(schoolSettings.yearEnd);
  const dates = [];

  const cur = new Date(start);
  while (cur <= end) {
    if (weekdayIds.includes(cur.getDay())) {
      const dateStr = dateToStr(cur);
      if (!isInHolidays(dateStr, holidays, gurtok.year)) {
        dates.push(dateStr);
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Визначає до якого семестру належить дата (за межами семестрів settings)
export function getSemesterForDate(dateStr, schoolSettings) {
  if (!schoolSettings) return 'sem1';
  if (schoolSettings.sem1End && dateStr <= schoolSettings.sem1End) return 'sem1';
  if (schoolSettings.sem2End && dateStr <= schoolSettings.sem2End) return 'sem2';
  return 'summer';
}

// Зіставляє теми КТП з датами занять: послідовно, у порядку тем кожного семестру.
// Повертає масив { date, topicId, topic, isExtra } — isExtra = true якщо дат більше ніж тем
export function mapTopicsToDates(dates, ktpTopics, schoolSettings) {
  // Групуємо дати по семестру
  const bySemester = { sem1: [], sem2: [], summer: [] };
  dates.forEach(d => {
    const sem = getSemesterForDate(d, schoolSettings);
    bySemester[sem].push(d);
  });

  const result = [];
  ['sem1', 'sem2', 'summer'].forEach(sem => {
    const topics = ktpTopics.filter(t => t.semester === sem).sort((a,b) => (a.order||0) - (b.order||0));
    const semDates = bySemester[sem];

    semDates.forEach((date, i) => {
      const topic = topics[i];
      result.push({
        date,
        semester: sem,
        topicId: topic?.id || null,
        topic: topic?.topic || '',
        isExtra: !topic, // дата є, але тема для неї закінчилась
      });
    });
  });

  return result.sort((a,b) => a.date.localeCompare(b.date));
}
