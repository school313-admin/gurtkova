// src/components/PageJournal.jsx
// Об'єднана сторінка журналу: автоматичні дати за розкладом + матриця відвідуваності.
// Дати генеруються з днів тижня гуртка (заданих адміном) мінус канікули (єдиний шкільний календар).
// Теми занять підтягуються з КТП послідовно; вручну можна прив'язати іншу тему до конкретної дати.

import { useState, useEffect, useMemo, useRef } from 'react';
import { Btn, Card, Select, Modal, Confirm, Badge, Input, Textarea } from './UI';
import { ATTENDANCE_MARKS, MONTH_NAMES } from '../data/constants';
import { generateScheduleDates, mapTopicsToDates } from '../data/scheduleEngine';
import { formatSchedule } from './PageGurtky';


export default function PageJournal({ state, gurtok, myGurtky, onSelectGurtok, addLesson, editLesson, removeLesson, syncLessonsFromKtp, saveAttendance, onModalChange }) {
  const [editingLesson, setEditingLesson] = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [syncing, setSyncing]             = useState(false);
  const [activeMonth, setActiveMonth]     = useState(null);
  const [localMarks, setLocalMarks]       = useState({});
  const [dirty, setDirty]                 = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [view, setView]                   = useState('attendance'); // 'attendance' | 'topics'
  const [openPicker, setOpenPicker]       = useState(null); // {lessonId, memberId} | null

  const openModal  = (fn) => { fn(); onModalChange?.(true); };
  const closeModal = (fn) => { fn(); onModalChange?.(false); };

  if (myGurtky.length === 0) return <EmptyState text="У вас ще немає гуртків" />;

  const activeGurtok = gurtok || myGurtky[0];
  const members = state.members.filter(m => m.gurtokId === activeGurtok.id && m.status !== 'left');
  const leader  = state.leaders.find(l => l.id === activeGurtok.leaderId);

  const scheduleDates = useMemo(
    () => generateScheduleDates(activeGurtok, state.schoolSettings, state.holidays),
    [activeGurtok, state.schoolSettings, state.holidays]
  );

  const lessons = useMemo(
    () => state.lessons.filter(l => l.gurtokId === activeGurtok.id).sort((a,b) => a.date.localeCompare(b.date)),
    [state.lessons, activeGurtok.id]
  );

  const missingDatesCount = scheduleDates.filter(d => !lessons.some(l => l.date === d)).length;
  const missingTopicsCount = lessons.filter(l => !l.topic || !l.topic.trim()).length;

  const monthsAvailable = useMemo(() => {
    const set = new Set(lessons.map(l => l.date.slice(0,7)));
    return Array.from(set).sort();
  }, [lessons]);

  const currentMonth = activeMonth && monthsAvailable.includes(activeMonth) ? activeMonth : monthsAvailable[0];
  const monthLessons = lessons.filter(l => l.date.slice(0,7) === currentMonth);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const ktpTopics = state.ktp.filter(k => k.gurtokId === activeGurtok.id);
      const mapped = mapTopicsToDates(scheduleDates, ktpTopics, state.schoolSettings);
      const items = mapped.map(m => ({ date: m.date, topic: m.topic, duration: activeGurtok.duration || 90 }));
      await syncLessonsFromKtp(activeGurtok.id, items);
    } finally {
      setSyncing(false);
    }
  };

  const getMark = (lessonId, memberId) => {
    const local = localMarks[lessonId]?.[memberId];
    if (local !== undefined) return local;
    const rec = state.attendance.find(a => a.lessonId === lessonId && a.memberId === memberId);
    return rec?.mark || null;
  };

  const setMark = (lessonId, memberId, mark) => {
    setLocalMarks(prev => ({ ...prev, [lessonId]: { ...prev[lessonId], [memberId]: mark } }));
    setDirty(true);
    setOpenPicker(null);
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      for (const lesson of monthLessons) {
        const marks = {};
        let has = false;
        members.forEach(m => {
          const mark = getMark(lesson.id, m.id);
          if (mark) { marks[m.id] = mark; has = true; }
        });
        if (has) await saveAttendance(activeGurtok.id, lesson.id, lesson.date, marks);
      }
      setLocalMarks({});
      setDirty(false);
    } finally {
      setSavingAttendance(false);
    }
  };

  const calcPercent = (memberId) => {
    const marks = lessons.map(l => getMark(l.id, memberId)).filter(Boolean);
    if (marks.length === 0) return null;
    const present = marks.filter(m => m === 'present').length;
    return Math.round(present / marks.length * 100);
  };
  const pctColor = (pct) => pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--amber)' : 'var(--danger)';

  const renderCell = (mark) => {
    if (!mark) return <span style={cellStyle('var(--surface2)', 'var(--text3)')}>—</span>;
    const m = ATTENDANCE_MARKS[mark];
    const colors = { green:['#D6EDBE','#2C5609'], red:['#FEE2E2','#991B1B'], amber:['#FAE8C8','#7A4208'] };
    const [bg, text] = colors[m.color];
    return <span style={cellStyle(bg, text, true)}>{m.label}</span>;
  };

  return (
    <div className="fade-up">
      <GurtokSelector gurtky={myGurtky} active={activeGurtok} onSelect={onSelectGurtok} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, marginTop:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:16, fontWeight:600 }}>{activeGurtok.name}</div>
            <Badge color="gray">{activeGurtok.year || state.currentYear}</Badge>
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
            {leader && <>Керівник: {leader.fullName} · </>}{formatSchedule(activeGurtok)}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:2, background:'var(--surface2)', borderRadius:9, padding:3 }}>
            <button onClick={() => setView('attendance')} style={{
              padding:'6px 13px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12.5,
              background: view === 'attendance' ? 'var(--surface)' : 'transparent',
              color: view === 'attendance' ? 'var(--text)' : 'var(--text3)',
              fontWeight: view === 'attendance' ? 600 : 400,
              boxShadow: view === 'attendance' ? 'var(--shadow)' : 'none',
            }}><i className="ti ti-checkbox" /> Відвідуваність</button>
            <button onClick={() => setView('topics')} style={{
              padding:'6px 13px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12.5,
              background: view === 'topics' ? 'var(--surface)' : 'transparent',
              color: view === 'topics' ? 'var(--text)' : 'var(--text3)',
              fontWeight: view === 'topics' ? 600 : 400,
              boxShadow: view === 'topics' ? 'var(--shadow)' : 'none',
            }}><i className="ti ti-list-details" /> Журнал тем</button>
          </div>
          {missingDatesCount > 0 && <Badge color="amber">{missingDatesCount} занять не синхронізовано</Badge>}
          {missingTopicsCount > 0 && <Badge color="red">{missingTopicsCount} без теми</Badge>}
          <Btn onClick={handleSync} disabled={syncing} variant={lessons.length === 0 ? 'primary' : 'secondary'}>
            {syncing ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Синхронізація...</> : <><i className="ti ti-refresh" /> Синхронізувати з КТП</>}
          </Btn>
        </div>
      </div>

      {view === 'topics' ? (
        <TopicsJournalView
          lessons={lessons}
          onEdit={(l) => openModal(() => setEditingLesson(l))}
        />
      ) : lessons.length === 0 ? (
        <EmptyState text="Занять ще немає. Натисни «Синхронізувати з КТП» щоб згенерувати дати за розкладом гуртка." />
      ) : members.length === 0 ? (
        <EmptyState text="Спочатку додайте учнів до гуртка на сторінці «Гуртки»" />
      ) : (
        <Card>
          <div style={{ display:'flex', gap:4, padding:'12px 14px', borderBottom:'0.5px solid var(--border)', overflowX:'auto' }}>
            {monthsAvailable.map(m => {
              const [y, mo] = m.split('-');
              const label = `${MONTH_NAMES[parseInt(mo)-1]} ${y}`;
              return (
                <button key={m} onClick={() => setActiveMonth(m)} style={{
                  padding:'6px 12px', borderRadius:7, border:'none', whiteSpace:'nowrap',
                  background: currentMonth === m ? 'var(--ua-blue)' : 'var(--surface2)',
                  color: currentMonth === m ? '#fff' : 'var(--text2)',
                  fontSize:12.5, fontWeight: currentMonth===m?600:400, cursor:'pointer',
                }}>{label}</button>
              );
            })}
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', color:'var(--text3)', fontSize:12, position:'sticky', left:0, background:'var(--surface2)', zIndex:1, minWidth:160 }}>
                    Прізвище та ім'я
                  </th>
                  {monthLessons.map(l => {
                    const subst = state.substitutions?.find(s => s.gurtokId === activeGurtok.id && s.date === l.date);
                    const substLeader = subst ? state.leaders.find(ld => ld.id === subst.substituteLeaderId) : null;
                    return (
                      <th key={l.id} style={{ padding:'6px 4px', textAlign:'center', minWidth:64, maxWidth:64 }}>
                        <button onClick={() => openModal(() => setEditingLesson(l))} style={{ background:'none', border:'none', cursor:'pointer', width:'100%', padding:0 }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, marginBottom:3 }}>
                            <span style={{
                              width:6, height:6, borderRadius:'50%', flexShrink:0,
                              background: l.topic && l.topic.trim() ? 'var(--success)' : 'var(--danger)',
                            }} title={l.topic && l.topic.trim() ? 'Тема прив\'язана' : 'Тема не призначена'} />
                          </div>
                          {l.topic ? (
                            <div style={{ fontSize:9.5, color:'var(--text2)', lineHeight:1.2, marginBottom:4, height:22, overflow:'hidden', wordBreak:'break-word' }}>{l.topic}</div>
                          ) : (
                            <div style={{ fontSize:9.5, color:'var(--danger)', lineHeight:1.2, marginBottom:4, height:22, display:'flex', alignItems:'center', justifyContent:'center' }}>без теми</div>
                          )}
                          <div style={{ fontSize:11, fontWeight:600, color:'var(--text2)' }}>{l.date.slice(8,10)}.{l.date.slice(5,7)}</div>
                          {substLeader && <i className="ti ti-replace" style={{ fontSize:10, color:'var(--amber)', display:'block', marginTop:2 }} title={`Замінює: ${substLeader.fullName}`} />}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} style={{ borderTop:'0.5px solid var(--border)' }}>
                    <td style={{ padding:'8px 14px', fontWeight:500, whiteSpace:'nowrap', position:'sticky', left:0, background:'var(--surface)' }}>
                      {m.lastName} {m.firstName}
                    </td>
                    {monthLessons.map(l => (
                      <td key={l.id} style={{ padding:'6px 4px', textAlign:'center', position:'relative' }}>
                        <button onClick={() => setOpenPicker(
                          openPicker?.lessonId === l.id && openPicker?.memberId === m.id ? null : { lessonId: l.id, memberId: m.id }
                        )} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                          {renderCell(getMark(l.id, m.id))}
                        </button>
                        {openPicker?.lessonId === l.id && openPicker?.memberId === m.id && (
                          <MarkPicker
                            current={getMark(l.id, m.id)}
                            onPick={(mark) => setMark(l.id, m.id, mark)}
                            onClose={() => setOpenPicker(null)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding:'12px 14px', borderTop:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <Legend />
            {dirty && (
              <Btn onClick={handleSaveAttendance} disabled={savingAttendance}>
                {savingAttendance ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Збереження...</> : <><i className="ti ti-cloud-upload" /> Зберегти зміни</>}
              </Btn>
            )}
          </div>
        </Card>
      )}

      <LessonEditModal
        open={!!editingLesson}
        lesson={editingLesson}
        ktpTopics={state.ktp.filter(k => k.gurtokId === activeGurtok.id)}
        onClose={() => closeModal(() => setEditingLesson(null))}
        onSave={async (data) => { await editLesson(editingLesson.id, data); closeModal(() => setEditingLesson(null)); }}
        onDelete={() => { setDeleteTarget(editingLesson); setEditingLesson(null); }}
      />

      <Confirm
        open={!!deleteTarget}
        title="Видалити заняття?"
        message={`Заняття від ${deleteTarget?.date} та дані відвідуваності будуть видалені.`}
        onConfirm={async () => { await removeLesson(deleteTarget.id); closeModal(() => setDeleteTarget(null)); }}
        onCancel={() => closeModal(() => setDeleteTarget(null))}
      />
    </div>
  );
}

function cellStyle(bg, color, bold) {
  return { width:28, height:28, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:6, background:bg, color, fontSize:11, fontWeight: bold?600:400, border: bold?'none':'1px solid var(--border)' };
}

function Legend() {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:11, color:'var(--text2)', flexWrap:'wrap' }}>
      <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{width:20,height:20,borderRadius:5,background:'#D6EDBE',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#2C5609',fontWeight:600}}>П</span> присутній</span>
      <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{width:20,height:20,borderRadius:5,background:'#FEE2E2',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#991B1B',fontWeight:600}}>н</span> відсутній</span>
      <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{width:20,height:20,borderRadius:5,background:'#FAE8C8',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#7A4208',fontWeight:600}}>хв</span> хворий</span>
      <span style={{ display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--success)' }} />/<span style={{ width:6, height:6, borderRadius:'50%', background:'var(--danger)' }} /> тема прив'язана / не прив'язана
      </span>
      <span style={{ color:'var(--text3)' }}>Клік на дату — редагувати тему</span>
    </div>
  );
}

export function GurtokSelector({ gurtky, active, onSelect }) {
  if (gurtky.length <= 1) return null;
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
      {gurtky.map(g => (
        <button key={g.id} onClick={() => onSelect(g)} style={{
          padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)',
          background: active?.id === g.id ? 'var(--ua-blue)' : 'var(--surface)',
          color: active?.id === g.id ? '#fff' : 'var(--text2)',
          fontSize:13, cursor:'pointer', fontWeight: active?.id===g.id?600:400,
        }}>{g.name}</button>
      ))}
    </div>
  );
}

// Спливаюче міні-меню вибору статусу відвідуваності (П / н / хв / очистити).
// Зʼявляється під клітинкою, закривається кліком на варіант або поза меню.
function MarkPicker({ current, onPick, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  const colors = { green:['#D6EDBE','#2C5609'], red:['#FEE2E2','#991B1B'], amber:['#FAE8C8','#7A4208'] };

  return (
    <div ref={ref} style={{
      position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', marginTop:4, zIndex:50,
      background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10,
      boxShadow:'0 8px 24px rgba(0,0,0,.16)', padding:6, display:'flex', flexDirection:'column', gap:3, minWidth:108,
    }}>
      {Object.entries(ATTENDANCE_MARKS).map(([key, m]) => {
        const [bg, text] = colors[m.color];
        const isActive = current === key;
        return (
          <button key={key} onClick={() => onPick(key)} style={{
            display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:7, border:'none',
            background: isActive ? bg : 'transparent', cursor:'pointer', textAlign:'left',
          }}>
            <span style={{ width:20, height:20, borderRadius:6, background:bg, color:text, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{m.label}</span>
            <span style={{ fontSize:12.5, color:'var(--text)' }}>{m.name}</span>
          </button>
        );
      })}
      <button onClick={() => onPick(null)} style={{
        display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:7, border:'none',
        background: !current ? 'var(--surface2)' : 'transparent', cursor:'pointer', textAlign:'left', marginTop:2, borderTop:'0.5px solid var(--border)', paddingTop:8,
      }}>
        <span style={{ width:20, height:20, borderRadius:6, background:'var(--surface2)', color:'var(--text3)', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>—</span>
        <span style={{ fontSize:12.5, color:'var(--text3)' }}>Очистити</span>
      </button>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <Card style={{ padding:'40px 20px', textAlign:'center', color:'var(--text3)' }}>
      <i className="ti ti-mood-empty" style={{ fontSize:32, opacity:.4, display:'block', marginBottom:10 }} />
      {text}
    </Card>
  );
}

// Компактний журнал тем: дата + тема в один рядок, групування по місяцях.
// Дозволяє швидко переглянути та відредагувати теми занять без матриці відвідуваності.
function TopicsJournalView({ lessons, onEdit }) {
  if (lessons.length === 0) return <EmptyState text="Занять ще немає. Натисни «Синхронізувати з КТП» щоб згенерувати дати за розкладом гуртка." />;

  const byMonth = {};
  lessons.forEach(l => {
    const key = l.date.slice(0, 7);
    (byMonth[key] = byMonth[key] || []).push(l);
  });
  const months = Object.keys(byMonth).sort();

  const filledCount = lessons.filter(l => l.topic && l.topic.trim()).length;

  return (
    <Card>
      <div style={{ padding:'12px 18px', borderBottom:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <span style={{ fontSize:12.5, color:'var(--text2)' }}>
          Прив'язано тем: <strong>{filledCount}</strong> з {lessons.length}
        </span>
        <span style={{ fontSize:11, color:'var(--text3)' }}>Клік на рядок — редагувати тему</span>
      </div>

      <div>
        {months.map(month => {
          const [y, mo] = month.split('-');
          const label = `${MONTH_NAMES[parseInt(mo)-1]} ${y}`;
          const monthLessons = byMonth[month];
          return (
            <div key={month}>
              <div style={{ padding:'8px 18px', background:'var(--surface2)', fontSize:11.5, fontWeight:600, color:'var(--text2)' }}>{label}</div>
              {monthLessons.map(l => {
                const hasTopic = l.topic && l.topic.trim();
                const hasPractical = l.practicalWork && l.practicalWork.trim();
                return (
                  <button key={l.id} onClick={() => onEdit(l)} style={{
                    display:'flex', alignItems:'flex-start', gap:12, width:'100%', textAlign:'left',
                    padding:'10px 18px', border:'none', borderTop:'0.5px solid var(--border)',
                    background:'transparent', cursor:'pointer', fontSize:13,
                  }}>
                    <span style={{
                      width:7, height:7, borderRadius:'50%', flexShrink:0, marginTop:6,
                      background: hasTopic ? 'var(--success)' : 'var(--danger)',
                    }} />
                    <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text2)', minWidth:46, flexShrink:0, paddingTop:1 }}>
                      {l.date.slice(8,10)}.{l.date.slice(5,7)}
                    </span>
                    <span style={{ flex:1, display:'flex', flexDirection:'column', gap:2 }}>
                      <span style={{ color: hasTopic ? 'var(--text)' : 'var(--danger)', fontStyle: hasTopic ? 'normal' : 'italic' }}>
                        {hasTopic ? l.topic : 'Тема не призначена'}
                      </span>
                      {hasPractical && (
                        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'var(--text3)' }}>
                          <i className="ti ti-clipboard-text" style={{ fontSize:12 }} />
                          {l.practicalWork}
                        </span>
                      )}
                    </span>
                    <i className="ti ti-chevron-right" style={{ color:'var(--text3)', fontSize:14, marginTop:2, flexShrink:0 }} />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LessonEditModal({ open, lesson, ktpTopics, onClose, onSave, onDelete }) {
  const [topic, setTopic]                 = useState('');
  const [practicalWork, setPracticalWork] = useState('');
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    if (lesson) { setTopic(lesson.topic || ''); setPracticalWork(lesson.practicalWork || ''); }
  }, [lesson]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ topic: topic.trim(), practicalWork: practicalWork.trim() });
    setSaving(false);
  };

  if (!lesson) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Заняття — ${String(lesson.date).slice(0, 10)}`}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Дату й тривалість заняття визначає адміністратор у розкладі гуртка.</div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Тема заняття</label>
          <Input value={topic} onChange={setTopic} placeholder="Тема з КТП або своя" />
          {ktpTopics.length > 0 && (
            <Select value="" onChange={(v) => v && setTopic(v)} style={{ marginTop:6 }}>
              <option value="">— або обрати тему з КТП —</option>
              {ktpTopics.map(t => <option key={t.id} value={t.topic}>{t.topic}</option>)}
            </Select>
          )}
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Практична діяльність (опційно)</label>
          <Textarea value={practicalWork} onChange={setPracticalWork} placeholder="Виготовлення макету, доповідь, реферат..." rows={2} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={handleSave} disabled={saving} style={{ flex:1 }}>
            {saving ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Збереження...</> : <><i className="ti ti-check" /> Зберегти</>}
          </Btn>
          <Btn variant="danger" onClick={onDelete}><i className="ti ti-trash" /></Btn>
        </div>
      </div>
    </Modal>
  );
}
