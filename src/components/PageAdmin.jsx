import { useState, useEffect } from 'react';
import { Btn, Card, CardHeader, Input, Select, Modal, Confirm, Badge, SectionLabel, StatCard } from './UI';

export default function PageAdmin({ state, user, addLeader, editLeader, removeLeader, addGurtok, editGurtok, removeGurtok, addSubstitution, removeSubstitution, addHoliday, removeHoliday, toggleHoliday, setSeasonHoliday, cleanupHolidaysData, setSchoolSetting, setAdminPassword, rolloverToNewYear, archiveCurrentYear, onModalChange }) {
  const activeLeaders = state.leaders.filter(l => l.active !== false && l.active !== 'FALSE').length;
  const yearGurtky     = state.gurtky.filter(g => g.year === state.currentYear);
  const activeGurtky   = yearGurtky.filter(g => g.active !== false && g.active !== 'FALSE').length;
  const yearGurtokIds  = new Set(yearGurtky.map(g => g.id));
  const totalMembers   = state.members.filter(m => m.status !== 'left' && yearGurtokIds.has(m.gurtokId)).length;
  const totalLessons   = state.lessons.filter(l => yearGurtokIds.has(l.gurtokId)).length;

  return (
    <div className="fade-up">
      <SectionLabel>Адміністрування системи — {state.currentYear}</SectionLabel>

      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
        <StatCard label="Активних керівників" value={activeLeaders} sub={`з ${state.leaders.length} усього`} icon="ti-users" />
        <StatCard label="Активних гуртків" value={activeGurtky} sub={`з ${yearGurtky.length} у цьому році`} icon="ti-device-laptop" color="#1D9E75" />
        <StatCard label="Гуртківців" value={totalMembers} icon="ti-user" color="#534AB7" />
        <StatCard label="Занять проведено" value={totalLessons} icon="ti-book" color="#D97706" />
      </div>

      <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <SchoolYearManager state={state} setSchoolSetting={setSchoolSetting} rolloverToNewYear={rolloverToNewYear} onModalChange={onModalChange} />
        <HolidaysManager state={state} addHoliday={addHoliday} removeHoliday={removeHoliday} toggleHoliday={toggleHoliday} setSeasonHoliday={setSeasonHoliday} cleanupHolidaysData={cleanupHolidaysData} onModalChange={onModalChange} />
        <LeadersManager state={state} addLeader={addLeader} editLeader={editLeader} removeLeader={removeLeader} onModalChange={onModalChange} />
        <GurtkyManager state={state} editGurtok={editGurtok} removeGurtok={removeGurtok} onModalChange={onModalChange} />
        <SubstitutionManager state={state} addSubstitution={addSubstitution} removeSubstitution={removeSubstitution} onModalChange={onModalChange} />
        <ExportManager state={state} archiveCurrentYear={archiveCurrentYear} onModalChange={onModalChange} />
        <ArchiveManager state={state} />
        <PasswordManager state={state} setAdminPassword={setAdminPassword} />
        <LoginLogCard state={state} />
      </div>
    </div>
  );
}

