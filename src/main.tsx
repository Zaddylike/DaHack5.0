import { Preview } from "./Preview";
import { ProtectedRoute } from "./ProtectedRoute";
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth, authService } from './context/AuthContext';
import { BreakProvider, useBreak } from './context/BreakContext';
import { DemoProvider, useDemo } from './context/DemoContext';
import { loadDisplayName, supabase } from './api';
import { Break } from './pages/Break';
import { Garden } from './pages/Garden';
import { Profile } from './pages/Profile';
import './style.css';
function Login() {
  const { user, loading } = useAuth(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (loading) return <p>Restoring session…</p>; if (user) return <Navigate to="/break" replace/>;
  return <section><p className="eyebrow">WELCOME TO BLOOMBREAK</p><h1>A fresh start.</h1><p>Sign in with your assigned demo account.</p>{!supabase && <p role="alert">請先設定 .env.local 的 Supabase URL 與 publishable key。</p>}<form onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); setError(''); try { await authService.login(email, password); } catch (e) { setError(e instanceof Error ? e.message : '登入失敗'); } finally { setBusy(false); } }}><label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label><button className="primary" disabled={!supabase || busy}>{busy ? 'Signing in…' : 'Sign in'}</button>{error && <p role="alert">{error}</p>}</form></section>;
}
function Layout() { const [error, setError] = useState(''); return <BreakProvider><DemoProvider><header><NavLink className="brand" to="/break">✿ BloomBreak</NavLink><nav><NavLink to="/break">Break</NavLink><NavLink to="/garden">Garden</NavLink><NavLink to="/profile">Profile</NavLink><button onClick={() => authService.logout().catch(e => setError(e.message))}>Sign out</button></nav></header>{error && <p role="alert">{error}</p>}<Outlet/></DemoProvider></BreakProvider>; }
function GardenRoute() { const { growth } = useBreak(); const demo = useDemo(); return <Garden growth={growth} demo={demo}/>; }
function ProfileRoute() {
  const data = useBreak();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  useEffect(() => {
    let alive = true;
    setProfileLoading(true);
    setProfileError('');
    loadDisplayName().then(name => { if (alive) setDisplayName(name ?? undefined); })
      .catch(reason => { if (alive) setProfileError(reason instanceof Error ? reason.message : 'Unable to load your name'); })
      .finally(() => { if (alive) setProfileLoading(false); });
    return () => { alive = false; };
  }, [user?.id]);
  return <Profile statistics={data.statistics} sessions={data.sessions} achievements={data.achievements} flowersCollected={data.flowersCollected} displayName={displayName} loading={data.loading || profileLoading} error={data.error || profileError}/>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><AuthProvider><Routes>{import.meta.env.DEV && <Route path="/preview" element={<Preview/>}/>}<Route path="/login" element={<Login/>}/><Route element={<ProtectedRoute/>}><Route element={<Layout/>}><Route path="/break" element={<Break/>}/><Route path="/garden" element={<GardenRoute/>}/><Route path="/profile" element={<ProfileRoute/>}/></Route></Route><Route path="*" element={<Navigate to="/break" replace/>}/></Routes></AuthProvider></BrowserRouter></React.StrictMode>);
