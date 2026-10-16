import { useState } from 'react';
import { STAGES, type getGrowth } from '../lib/growth';
import type { useDemoState } from '../context/DemoContext';
import './Garden.css';

export type GardenProps = { growth: ReturnType<typeof getGrowth>; demo: ReturnType<typeof useDemoState> };

function PoppyIllustration({ stageIndex }: { stageIndex: number }) {
  return <svg viewBox="0 0 420 340" role="img" aria-label={`${STAGES[stageIndex]} stage of a California Poppy`} className="garden-art" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gardenSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f8f4dd"/><stop offset="1" stopColor="#e6ecd7"/></linearGradient>
      <linearGradient id="gardenSoil" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b98b64"/><stop offset="1" stopColor="#8d624b"/></linearGradient>
    </defs>
    <rect width="420" height="340" rx="24" fill="url(#gardenSky)"/>
    <circle cx="335" cy="72" r="37" fill="#f7df9c" opacity=".78"/>
    <path d="M0 276 C100 248 155 268 210 261 C300 247 344 259 420 246 V340 H0Z" fill="#d1d9b2"/>
    <path d="M0 290 C80 274 145 288 210 282 C300 271 344 283 420 271 V340 H0Z" fill="url(#gardenSoil)"/>
    <path d="M45 302q5-5 10 0m256 12q4-4 8 0m48-18q5-5 10 0" fill="none" stroke="#d3ab7d" strokeWidth="3" strokeLinecap="round" opacity=".6"/>
    {stageIndex === 0 && <g><path d="M202 271c-9-8-7-20 3-24 11-4 20 5 16 14-3 9-11 12-19 10Z" fill="#8f613f" stroke="#704b36" strokeWidth="3"/><path d="M207 251q7 7 6 16" fill="none" stroke="#ba8857" strokeWidth="2"/></g>}
    {stageIndex > 0 && <g strokeLinecap="round" strokeLinejoin="round">
      <path d={stageIndex === 1 ? 'M209 283 C208 266 206 246 211 228' : stageIndex === 2 ? 'M209 283 C205 249 213 204 210 180' : 'M209 283 C206 241 215 178 209 133'} fill="none" stroke="#5c8751" strokeWidth={stageIndex === 1 ? 6 : 8}/>
      {stageIndex === 1 && <><path d="M208 247 C188 226 177 231 178 248 C188 254 200 252 208 247Z" fill="#75a56a"/><path d="M208 240 C229 222 239 232 236 248 C224 252 215 248 208 240Z" fill="#6e9d61"/></>}
      {stageIndex >= 2 && <><path d="M209 233 C169 207 151 216 157 240 C176 252 199 244 209 233Z" fill="#75a56a"/><path d="M211 209 C247 180 263 193 257 218 C239 226 220 218 211 209Z" fill="#6e9d61"/><path d="M211 258 C238 243 251 249 247 266 C232 272 218 266 211 258Z" fill="#86ae73"/></>}
      {stageIndex === 2 && <path d="M209 179q-8-18 2-24 13 8 3 24" fill="#83a972"/>}
      {stageIndex === 3 && <><path d="M211 134 C190 120 195 93 210 91 C228 98 230 119 211 134Z" fill="#ec9850" stroke="#bf7547" strokeWidth="3"/><path d="M210 134 C197 124 196 111 200 105M210 134 C222 122 224 111 220 103" fill="none" stroke="#6e985b" strokeWidth="4"/></>}
      {stageIndex === 4 && <g transform="translate(210 112)"><path d="M0 0 C-12-15-47-55-27-69 C-9-76 1-45 0-10 C0-45 14-76 31-66 C48-49 13-14 0 0 C16-11 47-23 53-4 C56 13 22 20 0 7 C-22 20-55 13-53-4 C-48-23-16-11 0 0Z" fill="#f6a540" stroke="#dc7d31" strokeWidth="3"/><path d="M0-7 C-13-22-30-45-22-57 M0-8 C14-26 29-45 25-56" fill="none" stroke="#ffd581" strokeWidth="4" opacity=".8"/><circle cy="1" r="13" fill="#d86e2d"/><circle cy="1" r="6" fill="#754933"/></g>}
    </g>}
  </svg>;
}

