import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {FluentProvider,createDarkTheme,Button,Dropdown,Option} from '@fluentui/react-components';
import IdleCat from './neko-companion';
import MatchPage from './match-page';
import TeamPage from './team-page';
import StandingsPage from './standings-page';
import {filterGames,parseMatchRoute} from './schedule-model.mjs';
const theme=createDarkTheme({10:'#21090d',20:'#3c121a',30:'#541a25',40:'#6e2230',50:'#872b3b',60:'#a13346',70:'#b83c50',80:'#cd4e61',90:'#dc6979',100:'#e88491',110:'#ee9eaa',120:'#f3b4bd',130:'#f7c7ce',140:'#fad9de',150:'#fce9ec',160:'#fff5f7'});
const dateObject=key=>new Date(key+'T12:00:00Z');
const shift=(key,n)=>{const d=dateObject(key);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const label=key=>new Intl.DateTimeFormat('ru',{day:'numeric',month:'long'}).format(dateObject(key));
const weekday=key=>new Intl.DateTimeFormat('ru',{weekday:'long'}).format(dateObject(key));
const gameDate=g=>g.date.slice(0,10);
const countLabel=n=>`${n} ${n===1?'матч':n>=2&&n<=4?'матча':'матчей'}`;
export default function MaterialFlow({games,standings,today,Match,Icon,Logo,Status}){
 const [activeDay,setActiveDay]=useState(today);const [stripStart,setStripStart]=useState(shift(today,-2));
 const [rangeStart,setRangeStart]=useState(today);const [rangeEnd,setRangeEnd]=useState(shift(today,14));
 const [emptyDays,setEmptyDays]=useState<string[]>([]);const [scope,setScope]=useState('all');const [teamId,setTeamId]=useState('all');const [jump,setJump]=useState(0);
 const [route,setRoute]=useState(()=>parseMatchRoute(location.hash));
 const [lastTeamId,setLastTeamId]=useState(null);
 const [matchBack,setMatchBack]=useState({href:'#schedule',label:'К расписанию'});
 const scrollPositions=useRef(new Map());const routeRef=useRef(route);routeRef.current=route;
 const routeKey=value=>`${value.kind}:${value.id??''}`;
 const shownTeamId=route.kind==='team'?route.id:lastTeamId;
 const teams=[...new Map(games.flatMap(g=>[[String(g.teamAId),g.teamA],[String(g.teamBId),g.teamB]])).values()].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 const filtered=filterGames(games,teamId,scope);
 useEffect(()=>{const previous=history.scrollRestoration;history.scrollRestoration='manual';const update=()=>{scrollPositions.current.set(routeKey(routeRef.current),window.scrollY);setRoute(parseMatchRoute(location.hash))};window.addEventListener('hashchange',update);return()=>{history.scrollRestoration=previous;window.removeEventListener('hashchange',update)}},[]);
 useEffect(()=>{if(route.kind==='team')setLastTeamId(route.id)},[route.kind,route.id]);
 useLayoutEffect(()=>{ignoreSpyUntil.current=Date.now()+1700;window.scrollTo({top:scrollPositions.current.get(routeKey(route))||0,behavior:'instant'})},[route.kind,route.id]);
 const stripRef=useRef<HTMLDivElement>(null),navRef=useRef<HTMLElement>(null),dayRefs=useRef(new Map<string,HTMLElement>()),pending=useRef<string|null>(null),ignoreSpyUntil=useRef(0);
 const gameDays=[...new Set(filtered.map(gameDate))] as string[];
 const days=[...new Set([today,...gameDays,...emptyDays])].filter(d=>d>=rangeStart&&d<=rangeEnd).sort();
 const dayKey=days.join('|');
 const daily=(day)=>filtered.filter(g=>gameDate(g)===day).sort((a,b)=>(a.timeFormat||'99').localeCompare(b.timeFormat||'99'));
 function goDay(day){
  ignoreSpyUntil.current=Date.now()+1600;pending.current=day;
  setRangeStart(start=>day<start?day:start);setRangeEnd(end=>day>end?shift(day,7):end);
  setEmptyDays(list=>list.includes(day)?list:[...list,day]);setActiveDay(day);setJump(v=>v+1);
 }
 function showTeamSchedule(id){setTeamId(String(id));setScope('all');setActiveDay(today);setStripStart(shift(today,-2));scrollPositions.current.set('schedule:',0)}
 useEffect(()=>{
  const day=pending.current;if(!day)return;const node=dayRefs.current.get(day);if(!node)return;
  const height=navRef.current?.getBoundingClientRect().height||100;
  const top=Math.max(0,window.scrollY+node.getBoundingClientRect().top-height-28);
  window.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});pending.current=null;
 },[jump,dayKey]);
 useEffect(()=>{
  if(route.kind!=='schedule')return;
  let frame=0;const measure=()=>{frame=0;if(Date.now()<ignoreSpyUntil.current)return;const bottom=(navRef.current?.getBoundingClientRect().bottom||0)+48;let current=days[0];for(const day of days){const rect=dayRefs.current.get(day)?.getBoundingClientRect();if(rect&&rect.top<=bottom)current=day;else break}if(current)setActiveDay(value=>value===current?value:current)};
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(measure)};
  window.addEventListener('scroll',onScroll,{passive:true});const timer=setTimeout(onScroll,1700);
  return()=>{window.removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);clearTimeout(timer)};
 },[dayKey,jump,route.kind]);
 useEffect(()=>{setStripStart(start=>activeDay<start||activeDay>shift(start,8)?shift(activeDay,-2):start)},[activeDay]);
 useEffect(()=>{
  const node=stripRef.current;if(!node)return;const reveal=()=>{const target=node.querySelector<HTMLElement>('[aria-pressed="true"]');node.scrollLeft=target?Math.max(0,target.offsetLeft-(node.clientWidth-target.offsetWidth)/2):0};reveal();const observer=new ResizeObserver(reveal);observer.observe(node);return()=>observer.disconnect();
 },[activeDay,stripStart]);
 return <FluentProvider theme={theme}><div className="material material-flow"><a className="flow-skip" href={route.kind==='schedule'?'#matchdays':'#schedule'}>{route.kind==='schedule'?'К матчам':'К расписанию'}</a>
 <header className="flow-appbar"><div><a href="#schedule" className="flow-brand">На льду<span/></a><nav className="flow-site-nav" aria-label="Главная навигация"><a href="#schedule" className={route.kind==='schedule'||route.kind==='match'?'is-current':''} aria-current={route.kind==='schedule'?'page':undefined}>Расписание</a><a href="#/standings" className={route.kind==='standings'||route.kind==='team'?'is-current':''} aria-current={route.kind==='standings'?'page':undefined}>Таблица</a></nav><span className="flow-preview">Прототип · демо-данные</span><IdleCat/></div></header>
 <main className="flow-main" hidden={route.kind!=='schedule'}><div className="flow-title"><div><span>КХЛ · Регулярный чемпионат</span><h1>Расписание матчей</h1><p>Время московское</p></div></div>
 <div className="flow-toolbar"><div className="flow-team-filter"><span id="team-filter-label">Команда</span><Dropdown aria-labelledby="team-filter-label" className="flow-team-dropdown" value={teamId==='all'?'Все команды':teams.find(team=>String(team.id)===teamId)?.name||'Все команды'} selectedOptions={[teamId]} onOptionSelect={(_,data)=>{setTeamId(data.optionValue||'all');setEmptyDays(list=>list.includes(activeDay)?list:[...list,activeDay])}} positioning={{position:'below',align:'start',offset:6}} listbox={{className:'flow-team-listbox'}}><Option value="all" text="Все команды" className="flow-team-option">Все команды</Option>{teams.map(team=><Option key={team.id} value={String(team.id)} text={team.name} className="flow-team-option"><Logo team={team}/><span>{team.name}</span></Option>)}</Dropdown></div><div className="flow-scope" role="group" aria-label="Статус матчей"><Button appearance={scope==='all'?'primary':'secondary'} aria-pressed={scope==='all'} onClick={()=>setScope('all')}>Все матчи</Button><Button appearance={scope==='live'?'primary':'secondary'} aria-pressed={scope==='live'} onClick={()=>{setScope('live');setActiveDay(today)}}><i className="live-dot"/>LIVE</Button></div>{teamId!=='all'&&<div className="flow-filter-actions"><Button appearance="subtle" className="flow-clear-team" onClick={()=>setTeamId('all')}>Сбросить команду</Button><a href={`#/team/${teamId}`} className="flow-team-about">О команде<Icon name="chevron"/></a></div>}</div>
 <nav ref={navRef} className="material-date-strip flow-date-strip" aria-label="Лента игровых дней"><Button appearance="subtle" className="strip-arrow" aria-label="Даты на неделю раньше" icon={<Icon name="back"/>} onClick={()=>setStripStart(shift(stripStart,-7))}/><div ref={stripRef} className="date-strip-scroll">{Array.from({length:9},(_,i)=>shift(stripStart,i)).map(day=>{const count=filterGames(games,teamId,'all').filter(g=>gameDate(g)===day).length;return <button key={day} className={'strip-day '+(day===activeDay?'strip-selected ':'')+(day===today?'strip-today':'')} aria-label={`Выбрать ${label(day)}`} aria-pressed={day===activeDay} title={count?countLabel(count):'Матчей нет'} onClick={()=>{setScope('all');goDay(day)}}><span>{day===today?'Сегодня':new Intl.DateTimeFormat('ru',{weekday:'short'}).format(dateObject(day))}</span><b>{new Intl.DateTimeFormat('ru',{day:'numeric',month:'short'}).format(dateObject(day))}</b><i className={count?'has-matches':''}/></button>})}</div><Button appearance="subtle" className="strip-arrow" aria-label="Даты на неделю позже" icon={<Icon name="chevron"/>} onClick={()=>setStripStart(shift(stripStart,7))}/><Button appearance="secondary" className="strip-reset" onClick={()=>{setScope('all');setStripStart(shift(today,-2));goDay(today)}}>Сегодня</Button></nav>
 <div id="matchdays" className="flow-days">{days.map(day=>{const matches=daily(day);return <section key={day} ref={node=>{if(node)dayRefs.current.set(day,node);else dayRefs.current.delete(day)}} className="schedule-surface flow-day" data-day={day} aria-label={`Матчи ${label(day)}`}><header className="study-commandbar"><div className="flow-day-heading"><h2>{day===today?'Сегодня':label(day)}</h2><span>{day===today?`${label(day)} · `:''}{weekday(day)}</span></div><span className="flow-day-count">{countLabel(matches.length)}</span></header><div className="study-list">{matches.length?matches.map(g=><Match key={g.id} game={g} href={`#/match/${g.id}`} onSelect={()=>setMatchBack({href:'#schedule',label:'К расписанию'})}/>):<div className="study-empty"><h3>{scope==='live'?'Сейчас нет трансляций':teamId!=='all'?'У команды нет матчей в этот день':'В этот день матчей нет'}</h3><p>{scope==='live'?'Переключитесь на все матчи, чтобы увидеть расписание.':teamId!=='all'?'Выберите другую дату или сбросьте фильтр команды.':'Следующие игровые дни расположены ниже.'}</p>{teamId!=='all'&&<Button onClick={()=>{setTeamId('all');goDay(day)}}>Показать все команды</Button>}</div>}</div></section>})}</div>
 {scope==='all'&&<div className="flow-more"><Button size="large" onClick={()=>setRangeEnd(shift(rangeEnd,14))}>Ещё игровые дни</Button><span>До {label(rangeEnd)} · демонстрационные данные</span></div>}
 <footer className="flow-footer"><span>На льду · прототип для согласования</span><span>Данные вымышленные, не трансляция</span></footer></main>
 <div hidden={route.kind!=='standings'}><StandingsPage standings={standings} Logo={Logo}/></div>
 {(route.kind==='team'||lastTeamId!==null)&&<div hidden={route.kind!=='team'}><TeamPage key={shownTeamId} team={teams.find(team=>team.id===shownTeamId)} stats={standings.find(team=>team.id===shownTeamId)} standings={standings} games={games} Logo={Logo} Match={Match} Icon={Icon} onShowSchedule={showTeamSchedule} onMatch={team=>setMatchBack({href:`#/team/${team.id}`,label:`К команде «${team.name}»`})}/></div>}
 {route.kind==='match'&&<MatchPage game={games.find(g=>g.id===route.id)} Logo={Logo} Status={Status} Icon={Icon} backHref={matchBack.href} backLabel={matchBack.label}/>}
 </div></FluentProvider>
}