// ===================== КЕРІВНИКИ =====================
function LeadersManager({ state, addLeader, editLeader, removeLeader, onModalChange }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openModal  = (fn) => { fn(); onModalChange?.(true); };
  const closeModal = (fn) => { fn(); onModalChange?.(false); };

  const countGurtky = (leaderId) => state.gurtky.filter(g => g.leaderId === leaderId).length;

  return (
    <Card>
      <CardHeader title="Керівники гуртків" subtitle="Логін і пароль для входу" action={
        <Btn size="sm" onClick={() => openModal(() => setShowAdd(true))}><i className="ti ti-plus" /> Додати</Btn>
      } />
      <div style={{ maxHeight:340, overflowY:'auto' }}>
        {state.leaders.length === 0 ? (
          <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text3)', fontSize:13 }}>Керівників ще немає</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--surface2)' }}>
                <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>ПІБ</th>
                <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Логін</th>
                <th style={{ padding:'9px 14px', textAlign:'center', color:'var(--text3)', fontSize:11 }}>Гуртків</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.leaders.map(l => (
                <tr key={l.id} style={{ borderTop:'0.5px solid var(--border)' }}>
                  <td style={{ padding:'9px 14px', fontWeight:500 }}>{l.fullName}</td>
                  <td style={{ padding:'9px 14px', color:'var(--text2)', fontSize:12 }}>{l.login}</td>
                  <td style={{ padding:'9px 14px', textAlign:'center' }}><Badge color="blue">{countGurtky(l.id)}</Badge></td>
                  <td style={{ padding:'9px 14px', whiteSpace:'nowrap' }}>
                    <button onClick={() => openModal(() => setEditing(l))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', marginRight:4 }}><i className="ti ti-edit" /></button>
                    <button onClick={() => openModal(() => setDeleteTarget(l))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}><i className="ti ti-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LeaderModal
        open={showAdd || !!editing}
        editing={editing}
        onClose={() => closeModal(() => { setShowAdd(false); setEditing(null); })}
        onSave={async (data) => {
          if (editing) await editLeader(editing.id, data);
          else await addLeader(data);
          closeModal(() => { setShowAdd(false); setEditing(null); });
        }}
      />

      <Confirm
        open={!!deleteTarget}
        title="Видалити керівника?"
        message={`${deleteTarget?.fullName} буде видалений. Гуртки залишаться без керівника.`}
        onConfirm={async () => { await removeLeader(deleteTarget.id); closeModal(() => setDeleteTarget(null)); }}
        onCancel={() => closeModal(() => setDeleteTarget(null))}
      />
    </Card>
  );
}

function LeaderModal({ open, editing, onClose, onSave }) {
  const [fullName, setFullName] = useState(editing?.fullName || '');
  const [login, setLogin]       = useState(editing?.login || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => { if (editing) { setFullName(editing.fullName); setLogin(editing.login); } }, [editing]);

  const reset = () => { setFullName(''); setLogin(''); setPassword(''); };

  const handleSave = async () => {
    if (!fullName.trim() || !login.trim()) return;
    if (!editing && !password.trim()) return;
    setSaving(true);
    const data = { fullName: fullName.trim(), login: login.trim().toLowerCase() };
    if (password.trim()) data.password = password.trim();
    await onSave(data);
    reset();
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={editing ? 'Редагувати керівника' : 'Новий керівник'}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>ПІБ</label>
          <Input value={fullName} onChange={setFullName} placeholder="Коваленко Олена Василівна" />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Логін</label>
          <Input value={login} onChange={setLogin} placeholder="kovalenko" />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>
            Пароль {editing && <span style={{ color:'var(--text3)' }}>(залиш порожнім щоб не змінювати)</span>}
          </label>
          <Input type="password" value={password} onChange={setPassword} placeholder="••••••" />
        </div>
        <Btn onClick={handleSave} disabled={saving || !fullName.trim() || !login.trim() || (!editing && !password.trim())} style={{ marginTop:4 }}>
          {saving ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Збереження...</> : <><i className="ti ti-check" /> Зберегти</>}
        </Btn>
      </div>
    </Modal>
  );
}

// ===================== ГУРТКИ =====================
function GurtkyManager({ state, editGurtok, removeGurtok, onModalChange }) {
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openModal  = (fn) => { fn(); onModalChange?.(true); };
  const closeModal = (fn) => { fn(); onModalChange?.(false); };

  const yearGurtky = state.gurtky.filter(g => g.year === state.currentYear);

  return (
    <Card>
      <CardHeader title="Усі гуртки" subtitle={`Активність та архівація — ${state.currentYear}`} />
      <div style={{ maxHeight:340, overflowY:'auto' }}>
        {yearGurtky.length === 0 ? (
          <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text3)', fontSize:13 }}>Гуртків у цьому році ще немає</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--surface2)' }}>
                <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Назва</th>
                <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Керівник</th>
                <th style={{ padding:'9px 14px', textAlign:'center', color:'var(--text3)', fontSize:11 }}>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {yearGurtky.map(g => {
                const leader = state.leaders.find(l => l.id === g.leaderId);
                const isActive = g.active !== false && g.active !== 'FALSE';
                return (
                  <tr key={g.id} style={{ borderTop:'0.5px solid var(--border)' }}>
                    <td style={{ padding:'9px 14px', fontWeight:500, fontSize:12 }}>{g.name}</td>
                    <td style={{ padding:'9px 14px', color:'var(--text2)', fontSize:12 }}>{leader?.fullName || '—'}</td>
                    <td style={{ padding:'9px 14px', textAlign:'center' }}>
                      <button onClick={() => editGurtok(g.id, { active: !isActive })}>
                        <Badge color={isActive ? 'green' : 'gray'}>{isActive ? 'Активний' : 'Архів'}</Badge>
                      </button>
                    </td>
                    <td style={{ padding:'9px 14px' }}>
                      <button onClick={() => openModal(() => setDeleteTarget(g))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}><i className="ti ti-trash" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Confirm
        open={!!deleteTarget}
        title="Видалити гурток?"
        message={`Гурток "${deleteTarget?.name}" та всі його дані будуть видалені назавжди.`}
        onConfirm={async () => { await removeGurtok(deleteTarget.id); closeModal(() => setDeleteTarget(null)); }}
        onCancel={() => closeModal(() => setDeleteTarget(null))}
      />
    </Card>
  );
}

// ===================== PDF ЕКСПОРТ =====================
function ExportManager({ state, archiveCurrentYear, onModalChange }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [exporting, setExporting]     = useState(false);
  const [error, setError]             = useState('');
  const [progress, setProgress]       = useState(null); // {current, total}
  const [preview, setPreview]         = useState(null);  // {blob, fileName, gurtokName}

  const yearGurtky = state.gurtky.filter(g => g.year === state.currentYear);
  const allIds = yearGurtky.map(g => g.id);
  const allChecked = selectedIds.length === allIds.length && allIds.length > 0;

  const toggleOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelectedIds(allChecked ? [] : allIds);
  };

  // Прев'ю одного гуртка перед завантаженням
  const handlePreview = async (gurtokId) => {
    setError(''); setExporting(true);
    try {
      const { getGurtokPdfBlob } = await import('../data/pdfExport');
      const result = await getGurtokPdfBlob(gurtokId, state);
      setPreview(result);
    } catch(err) {
      setError('Помилка формування PDF: ' + err.message);
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // Завантажити з прев'ю
  const handleDownloadFromPreview = () => {
    if (!preview) return;
    const url = URL.createObjectURL(preview.blob);
    const a = document.createElement('a');
    a.href = url; a.download = preview.fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPreview(null);
  };

  // Масовий експорт у zip (без прев'ю, для кількох гуртків)
  const handleExportSelected = async () => {
    if (selectedIds.length === 0) return;
    setError(''); setExporting(true); setProgress({ current: 0, total: selectedIds.length });
    try {
      if (selectedIds.length === 1) {
        await handlePreview(selectedIds[0]);
      } else {
        const { exportMultipleGurtkyToZip } = await import('../data/pdfExport');
        await exportMultipleGurtkyToZip(selectedIds, state, (cur, total) => setProgress({ current: cur, total }));
      }
    } catch(err) {
      setError('Помилка формування PDF: ' + err.message);
      console.error(err);
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  // Архівація всього навчального року: генерує PDF для кожного активного гуртка
  // поточного року і відправляє на бекенд для збереження в Drive.
  const [archiving, setArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState(null);
  const [archiveResult, setArchiveResult] = useState(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const isCurrentYearArchived = (() => {
    const row = state.schoolYears.find(y => y.year === state.currentYear);
    return row?.isArchived === true || row?.isArchived === 'TRUE';
  })();

  const handleArchiveYear = async () => {
    setShowArchiveConfirm(false);
    onModalChange?.(true);
    setArchiving(true);
    setArchiveResult(null);
    try {
      const { getGurtokPdfBase64 } = await import('../data/pdfExport');
      const targets = yearGurtky.filter(g => g.active !== false && g.active !== 'FALSE');
      setArchiveProgress({ current: 0, total: targets.length });
      const files = [];
      for (let i = 0; i < targets.length; i++) {
        const g = targets[i];
        const leader = state.leaders.find(l => l.id === g.leaderId);
        const { base64, fileName } = await getGurtokPdfBase64(g.id, state);
        files.push({ gurtokId: g.id, gurtokName: g.name, leaderName: leader?.fullName || '', base64, fileName });
        setArchiveProgress({ current: i + 1, total: targets.length });
      }
      const result = await archiveCurrentYear(files);
      setArchiveResult(result);
    } catch(err) {
      setArchiveResult({ ok: false, error: err.message });
    } finally {
      setArchiving(false);
      setArchiveProgress(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Експорт журналів" subtitle={`PDF за зразком МОН — ${state.currentYear}`} action={
        yearGurtky.length > 0 && (
          <button onClick={toggleAll} style={{ fontSize:12, color:'var(--ua-blue)', background:'none', border:'none', cursor:'pointer' }}>
            {allChecked ? 'Скасувати всі' : 'Обрати всі'}
          </button>
        )
      } />

      {yearGurtky.length === 0 ? (
        <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text3)', fontSize:13 }}>Гуртків у цьому році ще немає</div>
      ) : (
        <div style={{ maxHeight:240, overflowY:'auto' }}>
          {yearGurtky.map(g => (
            <label key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 18px', borderTop:'0.5px solid var(--border)', cursor:'pointer', fontSize:13 }}>
              <input type="checkbox" checked={selectedIds.includes(g.id)} onChange={() => toggleOne(g.id)} style={{ width:15, height:15, accentColor:'var(--ua-blue)' }} />
              <span style={{ flex:1 }}>{g.name}</span>
              <button onClick={(e) => { e.preventDefault(); handlePreview(g.id); }} disabled={exporting}
                style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                <i className="ti ti-eye" /> Прев'ю
              </button>
            </label>
          ))}
        </div>
      )}

      <div style={{ padding:'14px 18px', borderTop:'0.5px solid var(--border)', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn onClick={handleExportSelected} disabled={selectedIds.length === 0 || exporting}>
          {exporting
            ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> {progress ? `Формування ${progress.current}/${progress.total}...` : 'Формування PDF...'}</>
            : selectedIds.length > 1
              ? <><i className="ti ti-file-zip" /> Завантажити {selectedIds.length} журнали (.zip)</>
              : <><i className="ti ti-file-download" /> Завантажити обраний журнал</>
          }
        </Btn>
        {error && <div style={{ fontSize:12, color:'var(--danger)' }}><i className="ti ti-alert-circle" /> {error}</div>}
      </div>

      <div style={{ padding:'14px 18px', borderTop:'0.5px solid var(--border)', background:'var(--surface2)' }}>
        <div style={{ fontSize:12.5, fontWeight:600, marginBottom:4 }}>Архівувати навчальний рік</div>
        <div style={{ fontSize:11.5, color:'var(--text3)', marginBottom:10 }}>
          Згенерує PDF-журнал кожного активного гуртка {state.currentYear} і збереже у Google Drive (папка «Архів»). Рік стане доступним лише для перегляду.
        </div>
        <Btn size="sm" variant="secondary" onClick={() => setShowArchiveConfirm(true)} disabled={archiving || isCurrentYearArchived || yearGurtky.length === 0}>
          {archiving
            ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> {archiveProgress ? `${archiveProgress.current}/${archiveProgress.total}...` : 'Архівація...'}</>
            : isCurrentYearArchived
              ? <><i className="ti ti-lock" /> Рік вже архівований</>
              : <><i className="ti ti-archive" /> Архівувати {state.currentYear}</>
          }
        </Btn>
        {archiveResult && (
          archiveResult.ok
            ? <div style={{ fontSize:12, color:'var(--success)', marginTop:8 }}><i className="ti ti-circle-check" /> Збережено {archiveResult.saved} журналів в архів</div>
            : <div style={{ fontSize:12, color:'var(--danger)', marginTop:8 }}><i className="ti ti-alert-circle" /> {archiveResult.error}</div>
        )}
      </div>

      <Confirm
        open={showArchiveConfirm}
        title={`Архівувати ${state.currentYear} рік?`}
        message="Буде згенеровано та збережено PDF-журнал кожного активного гуртка. Після архівації дати навчального року стануть недоступними для редагування. Дію не можна скасувати автоматично."
        onConfirm={handleArchiveYear}
        onCancel={() => { setShowArchiveConfirm(false); onModalChange?.(false); }}
      />

      {/* Прев'ю модалка */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ? `Прев'ю — ${preview.gurtokName}` : ''} maxWidth={700}>
        {preview && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <iframe
              src={URL.createObjectURL(preview.blob)}
              style={{ width:'100%', height:520, border:'1px solid var(--border)', borderRadius:8 }}
              title="PDF прев'ю"
            />
            <div style={{ display:'flex', gap:10 }}>
              <Btn onClick={handleDownloadFromPreview}><i className="ti ti-download" /> Завантажити PDF</Btn>
              <Btn variant="ghost" onClick={() => setPreview(null)}>Закрити</Btn>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

// ===================== АРХІВ =====================
function ArchiveManager({ state }) {
  const [openYear, setOpenYear] = useState(null);

  const byYear = {};
  state.archive.forEach(a => { (byYear[a.year] = byYear[a.year] || []).push(a); });
  const years = Object.keys(byYear).sort().reverse();

  return (
    <Card>
      <CardHeader title="Архів журналів" subtitle="PDF-копії за минулі навчальні роки" />
      {years.length === 0 ? (
        <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
          Архів порожній. Архівувати рік можна нижче, у блоці «Експорт журналів».
        </div>
      ) : (
        <div>
          {years.map(year => {
            const items = byYear[year];
            const isOpen = openYear === year;
            return (
              <div key={year} style={{ borderTop:'0.5px solid var(--border)' }}>
                <button onClick={() => setOpenYear(isOpen ? null : year)} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
                  padding:'12px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left',
                }}>
                  <span style={{ fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                    <i className="ti ti-archive" style={{ color:'var(--text3)' }} /> {year}
                  </span>
                  <span style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:6 }}>
                    {items.length} журналів <i className={`ti ti-chevron-${isOpen ? 'up' : 'down'}`} />
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding:'0 18px 12px' }}>
                    {items.map(a => (
                      <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer" style={{
                        display:'flex', alignItems:'center', gap:10, padding:'8px 0', fontSize:12.5,
                        color:'var(--text)', textDecoration:'none', borderTop:'0.5px solid var(--border)',
                      }}>
                        <i className="ti ti-file-type-pdf" style={{ color:'var(--danger)' }} />
                        <span style={{ flex:1 }}>{a.gurtokName}</span>
                        <span style={{ color:'var(--text3)', fontSize:11 }}>{a.leaderName}</span>
                        <i className="ti ti-external-link" style={{ color:'var(--text3)' }} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ===================== ПАРОЛЬ =====================
function PasswordManager({ state, setAdminPassword }) {
  const [oldPwd, setOldPwd]   = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving]   = useState(false);

  const handleChange = async () => {
    setError(''); setSuccess(false);
    if (oldPwd !== state.adminPassword) { setError('Невірний поточний пароль'); return; }
    if (newPwd.length < 4) { setError('Новий пароль — мінімум 4 символи'); return; }
    if (newPwd !== newPwd2) { setError('Паролі не співпадають'); return; }
    setSaving(true);
    try {
      await setAdminPassword(newPwd);
      setOldPwd(''); setNewPwd(''); setNewPwd2('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader title="Пароль адміністратора" subtitle="Логін для входу: admin" />
      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
        <Input type="password" value={oldPwd} onChange={setOldPwd} placeholder="Поточний пароль" />
        <Input type="password" value={newPwd} onChange={setNewPwd} placeholder="Новий пароль" />
        <Input type="password" value={newPwd2} onChange={setNewPwd2} placeholder="Повторіть новий пароль" />
        {error && <div style={{ fontSize:12, color:'var(--danger)' }}><i className="ti ti-alert-circle" /> {error}</div>}
        {success && <div style={{ fontSize:12, color:'var(--success)' }}><i className="ti ti-circle-check" /> Пароль змінено</div>}
        <Btn size="sm" onClick={handleChange} disabled={saving}>
          {saving ? 'Збереження...' : <><i className="ti ti-key" /> Змінити пароль</>}
        </Btn>
      </div>
    </Card>
  );
}

// ===================== ЛОГ ВХОДІВ =====================
function LoginLogCard({ state }) {
  if (!state.loginLog || state.loginLog.length === 0) {
    return (
      <Card>
        <CardHeader title="Лог входів" subtitle="Хто і коли заходив у систему" />
        <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text3)', fontSize:13 }}>Входів ще не зафіксовано</div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Лог входів" subtitle="Останні 100 входів, найновіші зверху" />
      <div style={{ maxHeight:340, overflowY:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'var(--surface2)' }}>
              <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Керівник</th>
              <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Дата</th>
              <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Час</th>
            </tr>
          </thead>
          <tbody>
            {state.loginLog.map(entry => (
              <tr key={entry.id} style={{ borderTop:'0.5px solid var(--border)' }}>
                <td style={{ padding:'9px 14px', fontWeight:500 }}>{entry.fullName}</td>
                <td style={{ padding:'9px 14px', color:'var(--text2)' }}>{entry.date}</td>
                <td style={{ padding:'9px 14px', color:'var(--text2)' }}>{entry.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ===================== ЗАМІНИ ВЧИТЕЛЯ =====================
function SubstitutionManager({ state, addSubstitution, removeSubstitution, onModalChange }) {
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openModal  = (fn) => { fn(); onModalChange?.(true); };
  const closeModal = (fn) => { fn(); onModalChange?.(false); };

  const yearGurtokIds = new Set(state.gurtky.filter(g => g.year === state.currentYear).map(g => g.id));
  const sorted = [...state.substitutions].filter(s => yearGurtokIds.has(s.gurtokId)).sort((a,b) => new Date(b.date) - new Date(a.date));
  const today = new Date().toISOString().slice(0,10);
  const upcoming = sorted.filter(s => s.date >= today);

  return (
    <Card>
      <CardHeader title="Заміни вчителів" subtitle="Призначення тимчасового керівника на дату" action={
        <Btn size="sm" onClick={() => openModal(() => setShowAdd(true))}><i className="ti ti-plus" /> Призначити</Btn>
      } />
      <div style={{ maxHeight:340, overflowY:'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text3)', fontSize:13 }}>Замін ще немає</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--surface2)' }}>
                <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Дата</th>
                <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Гурток</th>
                <th style={{ padding:'9px 14px', textAlign:'left', color:'var(--text3)', fontSize:11 }}>Заміняє</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => {
                const gurtok = state.gurtky.find(g => g.id === s.gurtokId);
                const substLeader = state.leaders.find(l => l.id === s.substituteLeaderId);
                const isPast = s.date < today;
                return (
                  <tr key={s.id} style={{ borderTop:'0.5px solid var(--border)', opacity: isPast ? 0.5 : 1 }}>
                    <td style={{ padding:'9px 14px', whiteSpace:'nowrap' }}>{s.date}</td>
                    <td style={{ padding:'9px 14px', fontSize:12 }}>{gurtok?.name || '—'}</td>
                    <td style={{ padding:'9px 14px', fontSize:12 }}>{substLeader?.fullName || '—'}</td>
                    <td style={{ padding:'9px 14px' }}>
                      <button onClick={() => openModal(() => setDeleteTarget(s))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}><i className="ti ti-trash" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <SubstitutionModal
        open={showAdd}
        state={state}
        onClose={() => closeModal(() => setShowAdd(false))}
        onSave={async (data) => { await addSubstitution(data); closeModal(() => setShowAdd(false)); }}
      />

      <Confirm
        open={!!deleteTarget}
        title="Скасувати заміну?"
        message={`Заміну на ${deleteTarget?.date} буде видалено.`}
        onConfirm={async () => { await removeSubstitution(deleteTarget.id); closeModal(() => setDeleteTarget(null)); }}
        onCancel={() => closeModal(() => setDeleteTarget(null))}
      />
    </Card>
  );
}

function SubstitutionModal({ open, state, onClose, onSave }) {
  const [gurtokId, setGurtokId]     = useState('');
  const [date, setDate]             = useState(new Date().toISOString().slice(0,10));
  const [substituteId, setSubstituteId] = useState('');
  const [note, setNote]             = useState('');
  const [saving, setSaving]         = useState(false);

  const yearGurtky = state.gurtky.filter(g => g.year === state.currentYear);
  const selectedGurtok = yearGurtky.find(g => g.id === gurtokId);

  const reset = () => { setGurtokId(''); setDate(new Date().toISOString().slice(0,10)); setSubstituteId(''); setNote(''); };

  const handleSave = async () => {
    if (!gurtokId || !substituteId) return;
    setSaving(true);
    await onSave({
      gurtokId, date, substituteLeaderId: substituteId,
      originalLeaderId: selectedGurtok?.leaderId || '', note: note.trim(),
    });
    reset();
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Призначити заміну">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Гурток</label>
          <Select value={gurtokId} onChange={setGurtokId}>
            <option value="">— оберіть гурток —</option>
            {yearGurtky.map(g => {
              const leader = state.leaders.find(l => l.id === g.leaderId);
              return <option key={g.id} value={g.id}>{g.name}{leader ? ` (${leader.fullName})` : ''}</option>;
            })}
          </Select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Дата заміни</label>
          <Input type="date" value={date} onChange={setDate} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>
            Тимчасовий керівник {selectedGurtok && <span style={{ color:'var(--text3)', fontWeight:400 }}>(окрім {state.leaders.find(l=>String(l.id)===String(selectedGurtok.leaderId))?.fullName || 'основного керівника'})</span>}
          </label>
          <Select value={substituteId} onChange={setSubstituteId}>
            <option value="">— оберіть керівника —</option>
            {state.leaders.filter(l => String(l.id) !== String(selectedGurtok?.leaderId)).map(l => <option key={l.id} value={l.id}>{l.fullName}</option>)}
          </Select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Примітка (опційно)</label>
          <Input value={note} onChange={setNote} placeholder="Причина відсутності основного керівника" />
        </div>
        <Btn onClick={handleSave} disabled={saving || !gurtokId || !substituteId} style={{ marginTop:4 }}>
          {saving ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Збереження...</> : <><i className="ti ti-check" /> Призначити заміну</>}
        </Btn>
      </div>
    </Modal>
  );
}

// ===================== НАВЧАЛЬНИЙ РІК =====================
function SchoolYearManager({ state, setSchoolSetting, rolloverToNewYear, onModalChange }) {
  const s = state.schoolSettings || {};
  const [yearStart, setYearStart] = useState(s.yearStart || '');
  const [yearEnd, setYearEnd]     = useState(s.yearEnd || '');
  const [sem1End, setSem1End]     = useState(s.sem1End || '');
  const [sem2End, setSem2End]     = useState(s.sem2End || '');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    setYearStart(s.yearStart || ''); setYearEnd(s.yearEnd || '');
    setSem1End(s.sem1End || ''); setSem2End(s.sem2End || '');
  }, [s.yearStart, s.yearEnd, s.sem1End, s.sem2End]);

  const handleSave = async () => {
    setSaving(true);
    await setSchoolSetting('yearStart', yearStart);
    await setSchoolSetting('yearEnd', yearEnd);
    await setSchoolSetting('sem1End', sem1End);
    await setSchoolSetting('sem2End', sem2End);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const currentRow = state.schoolYears.find(y => y.year === state.currentYear);
  const isArchived = currentRow?.isArchived === true || currentRow?.isArchived === 'TRUE';

  return (
    <Card>
      <CardHeader title="Навчальний рік" subtitle={`Редагується: ${state.currentYear}${isArchived ? ' (архівний)' : ''}`} />
      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:11.5, color:'var(--text3)' }}>
          «Кінець року» — це останній день, коли гуртки можуть проводити заняття (включно з літніми місяцями, якщо гурток працює влітку).
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Початок року</label>
            <Input type="date" value={yearStart} onChange={setYearStart} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Кінець року</label>
            <Input type="date" value={yearEnd} onChange={setYearEnd} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Кінець І півріччя</label>
            <Input type="date" value={sem1End} onChange={setSem1End} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Кінець ІІ півріччя</label>
            <Input type="date" value={sem2End} onChange={setSem2End} />
          </div>
        </div>
        <Btn size="sm" onClick={handleSave} disabled={saving || isArchived}>
          {saving ? 'Збереження...' : <><i className="ti ti-check" /> Зберегти</>}
        </Btn>
        {isArchived && <div style={{ fontSize:12, color:'var(--text3)' }}><i className="ti ti-lock" /> Архівний рік — дати редагувати не можна</div>}
        {saved && <div style={{ fontSize:12, color:'var(--success)' }}><i className="ti ti-circle-check" /> Збережено. Натисни «Синхронізувати з КТП» в журналі кожного гуртка.</div>}
      </div>

      <div style={{ borderTop:'0.5px solid var(--border)' }}>
        <RolloverPanel state={state} rolloverToNewYear={rolloverToNewYear} onModalChange={onModalChange} />
      </div>
    </Card>
  );
}

// Перехід на новий навчальний рік: копіює активні гуртки + КТП-шаблон у новий рік.
function RolloverPanel({ state, rolloverToNewYear, onModalChange }) {
  const [open, setOpen] = useState(false);
  const [toYear, setToYear] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd]     = useState('');
  const [sem1End, setSem1End]     = useState('');
  const [sem2End, setSem2End]     = useState('');
  const [running, setRunning]     = useState(false);
  const [result, setResult]       = useState(null);

  const openModal  = () => { setOpen(true); onModalChange?.(true); };
  const closeModal = () => { setOpen(false); onModalChange?.(false); setResult(null); };

  const currentYearRow = state.schoolYears.find(y => y.year === state.currentYear);
  const isCurrentArchived = currentYearRow?.isArchived === true || currentYearRow?.isArchived === 'TRUE';

  const handleRun = async () => {
    if (!toYear.trim()) return;
    setRunning(true);
    try {
      const res = await rolloverToNewYear(toYear.trim(), { yearStart, yearEnd, sem1End, sem2End });
      setResult(res);
    } finally { setRunning(false); }
  };

  return (
    <div style={{ padding:'14px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600 }}>Перехід на новий навчальний рік</div>
          <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>
            Створює абсолютно новий, порожній рік — без гуртків, учнів і КТП. Усе, що зберігається з {state.currentYear} — це PDF-журнали в архіві.
          </div>
        </div>
        <Btn size="sm" variant="secondary" onClick={openModal}><i className="ti ti-calendar-plus" /> Почати</Btn>
      </div>

      {!isCurrentArchived && (
        <div style={{ fontSize:11.5, color:'var(--amber)', marginTop:8, display:'flex', alignItems:'center', gap:5 }}>
          <i className="ti ti-alert-triangle" /> Рекомендуємо спочатку архівувати {state.currentYear} (нижче, в «Експорт журналів») — після переходу дані поточного року залишаться доступні лише через перемикач року, а не як PDF, доки не заархівуєш.
        </div>
      )}

      <Modal open={open} onClose={closeModal} title="Перехід на новий навчальний рік" maxWidth={480}>
        {result ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {result.ok ? (
              <>
                <div style={{ fontSize:13, color:'var(--success)', display:'flex', alignItems:'center', gap:6 }}>
                  <i className="ti ti-circle-check" style={{ fontSize:18 }} /> Новий рік створено
                </div>
                <div style={{ fontSize:12.5, color:'var(--text2)' }}>
                  Інтерфейс перемкнувся на <strong>{toYear}</strong>. Тепер додай гуртки, керівників і КТП — рік починається з нуля.
                </div>
              </>
            ) : (
              <div style={{ fontSize:13, color:'var(--danger)' }}><i className="ti ti-alert-circle" /> {result.error}</div>
            )}
            <Btn onClick={closeModal}>Закрити</Btn>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ fontSize:12.5, color:'var(--text2)' }}>
              Поточний рік <strong>{state.currentYear}</strong> залишиться у системі — до нього завжди можна повернутись через перемикач року вгорі.
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Назва нового навчального року</label>
              <Input value={toYear} onChange={setToYear} placeholder="Наприклад: 2027–2028" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Початок року</label>
                <Input type="date" value={yearStart} onChange={setYearStart} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Кінець року</label>
                <Input type="date" value={yearEnd} onChange={setYearEnd} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Кінець І півріччя</label>
                <Input type="date" value={sem1End} onChange={setSem1End} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Кінець ІІ півріччя</label>
                <Input type="date" value={sem2End} onChange={setSem2End} />
              </div>
            </div>
            <Btn onClick={handleRun} disabled={running || !toYear.trim()}>
              {running ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Виконується...</> : <><i className="ti ti-check" /> Створити {toYear || 'новий рік'}</>}
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ===================== КАНІКУЛИ =====================
const SEASON_TYPES = [
  { type: 'autumn', label: 'Осінні канікули', icon: 'ti-leaf' },
  { type: 'winter', label: 'Зимові канікули', icon: 'ti-snowflake' },
  { type: 'spring', label: 'Весняні канікули', icon: 'ti-flower' },
  { type: 'summer', label: 'Літні канікули', icon: 'ti-sun' },
];

function HolidaysManager({ state, addHoliday, removeHoliday, toggleHoliday, setSeasonHoliday, cleanupHolidaysData, onModalChange }) {
  const yearHolidays = state.holidays.filter(h => !h.year || h.year === state.currentYear);
  const seasonRows = SEASON_TYPES.map(s => ({
    ...s,
    record: yearHolidays.find(h => h.type === s.type),
  }));
  const customHolidays = yearHolidays.filter(h => (h.type === 'custom' || !h.type) && h.id);
  const brokenCount = state.holidays.filter(h => !h.id).length;

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteError, setDeleteError]     = useState('');
  const [cleaning, setCleaning]           = useState(false);

  const openModal  = (fn) => { fn(); onModalChange?.(true); };
  const closeModal = (fn) => { fn(); onModalChange?.(false); };

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await removeHoliday(deleteTarget.id);
      closeModal(() => setDeleteTarget(null));
    } catch(err) {
      setDeleteError(err.message || 'Не вдалось видалити');
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try { await cleanupHolidaysData(); } finally { setCleaning(false); }
  };

  return (
    <Card>
      <CardHeader title="Канікули" subtitle={`Календар на ${state.currentYear} рік — система автоматично пропускає ці дати при генерації журналу`} />

      {brokenCount > 0 && (
        <div style={{ padding:'10px 18px', background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, fontSize:12 }}>
          <span style={{ color:'#7A4208', display:'flex', alignItems:'center', gap:6 }}>
            <i className="ti ti-alert-triangle" /> Знайдено {brokenCount} зіпсованих записів (без id) — вони приховані зі списку.
          </span>
          <Btn size="sm" variant="secondary" onClick={handleCleanup} disabled={cleaning}>
            {cleaning ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Очищення...</> : 'Очистити'}
          </Btn>
        </div>
      )}

      <div>
        {seasonRows.map(s => (
          <SeasonHolidayRow key={s.type} season={s} onSave={setSeasonHoliday} />
        ))}
      </div>

      <div style={{ borderTop:'0.5px solid var(--border)', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:12.5, fontWeight:600 }}>Додаткові канікули / вихідні</div>
        <Btn size="sm" variant="secondary" onClick={() => openModal(() => setShowAddCustom(true))}><i className="ti ti-plus" /> Додати</Btn>
      </div>

      {customHolidays.length > 0 && (
        <div>
          {customHolidays.map(h => {
            const enabled = h.enabled !== false;
            return (
              <CustomHolidayRow key={h.id} holiday={h} enabled={enabled} onToggle={toggleHoliday} onDelete={() => openModal(() => setDeleteTarget(h))} />
            );
          })}
        </div>
      )}

      <HolidayModal open={showAddCustom} onClose={() => closeModal(() => setShowAddCustom(false))}
        onSave={async (data) => { await addHoliday({ ...data, year: state.currentYear, type: 'custom', enabled: true }); closeModal(() => setShowAddCustom(false)); }} />

      <Confirm
        open={!!deleteTarget}
        title="Видалити період канікул?"
        message={deleteError || `"${deleteTarget?.name}" буде видалено з календаря.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteError(''); closeModal(() => setDeleteTarget(null)); }}
      />
    </Card>
  );
}

// Простий перемикач-чекбокс (квадратик з галочкою) — використовується для "канікули активовано"
function CheckToggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width:18, height:18, borderRadius:5, flexShrink:0, cursor:'pointer',
      border: checked ? 'none' : '1.5px solid var(--border2)',
      background: checked ? 'var(--success)' : 'transparent',
      display:'flex', alignItems:'center', justifyContent:'center', padding:0,
    }}>
      {checked && <i className="ti ti-check" style={{ fontSize:12, color:'#fff' }} />}
    </button>
  );
}

// Один рядок довільної канікули: галочка увімкнено/вимкнено + видалення, з показом помилки.
function CustomHolidayRow({ holiday, enabled, onToggle, onDelete }) {
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const handleToggle = async (v) => {
    setBusy(true); setError('');
    try { await onToggle(holiday.id, v); }
    catch(err) { setError(err.message || 'Не вдалось змінити'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ borderTop:'0.5px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 18px', opacity: enabled ? 1 : 0.5 }}>
        <CheckToggle checked={enabled} onChange={handleToggle} />
        <span style={{ fontSize:13, fontWeight:500, flex:1 }}>{holiday.name}</span>
        <span style={{ fontSize:12, color:'var(--text2)', whiteSpace:'nowrap' }}>{holiday.startDate} — {holiday.endDate}</span>
        {busy && <i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite', color:'var(--text3)', fontSize:13 }} />}
        <button onClick={onDelete} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}><i className="ti ti-trash" /></button>
      </div>
      {error && (
        <div style={{ padding:'0 18px 8px 38px', fontSize:11.5, color:'var(--danger)', display:'flex', alignItems:'center', gap:5 }}>
          <i className="ti ti-alert-circle" /> {error}
        </div>
      )}
    </div>
  );
}

// Один рядок сезонних канікул (осінь/зима/весна/літо): назва, дати, галочка увімкнено/вимкнено.
// Якщо запису ще немає для цього року — показує порожні поля; збереження створює запис.
function SeasonHolidayRow({ season, onSave }) {
  const rec = season.record;
  const [startDate, setStartDate] = useState(rec?.startDate || '');
  const [endDate, setEndDate]     = useState(rec?.endDate || '');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const enabled = rec ? rec.enabled !== false : true;

  useEffect(() => {
    setStartDate(rec?.startDate || '');
    setEndDate(rec?.endDate || '');
  }, [rec?.startDate, rec?.endDate]);

  const persist = async (overrides = {}) => {
    setSaving(true);
    setError('');
    try {
      await onSave({
        type: season.type, name: season.label,
        startDate: overrides.startDate ?? startDate,
        endDate: overrides.endDate ?? endDate,
        enabled: overrides.enabled ?? enabled,
      });
    } catch(err) {
      setError(err.message || 'Не вдалось зберегти');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', borderTop:'0.5px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', opacity: enabled ? 1 : 0.45 }}>
        <CheckToggle checked={enabled} onChange={(v) => persist({ enabled: v })} />
        <i className={`ti ${season.icon}`} style={{ color:'var(--text3)', fontSize:16, width:18, flexShrink:0 }} />
        <span style={{ fontSize:13, fontWeight:500, minWidth:130, flexShrink:0 }}>{season.label}</span>
        <Input type="date" value={startDate} onChange={(v) => { setStartDate(v); }} onBlur={() => endDate && persist({ startDate })} disabled={!enabled} />
        <span style={{ color:'var(--text3)', fontSize:12 }}>—</span>
        <Input type="date" value={endDate} onChange={(v) => { setEndDate(v); }} onBlur={() => startDate && persist({ endDate })} disabled={!enabled} />
        {saving && <i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite', color:'var(--text3)', fontSize:13 }} />}
      </div>
      {error && (
        <div style={{ padding:'0 18px 10px 48px', fontSize:11.5, color:'var(--danger)', display:'flex', alignItems:'center', gap:5 }}>
          <i className="ti ti-alert-circle" /> {error}
        </div>
      )}
    </div>
  );
}

function HolidayModal({ open, onClose, onSave }) {
  const [name, setName]           = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [saving, setSaving]       = useState(false);

  const reset = () => { setName(''); setStartDate(''); setEndDate(''); };

  const handleSave = async () => {
    if (!name.trim() || !startDate || !endDate) return;
    setSaving(true);
    await onSave({ name: name.trim(), startDate, endDate });
    reset();
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Новий період канікул">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Назва</label>
          <Input value={name} onChange={setName} placeholder="Наприклад: Зимові канікули" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>З</label>
            <Input type="date" value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>До</label>
            <Input type="date" value={endDate} onChange={setEndDate} />
          </div>
        </div>
        <Btn onClick={handleSave} disabled={saving || !name.trim() || !startDate || !endDate} style={{ marginTop:4 }}>
          {saving ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Збереження...</> : <><i className="ti ti-check" /> Додати</>}
        </Btn>
      </div>
    </Modal>
  );
}