export function Garden({ growth, demo }: GardenProps) {
  const [wiggle, setWiggle] = useState(0);
  const stageIndex = demo.enabled ? demo.stageIndex : growth.stageIndex;
  const stage = STAGES[stageIndex];

  return <main className="garden-page mx-auto max-w-5xl px-4 pb-20 pt-12 text-[#314b38] sm:px-6 sm:pt-16">
    <div className="mb-9 text-center">
      <p className="eyebrow">YOUR LITTLE PATCH OF NATURE</p>
      <h1 className="mb-3 mt-4">Garden</h1>
      <p className="m-0 text-[#71816d]">California Poppy <span className="italic">· Eschscholzia californica</span></p>
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
      <div className="relative overflow-hidden rounded-3xl border border-[#dfe7d4] bg-[#edf1e5] p-3 shadow-sm sm:p-5">
        <button type="button" className="garden-illustration-button relative block w-full overflow-hidden rounded-2xl p-0" aria-label={`Wiggle ${stage} plant`} onClick={() => setWiggle(value => value + 1)}>
          <span key={`${stageIndex}-${wiggle}`} className="garden-illustration-motion block"><PoppyIllustration stageIndex={stageIndex}/></span>
          <span className="garden-tbd absolute bottom-3 right-3 rounded-md bg-white/85 px-2 py-1 text-xs font-bold tracking-widest text-[#6a765f]">TBD</span>
        </button>
        <p className="mb-1 mt-4 text-center text-xs text-[#7b8974]">Tap the plant to give it a little wiggle · Illustration placeholder</p>
      </div>

      <div className="flex flex-col justify-center rounded-3xl border border-[#e0e8d9] bg-[#fffefa] p-6 shadow-sm sm:p-8">
        <p className="eyebrow m-0">CURRENT STAGE</p>
        <h2 className="mb-1 mt-3 font-serif text-4xl">{stage}</h2>
        <p className="mt-0 text-sm text-[#73816d]">{demo.enabled ? 'Demo preview only. Your real garden stays unchanged.' : growth.isBloom ? 'Your California Poppy is in bloom.' : 'Each completed break helps your poppy grow.'}</p>
        <div className="my-5 flex justify-between gap-2" aria-label="Five growth stages">{STAGES.map((item, index) => <div key={item} className="min-w-0 flex-1 text-center"><span className={`mx-auto block h-3 w-3 rounded-full ${index <= stageIndex ? 'bg-[#63835b]' : 'bg-[#d9e1d2]'}`}/><span className={`mt-2 block text-[10px] sm:text-xs ${index === stageIndex ? 'font-bold text-[#355b3b]' : 'text-[#889584]'}`}>{item}</span></div>)}</div>
        <div className="border-t border-[#e4eadf] pt-5">
          <div className="mb-2 flex justify-between text-sm"><span>Official growth</span><strong>{Math.floor(growth.percent)}%</strong></div>
          <progress className="garden-progress w-full" aria-label="Official plant growth" max="100" value={growth.percent}/>
          <p className="mb-0 text-xs text-[#81907c]">Bloom at 210 completed minutes. This is a game goal.</p>
        </div>
      </div>
    </div>

    <div className="mt-6 rounded-3xl border border-[#e0e8d9] bg-[#fffefa] p-5 sm:p-6">
      <label className="garden-demo-label flex items-center gap-3 text-left font-semibold"><input type="checkbox" checked={demo.enabled} onChange={event => demo.setEnabled(event.target.checked)}/> Preview all five stages (demo only)</label>
      {demo.enabled && <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={demo.previous} disabled={stageIndex === 0}>← Previous</button><button type="button" onClick={demo.next} disabled={stageIndex === 4}>Next →</button><button type="button" onClick={demo.reset}>Reset to Seed</button></div>}
      <p className="mb-0 mt-3 text-xs text-[#81907c]">Demo controls never add break time, achievements, or flowers.</p>
    </div>
  </main>;
}
