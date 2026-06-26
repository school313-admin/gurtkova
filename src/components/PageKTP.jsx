import { useState, useEffect, useRef } from 'react';
import { Btn, Card, Select, Modal, Confirm, Badge, Input } from './UI';
import { GurtokSelector, EmptyState } from './PageJournal';
import { SEMESTERS } from '../data/constants';

export default function PageKTP({ state, gurtok, myGurtky, onSelectGurtok, addKtp, editKtp, removeKtp, importKtpBatch, onModalChange }) {
  const [semester, setSemester]   = useState('sem1');
  const [showAdd, setShowAdd]     = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importResult, setImportResult] = useState(null); // {updated, added, errors}
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const openModal  = (fn) => { fn(); onModalChange?.(true); };
  const closeModal = (fn) => { fn(); onModalChange?.(false); };

  if (myGurtky.length === 0) return <EmptyState text="У вас ще немає гуртків" />;

  const activeGurtok = gurtok || myGurtky[0];
  const allTopics = state.ktp.filter(k => k.gurtokId === activeGurtok.id);
  const topics = allTopics
    .filter(k => k.semester === semester)
    .sort((a,b) => (a.order||0) - (b.order||0));

  const totalTheory   = topics.reduce((s,t) => s + (parseInt(t.theoryHours)||0), 0);
  const totalPractice = topics.reduce((s,t) => s + (parseInt(t.practiceHours)||0), 0);

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    openModal(() => {});
    try {
      const { parseKtpExcelFile } = await import('../data/ktpExcel');
      const { topics: parsed, errors } = await parseKtpExcelFile(file);
      if (parsed.length === 0) {
        setImportResult({ updated: 0, added: 0, errors: errors.length ? errors : ['У файлі не знайдено жодного коректного рядка'] });
      } else {
        const result = await importKtpBatch(activeGurtok.id, parsed);
        setImportResult({ ...result, errors });
      }
    } catch(err) {
      setImportResult({ updated: 0, added: 0, errors: ['Помилка читання файлу: ' + err.message] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fade-up">
      <GurtokSelector gurtky={myGurtky} active={activeGurtok} onSelect={onSelectGurtok} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, marginTop:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ fontSize:16, fontWeight:600 }}>КТП — {activeGurtok.name}</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Select value={semester} onChange={setSemester} style={{ width:160 }}>
            {SEMESTERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Btn variant="secondary" size="md" onClick={async () => { const { downloadKtpTemplate } = await import('../data/ktpExcel'); downloadKtpTemplate(activeGurtok.name); }}>
            <i className="ti ti-file-spreadsheet" /> Шаблон
          </Btn>
          <Btn variant="secondary" size="md" onClick={async () => { const { exportKtpToExcel } = await import('../data/ktpExcel'); exportKtpToExcel(activeGurtok.name, allTopics); }} disabled={allTopics.length === 0}>
            <i className="ti ti-file-export" /> Експорт
          </Btn>
          <Btn variant="secondary" size="md" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <i className="ti ti-file-import" /> Імпорт
          </Btn>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChosen} style={{ display:'none' }} />
          <Btn onClick={() => openModal(() => setShowAdd(true))}><i className="ti ti-plus" /> Додати тему</Btn>
        </div>
      </div>

      {topics.length === 0 ? (
        <EmptyState text="Тем ще не додано для цього періоду" />
      ) : (
        <Card>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  <th style={{ padding:'10px 14px', width:40, textAlign:'center', color:'var(--text3)', fontSize:12 }}>№</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', color:'var(--text3)', fontSize:12 }}>Тема розділу програми</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'var(--text3)', fontSize:12 }}>Теорія</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'var(--text3)', fontSize:12 }}>Практика</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', color:'var(--text3)', fontSize:12 }}>Строки</th>
                  <th style={{ padding:'10px 14px' }}></th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t, i) => (
                  <tr key={t.id} style={{ borderTop:'0.5px solid var(--border)' }}>
                    <td style={{ padding:'10px 14px', textAlign:'center', color:'var(--text3)' }}>{i+1}</td>
                    <td style={{ padding:'10px 14px', fontWeight:500 }}>{t.topic}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}><Badge color="blue">{t.theoryHours||0}</Badge></td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}><Badge color="green">{t.practiceHours||0}</Badge></td>
                    <td style={{ padding:'10px 14px', color:'var(--text2)' }}>{t.dates || '—'}</td>
                    <td style={{ padding:'10px 14px', whiteSpace:'nowrap' }}>
                      <button onClick={() => openModal(() => setEditing(t))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', marginRight:4 }}><i className="ti ti-edit" /></button>
                      <button onClick={() => openModal(() => setDeleteTarget(t))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}><i className="ti ti-trash" /></button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background:'var(--surface2)', fontWeight:600 }}>
                  <td colSpan={2} style={{ padding:'10px 14px' }}>Всього</td>
                  <td style={{ padding:'10px 14px', textAlign:'center' }}>{totalTheory}</td>
                  <td style={{ padding:'10px 14px', textAlign:'center' }}>{totalPractice}</td>
                  <td colSpan={2} style={{ padding:'10px 14px', color:'var(--text3)' }}>{totalTheory+totalPractice} год</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <KtpModal
        open={showAdd || !!editing}
        editing={editing}
        defaultSemester={semester}
        onClose={() => closeModal(() => { setShowAdd(false); setEditing(null); })}
        onSave={async (data) => {
          if (editing) await editKtp(editing.id, data);
          else await addKtp({ ...data, gurtokId: activeGurtok.id, order: topics.length });
          closeModal(() => { setShowAdd(false); setEditing(null); });
        }}
      />

      <Confirm
        open={!!deleteTarget}
        title="Видалити тему?"
        message={`Тема "${deleteTarget?.topic}" буде видалена з плану.`}
        onConfirm={async () => { await removeKtp(deleteTarget.id); closeModal(() => setDeleteTarget(null)); }}
        onCancel={() => closeModal(() => setDeleteTarget(null))}
      />

      <Modal open={!!importResult || importing} onClose={() => closeModal(() => setImportResult(null))} title="Імпорт КТП з Excel">
        {importing ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 0', justifyContent:'center', color:'var(--text2)' }}>
            <i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite', fontSize:18 }} /> Обробка файлу...
          </div>
        ) : importResult && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', gap:10 }}>
              {importResult.added > 0 && <Badge color="green">Додано: {importResult.added}</Badge>}
              {importResult.updated > 0 && <Badge color="blue">Оновлено: {importResult.updated}</Badge>}
              {importResult.added === 0 && importResult.updated === 0 && <Badge color="gray">Нічого не імпортовано</Badge>}
            </div>
            {importResult.errors?.length > 0 && (
              <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 14px', maxHeight:200, overflowY:'auto' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--danger)', marginBottom:6 }}>Пропущені рядки:</div>
                {importResult.errors.map((e, i) => <div key={i} style={{ fontSize:12, color:'var(--text2)', marginBottom:3 }}>{e}</div>)}
              </div>
            )}
            <Btn onClick={() => closeModal(() => setImportResult(null))}>Закрити</Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}

