import { useState } from 'react';
import { apiLogin } from '../data/api';
import { SCHOOL_NAME, SCHOOL_NAME_FULL } from '../data/constants';

export default function LoginScreen({ state, onLogin }) {
  const [login, setLogin]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      // Перевірка адміна локально (пароль з settings)
      if (login.trim().toLowerCase() === 'admin') {
        if (password === state.adminPassword) {
          onLogin({ isAdmin: true, fullName: 'Адміністратор' });
          return;
        }
        setError('Невірний пароль адміністратора');
        return;
      }

      const result = await apiLogin(login.trim(), password);
      onLogin({ id: result.leader.id, fullName: result.leader.fullName, login: result.leader.login });
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      <div className="fade-up" style={{ background:'var(--surface)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', padding:'36px 32px', maxWidth:380, width:'100%' }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'flex', flexDirection:'column', width:28, height:20, borderRadius:5, overflow:'hidden', margin:'0 auto 16px', boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
            <div style={{ flex:1, background:'#0057B7' }} />
            <div style={{ flex:1, background:'#FFD700' }} />
          </div>
          <div style={{ fontSize:16, fontWeight:700, fontFamily:'Unbounded,sans-serif', lineHeight:1.3 }}>{SCHOOL_NAME}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{SCHOOL_NAME_FULL}</div>
          <div style={{ fontSize:13, color:'var(--ua-blue)', marginTop:10, fontWeight:600 }}>Гурткова робота</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Логін</label>
            <input value={login} onChange={e=>setLogin(e.target.value)} placeholder="Введіть логін" autoFocus
              style={{ padding:'10px 14px', borderRadius:8, border:'1.5px solid var(--border2)', width:'100%', fontSize:14 }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>Пароль</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" autoComplete="off" data-lpignore="true"
              style={{ padding:'10px 14px', borderRadius:8, border:'1.5px solid var(--border2)', width:'100%', fontSize:14 }} />
          </div>

          {error && <div style={{ fontSize:12, color:'var(--danger)', display:'flex', alignItems:'center', gap:6 }}><i className="ti ti-alert-circle" />{error}</div>}

          <button type="submit" disabled={loading} style={{
            padding:'11px', borderRadius:8, border:'none', marginTop:6,
            background: loading ? '#6B9FD4' : 'linear-gradient(135deg,#0057B7,#1A6ED4)',
            color:'#fff', fontSize:14, fontWeight:600, cursor: loading?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            {loading ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Вхід...</> : <><i className="ti ti-login" /> Увійти</>}
          </button>
        </form>

        <div style={{ marginTop:20, textAlign:'center', fontSize:11, color:'var(--text3)' }}>
          Облікові записи створює адміністратор системи
        </div>
      </div>
    </div>
  );
}
