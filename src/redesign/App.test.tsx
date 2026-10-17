// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { AuthContext } from '../context/AuthContext';
import { freshSave } from './model';
vi.mock('./Garden3D', () => ({ default: () => <div aria-label="3D scene"/> }));
const key = 'bloombreak-local-v1';
function mount(path = '/preview') { return render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ user: null, loading: false, error: '' }}><App/></AuthContext.Provider></MemoryRouter>); }
beforeEach(() => { localStorage.clear(); localStorage.setItem('bloombreak-language', 'zh'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('local experience', () => {
  it('defaults to English when no language preference exists', () => {
    localStorage.removeItem('bloombreak-language');
    localStorage.setItem(key, JSON.stringify({ ...freshSave, storySeen: true }));
    mount();
    expect(screen.getByRole('button', { name: 'Start outdoor time' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
  });
  it('switches the whole experience to English and remembers the choice', () => {
    localStorage.setItem(key, JSON.stringify({ ...freshSave, storySeen: true }));
    const first = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Switch to English' }));
    expect(screen.getByRole('button', { name: 'Start outdoor time' })).toBeTruthy();
    expect(screen.getByText('OUTDOORS')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByRole('button', { name: /Field guide/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Save/ })).toBeTruthy();
    first.unmount(); mount();
    expect(screen.getByRole('button', { name: 'Start outdoor time' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
  });
  it('plays six story beats once and persists the completed introduction', () => {
    const first = mount();
    expect(screen.getByText('城市的声音，好像从来没有停过。')).toBeTruthy();
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: '继续' }));
    fireEvent.click(screen.getByRole('button', { name: '进入' }));
    expect(screen.getByRole('button', { name: '开始户外计时' })).toBeTruthy();
    first.unmount(); mount();
    expect(screen.queryByRole('button', { name: '继续' })).toBeNull();
    expect(screen.getByRole('button', { name: '开始户外计时' })).toBeTruthy();
  });
  it('preserves a running break across pages and reload, then saves elapsed time once', () => {
    localStorage.setItem(key, JSON.stringify({ ...freshSave, storySeen: true }));
    const date = vi.spyOn(Date, 'now').mockReturnValue(1000000);
    const first = mount();
    fireEvent.click(screen.getByRole('button', { name: '开始户外计时' }));
    fireEvent.click(screen.getByRole('button', { name: '花园' }));
    first.unmount(); date.mockReturnValue(1075000); mount();
    expect(screen.getByText('01:15')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '结束户外计时' }));
    expect(JSON.parse(localStorage.getItem(key)!).total).toBe(75);
    expect(JSON.parse(localStorage.getItem(key)!).started).toBeNull();
  });
  it('persists player color and keeps it when returning to the timer', () => {
    localStorage.setItem(key, JSON.stringify({ ...freshSave, storySeen: true }));
    mount('/preview/profile');
    fireEvent.click(screen.getByRole('button', { name: '湖水蓝' }));
    expect(JSON.parse(localStorage.getItem(key)!).color).toBe('blue');
    fireEvent.click(screen.getByRole('button', { name: '计时' }));
    expect(document.querySelector('.theme-blue .player')).toBeTruthy();
  });
});



describe('account entry', () => {
  it('toggles password visibility without submitting', () => {
    mount('/login');
    const password=screen.getByLabelText('密码') as HTMLInputElement;
    expect(password.type).toBe('password');
    fireEvent.click(screen.getByRole('button',{name:'显示密码'}));
    expect(password.type).toBe('text');
    fireEvent.click(screen.getByRole('button',{name:'隐藏密码'}));
    expect(password.type).toBe('password');
  });
  it('starts a named local garden without replacing existing progress', () => {
    localStorage.setItem(key,JSON.stringify({...freshSave,total:1234,storySeen:true}));
    mount('/login');
    fireEvent.click(screen.getByRole('button',{name:'新用户'}));
    fireEvent.change(screen.getByLabelText('名字'),{target:{value:'小林'}});
    fireEvent.click(screen.getByRole('button',{name:'开始'}));
    expect(screen.getByRole('button',{name:'开始户外计时'})).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({name:'小林',total:1234,storySeen:true});
  });
});

it('shows the new account panels in local preview and persists actual completed activity', () => {
  localStorage.setItem(key,JSON.stringify({...freshSave,storySeen:true}));
  const date=vi.spyOn(Date,'now').mockReturnValue(2000000);
  const first=mount();
  fireEvent.click(screen.getByRole('button',{name:'开始户外计时'}));
  date.mockReturnValue(2065000);
  fireEvent.click(screen.getByRole('button',{name:'结束户外计时'}));
  fireEvent.click(screen.getByRole('button',{name:'个人'}));
  for(const name of ['Achievements','Flower Collection','Recent Activity']) expect(screen.getByRole('heading',{name})).toBeTruthy();
  expect(screen.getByText('Nature break')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(key)!).sessions[0].duration_seconds).toBe(65);
  first.unmount();mount('/preview/profile');
  expect(screen.getByText('Nature break')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(key)!).sessions).toHaveLength(1);
});
