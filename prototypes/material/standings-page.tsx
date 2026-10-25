import {useState} from 'react';
import {Button} from '@fluentui/react-components';
import {standingGroups} from './pages-model.mjs';
import {standingsColumns,standingValue,cycleStandingsSort,sortStandingsTeams,sortStandingsGroups} from './standings-view';

const columns=[standingsColumns[0],standingsColumns[1],standingsColumns[2],standingsColumns[14],...standingsColumns.slice(3,14)];
const views=[['overall','Чемпионат'],['conference','Конференции'],['division','Дивизионы']];
export default function StandingsPage({standings,Logo}) {
  const [view,setView]=useState('overall');
  const [sort,setSort]=useState(null);
  const rankById=new Map(standings.map(team=>[team.id,team.rank]));
  const groups=sortStandingsGroups(standingGroups(standings,view));
  return <main className="flow-main league-page">
    <header className="league-heading"><span>КХЛ · Регулярный чемпионат</span><h1>Турнирная таблица</h1><p>Положение команд и статистика сезона</p></header>
    <div className="league-controls" role="group" aria-label="Группировка таблицы">{views.map(([key,title])=><Button key={key} appearance={view===key?'primary':'secondary'} aria-pressed={view===key} onClick={()=>{setView(key);setSort(null)}}>{title}</Button>)}</div>
    <p className="league-sort-hint">Нажмите на заголовок столбца для сортировки.<span> На телефоне таблицу можно листать вправо.</span></p>
    <div className="league-groups">{groups.map((group,index)=>{
      const source=sortStandingsTeams(group.teams,null,rankById);
      const rows=sortStandingsTeams(group.teams,sort,rankById);
      return <section key={`${group.conference}/${group.division}`} className="league-table-card" aria-labelledby={`league-group-${index}`}>
        <header><div><h2 id={`league-group-${index}`}>{group.title}</h2>{view==='division'&&<span>{group.conference}</span>}</div><span>{group.teams.length} команд</span></header>
        <div className="league-table-scroll" role="region" tabIndex={0} aria-label={`${group.title}: прокручиваемая таблица`}><table className="league-table"><caption className="flow-visually-hidden">{group.title}. Статистика команд.</caption><thead><tr>{columns.map(column=><th key={column.key} scope="col" className={`league-col-${column.key}`} aria-sort={sort?.key===column.key?(sort.dir==='asc'?'ascending':'descending'):'none'}><button type="button" title={column.title} aria-label={`Сортировать: ${column.title}`} onClick={()=>setSort(previous=>cycleStandingsSort(previous,column.key))}>{column.label}<span aria-hidden="true">{sort?.key===column.key?(sort.dir==='asc'?'↑':'↓'):''}</span></button></th>)}</tr></thead><tbody>{rows.map(team=><tr key={team.id} id={`standing-team-${team.id}`}>
          <td className={'league-col-rank '+(team.playoff?'league-playoff':'')}>{view==='overall'?team.rank:source.findIndex(t=>t.id===team.id)+1}</td>
          <th scope="row" className="league-col-name"><a href={`#/team/${team.id}`} aria-label={`Команда ${team.name}`}><Logo team={team}/><span>{team.name}</span></a></th>
          {columns.slice(2).map(column=>{const value=standingValue(team,column.key);return <td key={column.key} className={`league-col-${column.key}`}>{column.key.endsWith('Average')?Number(value).toFixed(2):column.key==='goalDiff'&&Number(value)>0?`+${value}`:value}</td>})}
        </tr>)}</tbody></table></div>
      </section>;
    })}</div>
    <div className="league-legend"><p><b>И</b> — игры · <b>Очки</b> — набранные очки · <b>В / ВО / ВБ</b> — победы в основное время / овертайме / по буллитам · <b>ПО / ПБ / П</b> — поражения · <b>ШЗ / ШП</b> — шайбы · <b>ШЗ/И / ШП/И</b> — в среднем за игру · <b>+/−</b> — разница шайб.</p><p><i/>Отметка зоны плей-офф в демонстрационных данных.</p></div>
    <footer className="flow-footer"><span>На льду · прототип для согласования</span><span>Данные демонстрационные</span></footer>
  </main>;
}
