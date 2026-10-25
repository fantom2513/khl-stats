import MaterialFlow from './material-flow';
import {matchDisplay} from './schedule-model.mjs';
import {standingTeams} from './pages-model.mjs';
// Isolated Material-style prototype with local demonstration data.
import {createRoot} from 'react-dom/client';
import createData from './demo-data';
import assets from './assets.json';
const demo=JSON.parse(JSON.stringify(createData(new Date())));
const games=demo.Game;
const standings=standingTeams(demo.StandingsRow);
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date());
const asDate=key=>new Date(key+'T12:00:00Z');
const label=key=>new Intl.DateTimeFormat('ru',{day:'numeric',month:'long'}).format(asDate(key));
const weekday=key=>new Intl.DateTimeFormat('ru',{weekday:'long'}).format(asDate(key));
const shift=(key,n)=>{const d=asDate(key);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function Icon({name}){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name==='calendar'?<><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M7.5 3v4m9-4v4M4 10h16m-12 4h1m3 0h1m3 0h1m-9 3h1m3 0h1"/></>:name==='chevron'?<path d="m9 5 7 7-7 7"/>:name==='back'?<path d="m14 6-6 6 6 6"/>:name==='close'?<path d="m6 6 12 12M18 6 6 18"/>:<><path d="M5 6h14M5 12h14M5 18h14"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/></>}</svg>}
function Logo({team}){return <img className="study-logo" src={assets[team.logoUrl]} alt=""/>}
function Status({game}){return <span className={'study-status '+(game.status==='LIVE'?'is-live':'')}><i/>{game.status==='LIVE'?`${game.liveStatus} · ${game.liveClock}`:game.status==='FINISHED'?'Завершён':'Не начался'}</span>}
function Match({game,onSelect,href=null}){const Row=href?'a':'button';return <Row href={href||undefined} className={'study-match '+(game.status==='LIVE'?'live-match':'')} onClick={()=>onSelect?.(game)} aria-label={`Открыть матч ${game.teamA.name} — ${game.teamB.name}`}>
 <span className="study-time"><b>{game.timeFormat}</b><small>МСК</small></span>
 <span className="study-club home-club"><span><b>{game.teamA.name}</b><small>Хозяева</small></span><Logo team={game.teamA}/></span>
 <span className="study-result"><strong>{matchDisplay(game)}</strong><Status game={game}/></span>
 <span className="study-club away-club"><Logo team={game.teamB}/><span><b>{game.teamB.name}</b><small>Гости</small></span></span>
 <span className="study-open"><Icon name="chevron"/></span>
 </Row>}

createRoot(document.getElementById('root')!).render(<MaterialFlow games={games} standings={standings} today={today} Match={Match} Icon={Icon} Logo={Logo} Status={Status}/>);
