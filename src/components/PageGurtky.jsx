import { useState, useEffect } from 'react';
import { Btn, Card, CardHeader, Input, Select, Modal, Confirm, Badge, StatCard, SectionLabel } from './UI';
import { GURTOK_COLORS, WEEKDAYS } from '../data/constants';

export default function PageGurtky({ state, myGurtky, user, onSelectGurtok, addGurtok, editGurtok, removeGurtok, addMember, editMember, removeMember, onModalChange }) {
  const [expandedId, setExpandedId] = useState(null);
  const [showAddGurtok, setShowAddGurtok] = useState(false);
  const [editingGurtok, setEditingGurtok] = useState(null);
  const [showAddMember, setShowAddMember] = useState(null); // gurtokId
  const [editingMember, setEditingMember] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // {type, id, name}

  const openModal  = (fn) => { fn(); onModalChange?.(true); };
  const closeModal = (fn) => { fn(); onModalChange?.(false); };

  const totalMembers = myGurtky.reduce((sum, g) => sum + state.members.filter(m => m.gurtokId === g.id && m.status !== 'left').length, 0);
  const totalLessonsThisMonth = state.lessons.filter(l => myGurtky.some(g => g.id === l.gurtokId)).length;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Статистика по конкретному гуртку за сьогоднішній день
  const calcTodayStats = (gurtokId) => {
    const lessonToday = state.lessons.find(l => l.gurtokId === gurtokId && l.date === todayStr);
    if (!lessonToday) return null; // гурток сьогодні не працює
    const records = state.attendance.filter(a => a.lessonId === lessonToday.id);
    const present = records.filter(a => a.mark === 'present').length;
    const absent  = records.filter(a => a.mark === 'absent' || a.mark === 'sick').length;
    return { present, absent, marked: records.length > 0 };
  };

  // Загальна статистика "сьогодні" по всіх гуртках разом
  const todayOverall = (() => {
    let present = 0, absent = 0, anyLessonToday = false;
    myGurtky.forEach(g => {
      const stats = calcTodayStats(g.id);
      if (stats) { anyLessonToday = true; present += stats.present; absent += stats.absent; }
    });
    return { anyLessonToday, present, absent };
  })();

  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <SectionLabel>Мої гуртки</SectionLabel>
        {user.isAdmin && (
          <Btn onClick={() => openModal(() => setShowAddGurtok(true))}><i className="ti ti-plus" /> Новий гурток</Btn>
        )}
      </div>

      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        <StatCard label="Гуртків" value={myGurtky.length} icon="ti-users" />
        <StatCard label="Гуртківців" value={totalMembers} icon="ti-user" color="#1D9E75" />
        <StatCard label="Занять усього" value={totalLessonsThisMonth} icon="ti-book" color="#534AB7" />
        {todayOverall.anyLessonToday ? (
          <StatCard label="Сьогодні: присутні / відсутні" value={`${todayOverall.present} / ${todayOverall.absent}`} icon="ti-clipboard-check" color="#D97706" />
        ) : (
          <StatCard label="Сьогодні" value="—" sub="немає занять за розкладом" icon="ti-calendar-off" color="#94A3B8" />
        )}
      </div>

      {myGurtky.length === 0 && (
        <Card style={{ padding:'40px 0', textAlign:'center', color:'var(--text3)' }}>
          <i className="ti ti-mood-empty" style={{ fontSize:32, opacity:.4, display:'block', marginBottom:10 }} />
          Гуртків ще не створено
        </Card>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {myGurtky.map((g, idx) => {
          const members = state.members.filter(m => m.gurtokId === g.id && m.status !== 'left');
          const todayStats = calcTodayStats(g.id);
          const color   = GURTOK_COLORS[idx % GURTOK_COLORS.length];
          const isExpanded = expandedId === g.id;
          const leader = state.leaders.find(l => l.id === g.leaderId);

          return (
            <Card key={g.id}>
              <div style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                <div style={{ width:44, height:44, borderRadius:12, background:color+'20', color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  <i className="ti ti-device-laptop" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:600 }}>{g.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                    {formatSchedule(g)} · {members.length} гуртківців
                    {user.isAdmin && leader && <> · {leader.fullName}</>}
                  </div>
                </div>
                {todayStats ? (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16, fontWeight:700, color }}>{todayStats.present} / {todayStats.absent}</div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>сьогодні П / н</div>
                  </div>
                ) : (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>сьогодні відсутній</div>
                  </div>
                )}
                <Btn size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onSelectGurtok(g); }}>
                  <i className="ti ti-book" /> Журнал
                </Btn>
                {user.isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); openModal(() => setEditingGurtok(g)); }}
                    style={{ background:'none', border:'none', color:'var(--text3)', fontSize:15, padding:6, cursor:'pointer' }} title="Редагувати розклад">
                    <i className="ti ti-clock-edit" />
                  </button>
                )}
                {user.isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); openModal(() => setDeleteTarget({ type:'gurtok', id:g.id, name:g.name })); }}
                    style={{ background:'none', border:'none', color:'var(--text3)', fontSize:15, padding:6, cursor:'pointer' }}>
                    <i className="ti ti-trash" />
                  </button>
                )}
                <i className={`ti ${isExpanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ color:'var(--text3)' }} />
              </div>

              {isExpanded && (
                <div style={{ borderTop:'0.5px solid var(--border)', padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>Члени гуртка</span>
                    <Btn size="sm" onClick={() => openModal(() => setShowAddMember(g.id))}><i className="ti ti-plus" /> Додати учня</Btn>
                  </div>

                  {members.length === 0 ? (
                    <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'16px 0' }}>Учнів ще не додано</div>
                  ) : (
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                        <thead>
                          <tr style={{ background:'var(--surface2)' }}>
                            {['Прізвище та ім\'я','Школа','Клас','Місце роботи батьків, телефон','Адреса','',''].map(h=>
                              <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:'var(--text3)', fontWeight:500, fontSize:11, whiteSpace:'nowrap' }}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {members.map(m => (
                            <tr key={m.id} style={{ borderTop:'0.5px solid var(--border)' }}>
                              <td style={{ padding:'8px 10px', fontWeight:500 }}>{m.lastName} {m.firstName}</td>
                              <td style={{ padding:'8px 10px' }}><Badge color="gray">{m.school || '—'}</Badge></td>
                              <td style={{ padding:'8px 10px' }}>{m.cls || '—'}</td>
                              <td style={{ padding:'8px 10px', color:'var(--text2)' }}>{m.parentWork}{m.parentPhone ? `, ${m.parentPhone}` : ''}</td>
                              <td style={{ padding:'8px 10px', color:'var(--text2)' }}>{m.address || '—'}</td>
                              <td style={{ padding:'8px 10px' }}>
                                <button onClick={() => openModal(() => setEditingMember(m))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}><i className="ti ti-edit" /></button>
                              </td>
                              <td style={{ padding:'8px 10px' }}>
                                <button onClick={() => openModal(() => setDeleteTarget({ type:'member', id:m.id, name:`${m.lastName} ${m.firstName}` }))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}><i className="ti ti-trash" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Додати гурток */}
      <GurtokModal
        open={showAddGurtok || !!editingGurtok}
        editing={editingGurtok}
        onClose={() => closeModal(() => { setShowAddGurtok(false); setEditingGurtok(null); })}
        leaders={state.leaders}
        onSave={async (data) => {
          if (editingGurtok) await editGurtok(editingGurtok.id, data);
          else await addGurtok({ ...data, year: state.currentYear });
          closeModal(() => { setShowAddGurtok(false); setEditingGurtok(null); });
        }}
      />

      {/* Додати/редагувати учня */}
      <MemberModal
        open={!!showAddMember || !!editingMember}
        editing={editingMember}
        onClose={() => closeModal(() => { setShowAddMember(null); setEditingMember(null); })}
        onSave={async (data) => {
          if (editingMember) await editMember(editingMember.id, data);
          else await addMember({ ...data, gurtokId: showAddMember });
          closeModal(() => { setShowAddMember(null); setEditingMember(null); });
        }}
      />

      {/* Підтвердження видалення */}
      <Confirm
        open={!!deleteTarget}
        title={deleteTarget?.type === 'gurtok' ? 'Видалити гурток?' : 'Видалити учня?'}
        message={deleteTarget?.type === 'gurtok'
          ? `Гурток "${deleteTarget?.name}" та всі пов'язані дані (учні, КТП, заняття, відвідуваність) будуть видалені. Цю дію не можна скасувати.`
          : `Учень "${deleteTarget?.name}" буде видалений з гуртка.`}
        onConfirm={async () => {
          if (deleteTarget.type === 'gurtok') await removeGurtok(deleteTarget.id);
          else await removeMember(deleteTarget.id);
          closeModal(() => setDeleteTarget(null));
        }}
        onCancel={() => closeModal(() => setDeleteTarget(null))}
      />
    </div>
  );
}

