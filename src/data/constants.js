// src/data/constants.js

export const SCHOOL_NAME    = 'Спеціалізована школа I–III ступенів № 313';
export const SCHOOL_NAME_FULL = 'з поглибленим вивченням інформаційних технологій';
export const CURRENT_YEAR   = '2026–2027';

export const ALL_CLASSES = [];
for (let grade = 1; grade <= 12; grade++) {
  for (const letter of ['А', 'Б', 'В']) {
    ALL_CLASSES.push(`${grade}-${letter}`);
  }
}

export const SEMESTERS = [
  { id: 'sem1', name: 'І півріччя' },
  { id: 'sem2', name: 'ІІ півріччя' },
  { id: 'summer', name: 'Літні канікули' },
];

export const ATTENDANCE_MARKS = {
  present: { label: 'П',  color: 'green', name: 'Присутній' },
  absent:  { label: 'н',  color: 'red',   name: 'Відсутній' },
  sick:    { label: 'хв', color: 'amber', name: 'Хворий' },
};

export const GURTOK_COLORS = ['#0057B7', '#1D9E75', '#534AB7', '#D97706', '#DC2626', '#0891B2'];

export const WEEKDAYS = [
  { id: 1, short: 'Пн', name: 'Понеділок' },
  { id: 2, short: 'Вт', name: 'Вівторок' },
  { id: 3, short: 'Ср', name: 'Середа' },
  { id: 4, short: 'Чт', name: 'Четвер' },
  { id: 5, short: 'Пт', name: "П'ятниця" },
  { id: 6, short: 'Сб', name: 'Субота' },
  { id: 0, short: 'Нд', name: 'Неділя' },
];

export const MONTH_NAMES = [
  'Січень','Лютий','Березень','Квітень','Травень','Червень',
  'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень',
];

