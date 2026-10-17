import { useId } from 'react';
import { species } from './model';

export function Flower({ kind = 0, progress = 1, className = '' }: { kind?: number; progress?: number; className?: string }) {
  const s = species[kind % species.length];
  return <svg className={className} viewBox="0 0 120 180" fill="none" aria-hidden="true">
    <path d="M60 166 Q51 124 61 67" stroke="#66794a" strokeWidth="2.3"/>
    <path d="M57 133 Q20 112 29 93 Q56 101 57 133Z" fill="#77875b"/><path d="M57 116 Q88 91 94 105 Q81 125 57 124Z" fill="#536c43"/>
    <path d="M57 148 Q74 134 86 141 Q75 151 59 153" fill="#8b9867"/>
    {progress < .2 ? <g><path d="M59 76 Q39 62 47 53 Q59 53 61 67 Q65 50 74 55 Q81 66 59 76" fill="#8a9b64"/></g> : progress < .7 ? <g><ellipse cx="61" cy="61" rx={progress < .5 ? 8 : 12} ry="18" fill="#8a9b64"/><path d="M60 80 Q43 63 49 53 M60 80 Q77 63 73 53" stroke="#71844e" strokeWidth="3"/></g> : progress < 1 ? <g><path d="M60 81 Q43 57 60 33 Q77 57 60 81Z" fill="#7c945c"/><path d="M60 76 Q52 55 60 40 Q68 55 60 76" fill={s.color}/></g> : <g>
      {Array.from({ length: kind === 1 || kind === 4 ? 12 : 7 }, (_, i) => <ellipse key={i} cx="60" cy="40" rx={kind === 1 ? 6 : 13} ry={kind === 1 ? 22 : 24} transform={`rotate(${i * (kind === 1 || kind === 4 ? 30 : 360 / 7)} 60 61)`} fill={s.color} stroke="#856538" strokeOpacity=".12" strokeWidth=".7"/>)}
      <circle cx="60" cy="61" r="9" fill={kind === 3 ? '#3f4630' : '#ba8b3b'}/><circle cx="58" cy="59" r="4" fill="#e9c56a"/>
      {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={60 + Math.cos(i) * 6} cy={61 + Math.sin(i) * 6} r="1" fill="#67532b"/>)}
    </g>}
  </svg>;
}

export function Botanicals() {
  const id = useId().replace(/:/g, '');
  return <svg className="botanicals" viewBox="0 0 1440 1000" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={id} x2="1" y2="1"><stop stopColor="#81966a"/><stop offset="1" stopColor="#1a4436"/></linearGradient></defs>
    {[false, true].map(flip => <g key={String(flip)} transform={flip ? 'translate(1440 0) scale(-1 1)' : ''}>
      {Array.from({ length: 8 }, (_, i) => <g key={i} transform={`translate(${i * 29 - 70} ${970 - (i % 3) * 60}) rotate(${-32 + i * 9})`}>
        <path d="M0 170 Q80 -200 16 -610" stroke="#849268" strokeWidth="2" fill="none"/>
        {Array.from({ length: 7 }, (_, j) => <g key={j} transform={`translate(${24 + Math.sin(j) * 17} ${-j * 72})`}><path d="M0 0 Q-130-70-84-115 Q-10-89 0 0" fill={`url(#${id})`} opacity=".75"/><path d="M0-28 Q94-131 106-64 Q72-27 0-28" fill={`url(#${id})`} opacity=".65"/><path d="M0 0L-82-108 M0-28L103-65" stroke="#b0b58a" strokeOpacity=".18"/></g>)}
      </g>)}
      {[0, 1, 2, 3, 4].map((v) => <g key={v} transform={`translate(${v * 83 + 12} ${v % 2 ? 895 : 1030}) rotate(${v * 19 - 40}) scale(${v % 2 ? 1 : 1.4})`}>
        <path d="M0 0Q40-80 5-160" stroke="#809066" fill="none" strokeWidth="2"/>
        <g transform="translate(5 -160)">{Array.from({ length: 7 }, (_, j) => <ellipse key={j} cy="-22" rx="16" ry="27" transform={`rotate(${j * 360 / 7})`} fill={v % 2 ? '#bd795f' : '#d5af60'} opacity=".9"/>)}<circle r="10" fill="#454d2d"/></g>
      </g>)}
      <g transform="translate(200 0) rotate(130) scale(.65)">{Array.from({ length: 6 }, (_, j) => <path key={j} d={`M0 ${j * 55}q-100-70-110-15q38 45 110 15q110-100 110-40q-40 55-110 40`} fill="#476749" opacity=".65"/>)}</g>
      {[140, 290, 430].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 24 : -4}) scale(.85)`}>{Array.from({ length: 7 }, (_, j) => <ellipse key={j} cy="-20" rx="15" ry="27" transform={`rotate(${j * 360 / 7})`} fill={i % 2 ? '#bd795f' : '#d5af60'} opacity=".7"/>)}<circle r="9" fill="#454d2d"/></g>)}
    </g>)}
  </svg>;
}

export function Cottage({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 480 360" fill="none" aria-hidden="true">
    <ellipse cx="245" cy="295" rx="177" ry="31" fill="#77815b" opacity=".13"/>
    <path d="M230 292Q225 328 283 360H348Q267 317 275 292" fill="#d6c6a5"/>
    <path d="M103 163L245 176V286L103 272Z" fill="#d9d6bd"/><path d="M245 176L354 145V266L245 286Z" fill="#b9bea4"/>
    <path d="M85 165L150 69L290 88L248 186Z" fill="#53665a"/><path d="M150 69L290 88L371 151L248 186L290 108Z" fill="#778274"/>
    <path d="M248 186L290 88L371 151" stroke="#354e44" strokeWidth="6" strokeLinejoin="round"/>
    <path d="M83 167L150 68L289 87" stroke="#3e554a" strokeWidth="5" strokeLinejoin="round"/>
    <path d="M127 116L252 134M114 137L244 154M166 76L107 163M198 80L145 170M233 84L183 176M266 88L222 182" stroke="#c4c5ab" strokeOpacity=".2" strokeWidth="2"/>
    <path d="M196 85V44L220 46V89" fill="#b3b39c"/><path d="M193 43L219 45L227 40L201 38Z" fill="#7a8271"/>
    <path d="M124 192L156 195V232L124 228Z M184 199L216 202V239L184 235Z" fill="#e9c985" stroke="#758576" strokeWidth="5"/>
    <path d="M140 193V230M125 211L155 214M200 201V237M184 219L216 222" stroke="#f3e8c8" strokeWidth="2"/>
    <path d="M274 216L302 208V276L274 283Z" fill="#52695c"/><circle cx="294" cy="246" r="2" fill="#d1bc80"/>
    <path d="M321 183L343 176V211L321 217Z" fill="#e4c88a" stroke="#7e8b77" strokeWidth="4"/>
    <path d="M269 285L308 276L316 283L275 294Z" fill="#9eaa92"/>
    <path d="M91 270q18-37 37 1q21-25 39 9M316 275q23-37 36-11q13-15 25 0" fill="#83956b"/>
    <path d="M358 255v28m18-34v30m-27-14 35-8" stroke="#8b9479" strokeWidth="3"/>
    <path d="M209 25q-12-17 3-28" stroke="#b1b7a3" strokeWidth="6" opacity=".25" strokeLinecap="round"/>
  </svg>;
}