function GurtokModal({ open, editing, onClose, leaders, onSave }) {
  const [name, setName]           = useState('');
  const [leaderId, setLeaderId]   = useState('');
  const [slots, setSlots]         = useState([]); // [{day:'Пн', start:'14:00', end:'15:30'}]
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setLeaderId(editing.leaderId);
      setSlots(parseScheduleSlots(editing));
    }
  }, [editing]);

  const reset = () => { setName(''); setLeaderId(''); setSlots([]); };

  const toggleDay = (dayShort) => {
    setSlots(prev => {
      const exists = prev.find(s => s.day === dayShort);
      if (exists) return prev.filter(s => s.day !== dayShort);
      return [...prev, { day: dayShort, start: '14:00', end: '15:30' }];
    });
  };

  const updateSlot = (dayShort, field, value) => {
    setSlots(prev => prev.map(s => s.day === dayShort ? { ...s, [field]: value } : s));
  };

  const calcDuration = (slot) => {
    const [h1,m1] = slot.start.split(':').map(Number);
    const [h2,m2] = slot.end.split(':').map(Number);
    const mins = (h2*60+m2) - (h1*60+m1);
    return mins > 0 ? mins : 90;
  };

  const handleSave = async () => {
    if (!name.trim() || !leaderId || slots.length === 0) return;
    setSaving(true);
    const sortedSlots = [...slots].sort((a,b) => WEEKDAYS.findIndex(w=>w.short===a.day) - WEEKDAYS.findIndex(w=>w.short===b.day));
    const days = sortedSlots.map(s => s.day).join(', ');
    const avgDuration = Math.round(sortedSlots.reduce((sum,s) => sum + calcDuration(s), 0) / sortedSlots.length);
    await onSave({
      name: name.trim(), leaderId, days,
      timeStart: sortedSlots[0]?.start || '', timeEnd: sortedSlots[0]?.end || '',
      duration: avgDuration,
      schedule: JSON.stringify(sortedSlots),
    });
    reset();
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={editing ? 'Редагувати розклад гуртка' : 'Новий гурток'} maxWidth={560}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Назва гуртка</label>
          <Input value={name} onChange={setName} placeholder="Наприклад: Програмування Python" />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Керівник</label>
          <Select value={leaderId} onChange={setLeaderId}>
            <option value="">— оберіть керівника —</option>
            {leaders.map(l => <option key={l.id} value={l.id}>{l.fullName}</option>)}
          </Select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:8 }}>Дні занять</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {WEEKDAYS.filter(w => w.id !== 0).concat(WEEKDAYS.filter(w => w.id === 0)).map(wd => {
              const active = slots.some(s => s.day === wd.short);
              return (
                <button key={wd.id} onClick={() => toggleDay(wd.short)} type="button" style={{
                  padding:'8px 14px', borderRadius:8, border: active ? 'none' : '1px solid var(--border2)',
                  background: active ? 'var(--ua-blue)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--text2)',
                  fontSize:12.5, fontWeight: active?600:400, cursor:'pointer',
                }}>{wd.name}</button>
              );
            })}
          </div>
        </div>

        {slots.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ fontSize:12, color:'var(--text2)' }}>Час занять по днях</label>
            {slots.map(slot => (
              <div key={slot.day} style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr', gap:8, alignItems:'center' }}>
                <Badge color="blue">{slot.day}</Badge>
                <Input type="time" value={slot.start} onChange={v => updateSlot(slot.day, 'start', v)} />
                <Input type="time" value={slot.end} onChange={v => updateSlot(slot.day, 'end', v)} />
              </div>
            ))}
          </div>
        )}

        <Btn onClick={handleSave} disabled={saving || !name.trim() || !leaderId || slots.length === 0} style={{ marginTop:6 }}>
          {saving ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Збереження...</> : <><i className="ti ti-check" /> {editing ? 'Зберегти зміни' : 'Створити гурток'}</>}
        </Btn>
      </div>
    </Modal>
  );
}

