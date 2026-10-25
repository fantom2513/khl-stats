import {matchDisplay} from './schedule-model.mjs';

const dateLabel=key=>new Intl.DateTimeFormat('ru',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Moscow'}).format(new Date(key));

export default function MatchPage({game,Logo,Status,Icon,onBack,backHref='#schedule',backLabel='К расписанию'}) {
  const back=<a className="flow-back-link" href={backHref} onClick={onBack}><Icon name="back"/>{backLabel}</a>;
  if(!game)return <main className="flow-main flow-match-page">{back}<section className="flow-match-card flow-not-found"><h1>Матч не найден</h1><p>Этого матча нет в демонстрационном расписании.</p><a href="#schedule" onClick={onBack}>Открыть расписание</a></section></main>;
  return <main className="flow-main flow-match-page">
    {back}
    <div className="flow-match-heading"><span>КХЛ · Регулярный чемпионат</span><h1>{game.teamA.name} — {game.teamB.name}</h1><p>{dateLabel(game.date)} · {game.timeFormat} МСК</p></div>
    <div className="flow-match-layout">
      <section className="flow-match-card flow-match-primary" aria-label="Табло матча">
        <div className="flow-detail-status"><Status game={game}/><span>Матч КХЛ</span></div>
        <div className="flow-scoreboard">
          <a className="flow-scoreboard-team" href={`#/team/${game.teamAId}`} aria-label={`Команда ${game.teamA.name}`}><Logo team={game.teamA}/><b>{game.teamA.name}</b><small>Хозяева</small></a>
          <div className="flow-detail-score"><strong>{matchDisplay(game)}</strong><small>{game.status==='SCHEDULED'?'Начало · МСК':game.status==='FINISHED'?'Итоговый счёт':'Счёт матча'}</small></div>
          <a className="flow-scoreboard-team" href={`#/team/${game.teamBId}`} aria-label={`Команда ${game.teamB.name}`}><Logo team={game.teamB}/><b>{game.teamB.name}</b><small>Гости</small></a>
        </div>
        {game.periodScores?.length>0&&<div className="flow-periods" aria-label="Счёт по периодам">{game.periodScores.map((score,i)=><div key={i}><span>{i+1} период</span><b>{score.replace(':',' : ')}</b></div>)}</div>}
        <div className="flow-match-message"><h2>{game.status==='SCHEDULED'?'До встречи на льду':game.status==='FINISHED'?'Матч завершён':'Матч идёт'}</h2><p>{game.status==='SCHEDULED'?`Начало в ${game.timeFormat} по московскому времени.`:game.status==='FINISHED'?'Результат встречи и счёт по периодам — на табло выше.':`${game.liveStatus}, игровое время ${game.liveClock}.`}</p></div>
      </section>
      <aside className="flow-match-card flow-match-info" aria-label="Информация о матче"><h2>О матче</h2><dl className="flow-match-facts"><div><dt>Дата</dt><dd>{dateLabel(game.date)}</dd></div><div><dt>Начало</dt><dd>{game.timeFormat} МСК</dd></div><div><dt>Арена</dt><dd>{game.venue}</dd></div><div><dt>Турнир</dt><dd>Регулярный чемпионат КХЛ</dd></div></dl><p className="flow-detail-note">Демонстрационные данные для оценки интерфейса.</p></aside>
    </div>
    <footer className="flow-footer"><span>На льду · прототип для согласования</span><span>Данные вымышленные, не трансляция</span></footer>
  </main>;
}