function KtpModal({ open, editing, defaultSemester, onClose, onSave }) {
  const [semester, setSemester]       = useState(editing?.semester || defaultSemester);
  const [topic, setTopic]             = useState(editing?.topic || '');
  const [theoryHours, setTheoryHours] = useState(editing?.theoryHours || 0);
  const [practiceHours, setPracticeHours] = useState(editing?.practiceHours || 0);
  const [dates, setDates]             = useState(editing?.dates || '');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (editing) {
      setSemester(editing.semester); setTopic(editing.topic);
      setTheoryHours(editing.theoryHours||0); setPracticeHours(editing.practiceHours||0);
      setDates(editing.dates||'');
    }
  }, [editing]);

  const reset = () => { setSemester(defaultSemester); setTopic(''); setTheoryHours(0); setPracticeHours(0); setDates(''); };

  const handleSave = async () => {
    if (!topic.trim()) return;
    setSaving(true);
    await onSave({ semester, topic: topic.trim(), theoryHours: parseInt(theoryHours)||0, practiceHours: parseInt(practiceHours)||0, dates: dates.trim() });
    reset();
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={editing ? 'Редагувати тему' : 'Нова тема КТП'}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Період</label>
          <Select value={semester} onChange={setSemester}>
            {SEMESTERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Тема розділу програми</label>
          <Input value={topic} onChange={setTopic} placeholder="Наприклад: Основи Python" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Теорія (год)</label>
            <Input type="number" value={theoryHours} onChange={setTheoryHours} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Практика (год)</label>
            <Input type="number" value={practiceHours} onChange={setPracticeHours} />
          </div>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Календарні строки</label>
          <Input value={dates} onChange={setDates} placeholder="Наприклад: Вересень" />
        </div>
        <Btn onClick={handleSave} disabled={saving || !topic.trim()} style={{ marginTop:4 }}>
          {saving ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Збереження...</> : <><i className="ti ti-check" /> Зберегти</>}
        </Btn>
      </div>
    </Modal>
  );
}
