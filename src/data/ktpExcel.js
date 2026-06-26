// src/data/ktpExcel.js
// Імпорт та експорт КТП у формат Excel

import * as XLSX from 'xlsx';
import { SEMESTERS } from './constants';

const SEMESTER_BY_NAME = {
  'І півріччя': 'sem1', '1 півріччя': 'sem1', '1 семестр': 'sem1', 'I семестр': 'sem1',
  'ІІ півріччя': 'sem2', '2 півріччя': 'sem2', '2 семестр': 'sem2', 'II семестр': 'sem2',
  'Літні канікули': 'summer', 'літо': 'summer', 'канікули': 'summer',
};

const HEADERS = ['Семестр', '№ теми', 'Тема розділу програми', 'Теорія (год)', 'Практика (год)', 'Календарні строки'];

// ---- Завантажити порожній шаблон ----
export function downloadKtpTemplate(gurtokName = '') {
  const wb = XLSX.utils.book_new();
  const rows = [
    HEADERS,
    ['І півріччя', 1, 'Приклад: Вступне заняття', 2, 0, 'Вересень'],
    ['І півріччя', 2, '', '', '', ''],
    ['ІІ півріччя', 1, '', '', '', ''],
    ['Літні канікули', 1, '', '', '', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 16 }, { wch: 8 }, { wch: 45 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'КТП');

  const fileName = `КТП_шаблон${gurtokName ? '_' + sanitizeFileName(gurtokName) : ''}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ---- Експортувати поточне КТП гуртка ----
export function exportKtpToExcel(gurtokName, topics) {
  const wb = XLSX.utils.book_new();
  const rows = [HEADERS];

  ['sem1', 'sem2', 'summer'].forEach(semId => {
    const semName = SEMESTERS.find(s => s.id === semId)?.name || semId;
    const semTopics = topics.filter(t => t.semester === semId).sort((a,b) => (a.order||0) - (b.order||0));
    semTopics.forEach((t, i) => {
      rows.push([semName, i + 1, t.topic, t.theoryHours || 0, t.practiceHours || 0, t.dates || '']);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 16 }, { wch: 8 }, { wch: 45 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'КТП');

  XLSX.writeFile(wb, `КТП_${sanitizeFileName(gurtokName)}.xlsx`);
}

// ---- Розпарсити завантажений Excel-файл ----
// Повертає { topics: [...], errors: [...] }
export async function parseKtpExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const topics = [];
  const errors = [];

  // Пропускаємо рядок заголовків (шукаємо перший рядок з даними)
  let startRow = 0;
  for (let i = 0; i < rows.length; i++) {
    const cell = String(rows[i][0] || '').trim().toLowerCase();
    if (cell === 'семестр') { startRow = i + 1; break; }
  }

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    const semesterRaw = String(row[0] || '').trim();
    const topic        = String(row[2] || '').trim();

    if (!semesterRaw && !topic) continue; // порожній рядок — пропускаємо

    if (!topic) {
      errors.push(`Рядок ${i + 1}: відсутня назва теми`);
      continue;
    }

    const semester = SEMESTER_BY_NAME[semesterRaw] || (['sem1','sem2','summer'].includes(semesterRaw) ? semesterRaw : null);
    if (!semester) {
      errors.push(`Рядок ${i + 1}: невідомий семестр "${semesterRaw}". Використовуйте: І півріччя, ІІ півріччя, Літні канікули`);
      continue;
    }

    const theoryHours   = parseInt(row[3]) || 0;
    const practiceHours = parseInt(row[4]) || 0;
    const dates          = String(row[5] || '').trim();

    topics.push({ semester, topic, theoryHours, practiceHours, dates });
  }

  return { topics, errors };
}

function sanitizeFileName(name) {
  return String(name).replace(/[^а-яіїєА-ЯІЇЄa-zA-Z0-9]/g, '_');
}
