"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TeamLogo } from "@/components/TeamLogo";
import type { StandingsData } from "@/lib/types";
import { cycleStandingsSort, sortStandingsGroups, sortStandingsTeams, standingValue, standingsColumns, type StandingsSort } from "@/lib/standings-view";

type View = "overall" | "conference" | "division";
const views: { key: View; label: string }[] = [{ key: "overall", label: "Чемпионат" }, { key: "conference", label: "Конференции" }, { key: "division", label: "Дивизионы" }];

export function StandingsBrowser({ standings }: { standings: StandingsData }) {
  const [view, setView] = useState<View>("overall");
  const [sort, setSort] = useState<StandingsSort | null>(null);
  const rankById = useMemo(() => new Map(standings.overall.teams.map(team => [team.id, team.rank])), [standings.overall.teams]);
  const groups = sortStandingsGroups(view === "overall" ? [standings.overall] : view === "conference" ? standings.conferenceGroups : standings.groups);

  return <>
    <nav className="standings-views" aria-label="Группировка таблицы">
      {views.map(item => <button type="button" key={item.key} aria-pressed={view === item.key} onClick={() => { setView(item.key); setSort(null); }}>{item.label}<span aria-hidden="true"> ↗</span></button>)}
    </nav>
    <p className="table-hint">Нажмите на заголовок, чтобы изменить порядок. Третье нажатие — исходный порядок. <span>На узком экране таблица прокручивается вправо →</span></p>
    <div className="standings-groups">
      {groups.map((group, groupIndex) => {
        const title = view === "overall" ? "Чемпионат" : view === "division" ? group.division : group.conference;
        const sourceOrder = sortStandingsTeams(group.teams, null, rankById);
        return <section key={`${group.conference}-${group.division}`} aria-labelledby={`group-${groupIndex}`}>
          <div className="standings-group-heading"><h2 id={`group-${groupIndex}`}>{title}</h2><span>{group.teams.length} команд{view === "division" ? ` · ${group.conference}` : ""}</span></div>
          <div className="standings-scroll" tabIndex={0} role="region" aria-label={`${title} — прокручиваемая таблица`}>
            <table className="standings-table">
              <caption className="sr-only">{title}. Показатели команд; заголовки позволяют сортировать.</caption>
              <colgroup>{standingsColumns.map(column => <col key={column.key} className={`col-${column.key}`} />)}</colgroup>
              <thead><tr>{standingsColumns.map(column => <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? sort.dir === "asc" ? "ascending" : "descending" : "none"}>
                <button type="button" title={column.title} aria-label={`Сортировать: ${column.title}`} onClick={() => setSort(previous => cycleStandingsSort(previous, column.key))}>{column.label}<span className="sort-indicator" aria-hidden="true">{sort?.key === column.key ? sort.dir === "asc" ? "↑" : "↓" : ""}</span></button>
              </th>)}</tr></thead>
              <tbody>{sortStandingsTeams(group.teams, sort, rankById).map(team => <tr key={team.id}>
                <td className={team.playoff ? "playoff-rank" : ""}>{view === "overall" ? team.rank : sourceOrder.findIndex(item => item.id === team.id) + 1}</td>
                <th scope="row"><Link href={`/team/${team.id}`}><TeamLogo team={team} size={36} ring={false} /><span>{team.name}</span></Link></th>
                {standingsColumns.slice(2).map(column => {
                  const value = standingValue(team, column.key);
                  return <td key={column.key}>{column.key === "goalsForAverage" || column.key === "goalsAgainstAverage" ? Number(value).toFixed(2) : column.key === "goalDiff" && Number(value) > 0 ? `+${value}` : value}</td>;
                })}
              </tr>)}</tbody>
            </table>
            {group.teams.length === 0 && <p className="nearest-empty">Таблица пока недоступна. Попробуйте обновить страницу позже.</p>}
          </div>
        </section>;
      })}
    </div>
    <footer className="standings-legend"><p><b>И</b> — игры · <b>В / ВО / ВБ</b> — победы в основное время / овертайме / по буллитам · <b>ПО / ПБ / П</b> — поражения · <b>ШЗ / ШП</b> — шайбы · <b>ШЗ/И / ШП/И</b> — в среднем за игру · <b>+/−</b> — разница шайб.</p><p>Красная отметка — зона плей-офф по данным КХЛ.</p></footer>
  </>;
}
