import Link from "next/link";
import type { Game, StandingsTeam, Team } from "@/lib/types";
import { standingsColumns, standingValue } from "@/lib/standings-view";
import { SiteHeader } from "./SiteHeader";
import { TeamLogo } from "./TeamLogo";
import { MatchHistory } from "./MatchHistory";

export function TeamDetailsView({ team, stats, upcoming, past }: { team: Team; stats?: StandingsTeam; upcoming: Game[]; past: Game[] }) {
  return <>
    <a className="skip-link" href="#team-details">К команде</a><SiteHeader />
    <main id="team-details" className="details-page team-details-page">
      <div className="details-breadcrumb"><Link href="/#schedule">← Расписание</Link><Link href="/standings">Все команды ↗</Link></div>
      <header className="team-identity">
        <div><p>{stats ? [stats.conference, stats.division].filter(Boolean).join(" / ") : "КХЛ"}</p><h1>{team.name}</h1></div>
        <TeamLogo team={team} size={180} ring={false} />
      </header>
      {stats ? <>
        <dl className="team-primary-stats">
          <div><dt>Место в чемпионате</dt><dd>#{stats.rank}</dd></div>
          <div><dt>Очки</dt><dd>{stats.points}</dd></div>
          <div><dt>Сыграно матчей</dt><dd>{stats.gamesPlayed}</dd></div>
          <div><dt>Разница шайб</dt><dd>{stats.goalDiff > 0 ? `+${stats.goalDiff}` : stats.goalDiff}</dd></div>
        </dl>
        <details className="team-season-stats">
          <summary>Статистика сезона <span>Победы, поражения и шайбы</span></summary>
          <dl className="team-stat-grid">{standingsColumns.filter(column => !["rank", "name", "points", "gamesPlayed", "goalDiff"].includes(column.key)).map(column => {
            const value = standingValue(stats, column.key);
            const average = column.key === "goalsForAverage" || column.key === "goalsAgainstAverage";
            const label = column.key === "goalsForAverage" ? "Заброшено за игру" : column.key === "goalsAgainstAverage" ? "Пропущено за игру" : column.title;
            return <div key={column.key}><dt>{label}</dt><dd>{average ? Number(value).toFixed(2) : value}</dd></div>;
          })}</dl>
        </details>
      </> : <p className="details-empty">Статистика пока недоступна.</p>}
      <div className="details-columns team-match-columns">
        <section><div className="details-section-heading"><h2>Предстоящие матчи</h2><span>{upcoming.length}</span></div><MatchHistory games={upcoming} emptyText="Нет предстоящих матчей." /></section>
        <section><div className="details-section-heading"><h2>Прошедшие матчи</h2><span>{past.length}</span></div><MatchHistory games={past} emptyText="Нет прошедших матчей." /></section>
      </div>
      <footer className="details-footer"><Link href={`/?team=${team.id}#schedule`}>Все матчи команды в календаре ↗</Link><Link href="/standings">Турнирная таблица ↗</Link></footer>
    </main>
  </>;
}