// Парсить розклад гуртка з поля schedule (JSON) або зі старого формату days/timeStart/timeEnd
function parseScheduleSlots(gurtok) {
  if (gurtok.schedule) {
    try {
      const parsed = JSON.parse(gurtok.schedule);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
  }
  // Зворотна сумісність зі старими гуртками без schedule
  if (gurtok.days) {
    const dayTokens = gurtok.days.split(/[,;]+/).map(d => d.trim()).filter(Boolean);
    return dayTokens.map(day => ({ day, start: gurtok.timeStart || '14:00', end: gurtok.timeEnd || '15:30' }));
  }
  return [];
}

// Форматує розклад гуртка для показу: "Пн 14:00–15:30, Ср 15:00–16:00"
export function formatSchedule(gurtok) {
  const slots = parseScheduleSlots(gurtok);
  if (slots.length === 0) return 'Розклад не задано';
  return slots.map(s => `${s.day} ${s.start}–${s.end}`).join(', ');
}

function MemberModal({ open, editing, onClose, onSave }) {
  const [lastName, setLastName]       = useState(editing?.lastName || '');
  const [firstName, setFirstName]     = useState(editing?.firstName || '');
  const [school, setSchool]           = useState(editing?.school || '№313');
  const [cls, setCls]                 = useState(editing?.cls || '');
  const [parentWork, setParentWork]   = useState(editing?.parentWork || '');
  const [parentPhone, setParentPhone] = useState(editing?.parentPhone || '');
  const [address, setAddress]         = useState(editing?.address || '');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (editing) {
      setLastName(editing.lastName); setFirstName(editing.firstName);
      setSchool(editing.school || '№313'); setCls(editing.cls || '');
      setParentWork(editing.parentWork || ''); setParentPhone(editing.parentPhone || '');
      setAddress(editing.address || '');
    }
  }, [editing]);

  const reset = () => { setLastName(''); setFirstName(''); setSchool('№313'); setCls(''); setParentWork(''); setParentPhone(''); setAddress(''); };

  const handleSave = async () => {
    if (!lastName.trim() || !firstName.trim()) return;
    setSaving(true);
    await onSave({ lastName: lastName.trim(), firstName: firstName.trim(), school, cls, parentWork, parentPhone, address });
    reset();
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={editing ? 'Редагувати учня' : 'Додати учня'} maxWidth={480}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Прізвище</label>
            <Input value={lastName} onChange={setLastName} placeholder="Іваненко" />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Ім'я</label>
            <Input value={firstName} onChange={setFirstName} placeholder="Марія" />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Школа</label>
            <Input value={school} onChange={setSchool} placeholder="№313" />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Клас</label>
            <Input value={cls} onChange={setCls} placeholder="8-А" />
          </div>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Місце роботи батьків, телефон</label>
          <Input value={parentWork} onChange={setParentWork} placeholder="ПрАТ «Енергія», 050-123-45-67" />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Домашня адреса</label>
          <Input value={address} onChange={setAddress} placeholder="вул. Шевченка, 12, кв. 5" />
        </div>
        <Btn onClick={handleSave} disabled={saving || !lastName.trim() || !firstName.trim()} style={{ marginTop:4 }}>
          {saving ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Збереження...</> : <><i className="ti ti-check" /> Зберегти</>}
        </Btn>
      </div>
    </Modal>
  );
}
