import { useState } from 'react';
import { useLanguage } from './Language';
import testPhoto from './assets/test-nature.png';
export function TestMoment({letter=false}:{letter?:boolean}) {
  const {t}=useLanguage();const [thanked,setThanked]=useState(false);
  return <figure className="test-moment"><figcaption><span>{t('测试图片 · 本地预览','Test photo · Local preview')}</span><h2>{letter?t('来自某处的一朵花','A flower from somewhere.'):t('户外一刻','A moment outdoors')}</h2></figcaption><img src={testPhoto} alt={t('阳光下的白色与淡紫色花朵，远处是草地和树木','White and pale purple flowers in the sun, with grass and trees beyond')} loading="lazy"/>{letter&&<button className="mail-thanks" disabled={thanked} onClick={()=>setThanked(true)}>{thanked?t('已体验感谢效果 🌱','Thanks previewed 🌱'):t('测试送出感谢 🌱','Preview thanks 🌱')}</button>}</figure>;
}
