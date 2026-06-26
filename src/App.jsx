// src/App.jsx
import { useState, useEffect } from 'react';
import Topbar from './components/Topbar';
import LoginScreen from './components/LoginScreen';
import PageGurtky from './components/PageGurtky';
import PageJournal from './components/PageJournal';
import PageKTP from './components/PageKTP';
import PageAdmin from './components/PageAdmin';
import { useStore } from './data/useStore';
import { SCHOOL_NAME, SCHOOL_NAME_FULL } from './data/constants';

export default function App() {
  const [page, setPage]           = useState('gurtky');
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser]           = useState(null); // {id, fullName, login} або {isAdmin:true}
  const [selectedGurtok, setSelectedGurtok] = useState(null);

  const store = useStore();
  const { state, loading, error, syncing, reload } = store;

  useEffect(() => {
    const saved = sessionStorage.getItem('gurtkova_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    sessionStorage.setItem('gurtkova_user', JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('gurtkova_user');
    setPage('gurtky');
    setSelectedGurtok(null);
  };

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen error={error} onRetry={reload} />;

  if (!user) {
    return <LoginScreen state={state} onLogin={handleLogin} />;
  }

  // Гуртки доступні цьому користувачу за обраний навчальний рік (адмін бачить всі свого року)
  // Звичайний керівник бачить свої гуртки + ті, де він призначений тимчасовою заміною
  const yearGurtky = state.gurtky.filter(g => g.year === state.currentYear);
  const myGurtky = user.isAdmin
    ? yearGurtky
    : yearGurtky.filter(g =>
        g.leaderId === user.id ||
        state.substitutions.some(s => s.gurtokId === g.id && s.substituteLeaderId === user.id)
      );

  const renderPage = () => {
    switch(page) {
      case 'gurtky':
        return (
          <PageGurtky
            state={state} myGurtky={myGurtky} user={user}
            onSelectGurtok={(g) => { setSelectedGurtok(g); setPage('journal'); }}
            addGurtok={store.addGurtok} editGurtok={store.editGurtok} removeGurtok={store.removeGurtok}
            addMember={store.addMember} editMember={store.editMember} removeMember={store.removeMember}
            onModalChange={setModalOpen}
          />
        );
      case 'journal':
        return (
          <PageJournal
            state={state} gurtok={selectedGurtok} myGurtky={myGurtky}
            onSelectGurtok={setSelectedGurtok}
            addLesson={store.addLesson} editLesson={store.editLesson} removeLesson={store.removeLesson}
            syncLessonsFromKtp={store.syncLessonsFromKtp}
            saveAttendance={store.saveAttendance}
            onModalChange={setModalOpen}
          />
        );
      case 'ktp':
        return (
          <PageKTP
            state={state} gurtok={selectedGurtok} myGurtky={myGurtky}
            onSelectGurtok={setSelectedGurtok}
            addKtp={store.addKtp} editKtp={store.editKtp} removeKtp={store.removeKtp} importKtpBatch={store.importKtpBatch}
            onModalChange={setModalOpen}
          />
        );
      case 'admin':
        return (
          <PageAdmin
            state={state} user={user}
            addLeader={store.addLeader} editLeader={store.editLeader} removeLeader={store.removeLeader}
            addGurtok={store.addGurtok} editGurtok={store.editGurtok} removeGurtok={store.removeGurtok}
            addSubstitution={store.addSubstitution} removeSubstitution={store.removeSubstitution}
            addHoliday={store.addHoliday} removeHoliday={store.removeHoliday} toggleHoliday={store.toggleHoliday} setSeasonHoliday={store.setSeasonHoliday} cleanupHolidaysData={store.cleanupHolidaysData}
            setSchoolSetting={store.setSchoolSetting}
            setAdminPassword={store.setAdminPassword}
            rolloverToNewYear={store.rolloverToNewYear}
            archiveCurrentYear={store.archiveCurrentYear}
            onModalChange={setModalOpen}
          />
        );
      default: return null;
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Topbar
        page={page} setPage={setPage} syncing={syncing} onReload={reload}
        user={user} onLogout={handleLogout}
        currentYear={state.currentYear} schoolYears={state.schoolYears} onSwitchYear={store.switchYear}
      />
      <main className="main-wrap" style={{
        maxWidth:1200, margin:'0 auto', padding:'20px 20px 40px',
        filter: modalOpen ? 'blur(5px)' : 'none',
        transition:'filter .2s ease',
        pointerEvents: modalOpen ? 'none' : 'auto',
      }}>
        {renderPage()}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--bg)' }}>
      <div style={{ display:'flex', flexDirection:'column', width:24, height:17, borderRadius:4, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
        <div style={{ flex:1, background:'#0057B7' }} />
        <div style={{ flex:1, background:'#FFD700' }} />
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:17, fontWeight:700, fontFamily:'Unbounded, sans-serif', color:'var(--text)', lineHeight:1.3 }}>
          {SCHOOL_NAME}
        </div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:6 }}>{SCHOOL_NAME_FULL}</div>
        <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Гурткова робота</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text3)', fontSize:13, marginTop:4 }}>
        <i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite', fontSize:18 }} />
        Завантаження даних...
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--bg)', padding:20 }}>
      <i className="ti ti-wifi-off" style={{ fontSize:40, color:'var(--text3)' }} />
      <div style={{ fontSize:15, fontWeight:600 }}>Не вдалось підключитись</div>
      <div style={{ fontSize:13, color:'var(--text2)', textAlign:'center', maxWidth:360 }}>{error}</div>
      <button onClick={onRetry} style={{ padding:'10px 24px', borderRadius:8, background:'linear-gradient(135deg,#0057B7,#1A6ED4)', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
        <i className="ti ti-refresh" /> Спробувати знову
      </button>
    </div>
  );
}
