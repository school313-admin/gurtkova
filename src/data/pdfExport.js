// src/data/pdfExport.js
// Генерація повного журналу гурткової роботи у PDF за зразком МОН
// Використовує jsPDF з кастомним шрифтом PT Sans (підтримка кирилиці)

import { jsPDF } from 'jspdf';
import { PTSansRegular } from './fontRegular';
import { PTSansBold } from './fontBold';

function registerCyrillicFont(doc) {
  doc.addFileToVFS('PTSans-Regular.ttf', PTSansRegular);
  doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
  doc.addFileToVFS('PTSans-Bold.ttf', PTSansBold);
  doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold');
  doc.setFont('PTSans', 'normal');
}

const SEMESTER_LABELS = { sem1: 'І півріччя', sem2: 'ІІ півріччя', summer: 'Літні канікули' };
const MARK_LABELS = { present: 'П', absent: 'н', sick: 'хв' };

export async function buildGurtokPdf(gurtokId, state) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  registerCyrillicFont(doc);

  const gurtok  = state.gurtky.find(g => g.id === gurtokId);
  const leader  = state.leaders.find(l => l.id === gurtok?.leaderId);
  const members = state.members.filter(m => m.gurtokId === gurtokId && m.status !== 'left');
  const lessons = state.lessons.filter(l => l.gurtokId === gurtokId).sort((a,b) => new Date(a.date) - new Date(b.date));
  const ktp     = state.ktp.filter(k => k.gurtokId === gurtokId);
  const attendance = state.attendance.filter(a => a.gurtokId === gurtokId);

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const addTitle = (text, size = 14) => {
    doc.setFontSize(size);
    doc.setFont('PTSans', 'bold');
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += size * 0.6;
  };

  const addText = (text, size = 10, align = 'left', x = margin) => {
    doc.setFontSize(size);
    doc.setFont('PTSans', 'normal');
    doc.text(text, align === 'center' ? pageWidth / 2 : x, y, { align });
    y += size * 0.55;
  };

  // ========== ТИТУЛЬНА СТОРІНКА ==========
  y = 30;
  addText('МІНІСТЕРСТВО ОСВІТИ І НАУКИ УКРАЇНИ', 11, 'center');
  y += 20;
  addTitle('ЖУРНАЛ', 20);
  y += 4;
  addTitle('ПЛАНУВАННЯ ТА ОБЛІКУ РОБОТИ', 14);
  y += 14;

  doc.setLineWidth(0.3);
  doc.line(pageWidth/2 - 50, y, pageWidth/2 + 50, y);
  y += 6;
  addText(gurtok?.name || '', 13, 'center');
  doc.setFontSize(8);
  addText('(назва гуртка)', 8, 'center');
  y += 10;

  doc.line(pageWidth/2 - 50, y, pageWidth/2 + 50, y);
  y += 6;
  addText('Спеціалізована школа I–III ступенів № 313', 11, 'center');
  doc.setFontSize(8);
  addText('(назва установи)', 8, 'center');
  y += 10;

  doc.line(pageWidth/2 - 50, y, pageWidth/2 + 50, y);
  y += 6;
  addText('м. Київ', 11, 'center');
  doc.setFontSize(8);
  addText('(місто, район, область)', 8, 'center');
  y += 16;

  addText(`на ${gurtok?.year || '2026–2027'} навчальний рік`, 12, 'center');
  y += 18;

  addText(`Керівник гуртка: ${leader?.fullName || '________________________'}`, 11, 'center');

  // ========== СТОРІНКА: ЧЛЕНИ ГУРТКА ==========
  doc.addPage(); y = margin;
  addTitle('ЗАГАЛЬНІ ВІДОМОСТІ ПРО ЧЛЕНІВ ГУРТКА', 12);
  y += 6;

  const memberRows = members.map(m => [
    `${m.lastName} ${m.firstName}`,
    m.school || '',
    m.cls || '',
    m.parentWork || '',
    m.address || '',
  ]);
  drawTable(doc, y, margin, pageWidth - 2*margin,
    ["Прізвище, ім'я", 'Школа', 'Клас', "Місце роботи батьків, телефон", 'Домашня адреса'],
    memberRows, [42, 22, 16, 50, 'auto']
  );
  y = doc.lastTableY + 10;

  // ========== СТОРІНКА: КТП ==========
  ['sem1', 'sem2', 'summer'].forEach(sem => {
    const topics = ktp.filter(k => k.semester === sem);
    if (topics.length === 0) return;

    doc.addPage(); y = margin;
    addTitle('ПЛАН НАВЧАЛЬНО-ВИХОВНОЇ РОБОТИ ГУРТКА', 12);
    addText(SEMESTER_LABELS[sem], 11, 'center');
    y += 6;

    const rows = topics.map((t, i) => [
      String(i+1), t.topic, String(t.theoryHours||0), String(t.practiceHours||0), t.dates || ''
    ]);
    const totalT = topics.reduce((s,t)=>s+(parseInt(t.theoryHours)||0),0);
    const totalP = topics.reduce((s,t)=>s+(parseInt(t.practiceHours)||0),0);
    rows.push(['', 'Всього', String(totalT), String(totalP), '']);

    drawTable(doc, y, margin, pageWidth - 2*margin,
      ['№', 'Теми розділів програми', 'Теорія', 'Практика', 'Строки виконання'],
      rows, [10, 'auto', 18, 18, 30]
    );
  });

  // ========== ОБЛІК ВІДВІДУВАННЯ ==========
  if (lessons.length > 0 && members.length > 0) {
    doc.addPage(); y = margin;
    addTitle('ОБЛІК ВІДВІДУВАННЯ', 13);
    y += 6;

    const headers = ["Прізвище та ім'я", ...lessons.map(l => `${l.date.slice(8,10)}.${l.date.slice(5,7)}`)];
    const rows = members.map(m => {
      const marks = lessons.map(l => {
        const rec = attendance.find(a => a.lessonId === l.id && a.memberId === m.id);
        return rec ? MARK_LABELS[rec.mark] || '' : '';
      });
      return [`${m.lastName} ${m.firstName}`, ...marks];
    });

    const colWidths = [44, ...lessons.map(() => Math.max(8, (pageWidth - 2*margin - 44) / lessons.length))];
    drawTable(doc, y, margin, pageWidth - 2*margin, headers, rows, colWidths, 7.5);
  }

  // ========== ОБЛІК РОБОТИ ГУРТКА ==========
  if (lessons.length > 0) {
    doc.addPage(); y = margin;
    addTitle('ОБЛІК РОБОТИ ГУРТКА', 13);
    y += 6;

    const rows = lessons.map(l => [l.date, l.topic, `${l.duration} хв`, '']);
    drawTable(doc, y, margin, pageWidth - 2*margin,
      ['Дата', 'Короткий зміст заняття', 'Тривалість', 'Підпис керівника'],
      rows, [22, 'auto', 22, 30]
    );
  }

  // ========== ПРАКТИЧНА ДІЯЛЬНІСТЬ ==========
  const practicalLessons = lessons.filter(l => l.practicalWork);
  if (practicalLessons.length > 0) {
    doc.addPage(); y = margin;
    addTitle('РЕЗУЛЬТАТИ ПРАКТИЧНОЇ ДІЯЛЬНОСТІ', 12);
    addText('Виготовлення приладів, моделей, наочних посібників; тематика доповідей та рефератів', 9, 'center');
    y += 6;

    const rows = practicalLessons.map(l => [l.date, l.practicalWork]);
    drawTable(doc, y, margin, pageWidth - 2*margin, ['Дата', 'Опис'], rows, [22, 'auto']);
  }

  // Зберігаємо
  const fileName = `Журнал_${(gurtok?.name || 'гурток').replace(/[^а-яіїєА-ЯІЇЄa-zA-Z0-9]/g, '_')}.pdf`;
  return { doc, fileName, gurtokName: gurtok?.name || 'гурток' };
}

