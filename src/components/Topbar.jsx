import { SCHOOL_NAME } from '../data/constants';

const TABS = [
  { id:'gurtky',     icon:'ti-users',            label:'Гуртки' },
  { id:'journal',    icon:'ti-book',             label:'Журнал' },
  { id:'ktp',        icon:'ti-calendar-event',   label:'КТП' },
];

export default function Topbar({ page, setPage, syncing, onReload, user, onLogout, currentYear, schoolYears, onSwitchYear }) {
  const tabs = user?.isAdmin ? [...TABS, { id:'admin', icon:'ti-lock', label:'Адмін' }] : TABS;
  const sortedYears = [...(schoolYears || [])].sort((a,b) => a.year.localeCompare(b.year));

  return (
    <header style={{ background:'var(--surface)', borderBottom:'0.5px solid var(--border)', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
      <div className="topbar-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:56 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0, flexShrink:0 }}>
          <div style={{ display:'flex', flexDirection:'column', width:16, height:11, borderRadius:2, overflow:'hidden', flexShrink:0 }}>
            <div style={{ flex:1, background:'var(--ua-blue)' }} />
            <div style={{ flex:1, background:'var(--ua-yellow)' }} />
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Школа №313 — Гурткова робота</div>
            <div className="topbar-sub" style={{ fontSize:10, color:'var(--text3)' }}>{user?.isAdmin ? 'Адміністратор' : user?.fullName}</div>
          </div>
        </div>

        <nav className="nav-wrap" style={{ display:'flex', gap:2, flexShrink:0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setPage(t.id)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, border:'none',
              background: page===t.id ? 'linear-gradient(135deg,var(--ua-blue),var(--ua-blue-light))' : 'transparent',
              color: page===t.id ? '#fff' : 'var(--text2)', fontSize:12.5, fontWeight: page===t.id?600:400,
              whiteSpace:'nowrap', cursor:'pointer',
            }}>
              <i className={`ti ${t.icon}`} />{t.label}
            </button>
          ))}
        </nav>

        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {sortedYears.length > 0 && (
            <select value={currentYear} onChange={e => onSwitchYear?.(e.target.value)} title="Навчальний рік" style={{
              padding:'6px 10px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--surface)',
              color:'var(--text)', fontSize:12.5, fontWeight:600, cursor:'pointer',
            }}>
              {sortedYears.map(y => (
                <option key={y.year} value={y.year}>{y.year}{(y.isArchived === true || y.isArchived === 'TRUE') ? ' (архів)' : ''}</option>
              ))}
            </select>
          )}
          {syncing
            ? <i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite', color:'var(--text3)' }} />
            : <i className="ti ti-cloud-check" style={{ color:'var(--success)' }} title="Синхронізовано" />
          }
          <button onClick={onReload} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:15 }}><i className="ti ti-refresh" /></button>
          <button onClick={onLogout} style={{ background:'var(--surface2)', border:'none', cursor:'pointer', color:'var(--text2)', fontSize:12, padding:'6px 10px', borderRadius:8, display:'flex', alignItems:'center', gap:5 }}>
            <i className="ti ti-logout" /> Вийти
          </button>
        </div>
      </div>
    </header>
  );
}
