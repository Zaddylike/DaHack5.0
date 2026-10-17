import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../context/AuthContext';
import { supabase } from '../api';
import { LanguageSwitch, useLanguage } from './Language';
import { Flower } from './Art';
import { freshSave, validSave } from './model';

export function AuthEntry() {
  const { t } = useLanguage(), navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'new'>('login');
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [name, setName] = useState('');
  const [visible, setVisible] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setError('');
    if (mode === 'new') {
      try {
        const raw = localStorage.getItem('bloombreak-local-v1');
        const previous: unknown = raw ? JSON.parse(raw) : null;
        if (raw && !validSave(previous)) { setError('save'); return; }
        const save = validSave(previous) ? previous : { ...freshSave };
        localStorage.setItem('bloombreak-local-v1', JSON.stringify({ ...save, name: name.trim() || save.name }));
        navigate('/preview');
      } catch { setError('save'); }
      return;
    }
    if (!supabase) { setError('connection'); return; }
    setBusy(true);
    try { await authService.login(email.trim(), password); navigate('/break'); }
    catch { setError('login'); } finally { setBusy(false); }
  }
  return <main className="auth-page">
    <header className="auth-header"><a href="/login" className="wordmark">bloom<span>break</span></a><LanguageSwitch/></header>
    <div className="auth-layout">
      <aside className="auth-landscape" aria-label={t('自然花卉插画', 'Botanical illustration')}>
        <div className="auth-orbit"/><div className="auth-flower auth-flower-one"><Flower kind={1}/></div><div className="auth-flower auth-flower-two"><Flower kind={4}/></div><div className="auth-flower auth-flower-three"><Flower kind={0}/></div>
        <div className="auth-art-copy"><span>OUTSIDE, AT YOUR PACE</span><p>{t('把时间，留给自然。', 'A little time outside.')}</p></div>
      </aside>
      <section className="auth-form-panel">
        <div className="auth-tabs" aria-label={t('选择入口', 'Choose how to enter')}><button type="button" aria-pressed={mode === 'login'} disabled={busy} onClick={() => { setMode('login'); setError(''); }}>{t('登录', 'Sign in')}</button><button type="button" aria-pressed={mode === 'new'} disabled={busy} onClick={() => { setMode('new'); setError(''); }}>{t('新用户', 'Get started')}</button></div>
        <h1>{mode === 'login' ? t('欢迎回来。', 'Welcome back.') : t('你的花园，从这里开始。', 'Your garden starts here.')}</h1>
        <p className="auth-subtitle">{mode === 'login' ? t('继续记录你的户外时光。', 'Make room for time outdoors.') : t('取个名字，开始第一段户外时光。', 'A name, a walk, a new beginning.')}</p>
        <form onSubmit={submit}>
          {mode === 'login' ? <><label htmlFor="auth-email">{t('邮箱', 'Email')}</label><input id="auth-email" type="email" autoComplete="username" placeholder="you@example.com" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)}/><label htmlFor="auth-password">{t('密码', 'Password')}</label><div className="auth-password"><input id="auth-password" type={visible ? 'text' : 'password'} autoComplete="current-password" required disabled={busy} value={password} onChange={e => setPassword(e.target.value)}/><button type="button" aria-label={visible ? t('隐藏密码', 'Hide password') : t('显示密码', 'Show password')} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? t('隐藏', 'Hide') : t('显示', 'Show')}</button></div></> : <><label htmlFor="auth-name">{t('名字', 'Name')}</label><input id="auth-name" autoComplete="nickname" maxLength={40} required value={name} onChange={e => setName(e.target.value)} placeholder={t('怎么称呼你？', 'What should we call you?')}/></>}
          {error && <p className="auth-error" role="alert">{error === 'save' ? t('无法保存，请检查浏览器存储设置；已有存档未更改。', 'Could not save. Check browser storage; your existing garden is unchanged.') : error === 'connection' ? t('账号服务暂不可用，你可以先体验本地花园。', 'Account service unavailable. You can try a local garden.') : t('登录失败，请确认邮箱、密码及演示账号权限。', 'Could not sign in. Check your email, password and demo access.')}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? t('登录中…', 'Signing in…') : mode === 'login' ? t('进入花园', 'Enter your garden') : t('开始', 'Begin')}<span aria-hidden="true">↗</span></button>
        </form>
        <p className="auth-note">{mode === 'login' ? t('目前仅向受邀演示账号开放登录。', 'Sign-in is currently available to invited demo accounts.') : t('本地体验，无需注册。存档保存在此浏览器；已有花园会保留。', 'No account needed. Saved in this browser; your existing garden is kept.')}</p>
        {mode === 'login' && <button className="auth-guest" disabled={busy} onClick={() => navigate('/preview')}>{t('先体验一下', 'Explore without an account')} <span aria-hidden="true">→</span></button>}
      </section>
    </div>
    <footer className="auth-footer">{t('每一段户外时光，都有生长的痕迹。', 'Time outside. Something growing.')}</footer>
  </main>;
}