// ---- Завантажити один журнал напряму ----
export async function exportGurtokToPdf(gurtokId, state) {
  const { doc, fileName } = await buildGurtokPdf(gurtokId, state);
  doc.save(fileName);
}

// ---- Отримати PDF як blob (для прев'ю в модальному вікні) ----
export async function getGurtokPdfBlob(gurtokId, state) {
  const { doc, fileName, gurtokName } = await buildGurtokPdf(gurtokId, state);
  return { blob: doc.output('blob'), fileName, gurtokName };
}

// ---- Отримати PDF як base64 (для відправки на бекенд, наприклад при архівації) ----
export async function getGurtokPdfBase64(gurtokId, state) {
  const { doc, fileName, gurtokName } = await buildGurtokPdf(gurtokId, state);
  const base64 = doc.output('datauristring').split(',')[1];
  return { base64, fileName, gurtokName };
}

// ---- Масовий експорт кількох гуртків у .zip ----
export async function exportMultipleGurtkyToZip(gurtokIds, state, onProgress) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (let i = 0; i < gurtokIds.length; i++) {
    const { doc, fileName } = await buildGurtokPdf(gurtokIds[i], state);
    zip.file(fileName, doc.output('blob'));
    onProgress?.(i + 1, gurtokIds.length);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Журнали_гуртків_${new Date().toLocaleDateString('uk-UA').replace(/\./g,'-')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- Допоміжна функція для малювання таблиць ----
function drawTable(doc, startY, x, totalWidth, headers, rows, colWidthsSpec, fontSize = 9) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const rowHeight = fontSize * 0.6;

  const fixedTotal = colWidthsSpec.filter(w => w !== 'auto').reduce((a,b)=>a+b, 0);
  const autoCount   = colWidthsSpec.filter(w => w === 'auto').length;
  const autoWidth   = autoCount > 0 ? (totalWidth - fixedTotal) / autoCount : 0;
  const colWidths   = colWidthsSpec.map(w => w === 'auto' ? autoWidth : w);

  let y = startY;

  const drawRow = (cells, isHeader = false) => {
    if (y + rowHeight + 2 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    let cx = x;
    doc.setFontSize(fontSize);
    doc.setFont('PTSans', isHeader ? 'bold' : 'normal');
    if (isHeader) doc.setFillColor(240, 240, 240);

    cells.forEach((cell, i) => {
      const w = colWidths[i];
      if (isHeader) doc.rect(cx, y, w, rowHeight + 2, 'FD');
      else doc.rect(cx, y, w, rowHeight + 2, 'S');

      const text = doc.splitTextToSize(String(cell || ''), w - 2);
      doc.text(text[0] || '', cx + 1.5, y + rowHeight - 1);
      cx += w;
    });
    y += rowHeight + 2;
  };

  drawRow(headers, true);
  rows.forEach(row => drawRow(row));

  doc.lastTableY = y;
}
