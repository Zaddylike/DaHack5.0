import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
type Language = 'zh' | 'en';
const LanguageContext = createContext({ language: 'en' as Language, toggle: () => {}, t: (_zh: string, en: string) => en });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => { try { return localStorage.getItem('bloombreak-language') === 'zh' ? 'zh' : 'en'; } catch { return 'en'; } });
  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; try { localStorage.setItem('bloombreak-language', language); } catch {} }, [language]);
  return <LanguageContext.Provider value={{ language, toggle: () => setLanguage(l => l === 'zh' ? 'en' : 'zh'), t: (zh, en) => language === 'zh' ? zh : en }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
export function LanguageSwitch() { const { language, toggle } = useLanguage(); return <button className="language-switch" onClick={toggle} aria-label={language === 'zh' ? 'Switch to English' : '切换中文'}>{language === 'zh' ? 'EN' : '中文'}</button>; }
export const englishFlowers = [
  { name: 'California poppy', season: 'Spring · Summer', note: 'Golden cup-shaped flowers open in daylight and fold closed toward evening.' },
  { name: 'Daisy', season: 'Spring · Early summer', note: 'A golden centre surrounded by slender white petals, close to the ground.' },
  { name: 'Cornflower', season: 'Spring · Summer', note: 'Fine blue petals bring a small piece of the sky into the garden.' },
  { name: 'Common poppy', season: 'Spring · Summer', note: 'Papery petals sit on long, slender stems and move with the wind.' },
  { name: 'Cosmos', season: 'Summer · Autumn', note: 'Light flowers and finely divided leaves bring soft colour to late summer.' },
];
