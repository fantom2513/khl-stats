"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ScheduleGameRow } from "@/components/ScheduleGameRow";
import { ScheduleHero } from "@/components/ScheduleHero";
import { SiteHeader } from "@/components/SiteHeader";
import { TeamLogo } from "@/components/TeamLogo";
import type { Game, StandingsData } from "@/lib/types";
import { dayKey, formatDayHeading } from "@/lib/format";
import { currentMonthKey, formatMonthLabel, parseTimeMinutes, shiftMonthKey } from "@/lib/schedule";
import { colors } from "@/lib/theme";

const TEAM_FILTER_KEY = "khl-team-filter";

type GamesResponse = { games: Game[]; scope: "upcoming" | "past"; month: string };
type NearestResponse = { day: "today" | "tomorrow"; date: string; games: Game[] };
type Tab = "upcoming" | "past";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Матчи" },
  { key: "past", label: "Результаты" },
];

const LIVE_POLL_MS = 15_000;
const IDLE_POLL_MS = 180_000;
const NEAREST_IDLE_POLL_MS = 120_000;

function hasLiveGame(games: Game[]): boolean {
  return games.some((g) => g.status === "LIVE");
}


export default function HomeBrowser({
  initialNearest,
  initialData,
  initialStandings,
}: {
  initialNearest: NearestResponse;
  initialData: GamesResponse;
  initialStandings: StandingsData;
}) {
  return (
    <Suspense fallback={null}>
      <HomeContent initialNearest={initialNearest} initialData={initialData} initialStandings={initialStandings} />
    </Suspense>
  );
}

function GameRowSkeleton() {
  return (
    <div style={styles.skeletonRow}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.7rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
            <div style={{ ...styles.skeletonBar, width: "7rem", height: "1rem" }} />
            <div style={{ ...styles.skeletonBar, width: "4.5rem", height: "0.65rem" }} />
          </div>
          <div style={styles.skeletonLogo} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", minWidth: "4.75rem" }}>
          <div style={{ ...styles.skeletonBar, width: "2.5rem", height: "1.1rem" }} />
          <div style={{ ...styles.skeletonBar, width: "1.8rem", height: "0.55rem" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "0.7rem" }}>
          <div style={styles.skeletonLogo} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem" }}>
            <div style={{ ...styles.skeletonBar, width: "7rem", height: "1rem" }} />
            <div style={{ ...styles.skeletonBar, width: "4.5rem", height: "0.65rem" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function GamesSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={styles.skeletonList}>
      <div style={styles.skeletonDayHeading} />
      {Array.from({ length: rows }).map((_, i) => (
        <GameRowSkeleton key={i} />
      ))}
    </div>
  );
}

function HomeContent({
  initialNearest,
  initialData,
  initialStandings,
}: {
  initialNearest: NearestResponse;
  initialData: GamesResponse;
  initialStandings: StandingsData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab: Tab = searchParams.get("tab") === "past" ? "past" : "upcoming";
  const monthParam = searchParams.get("month");
  const month = monthParam && /^\d{4}$/.test(monthParam) ? monthParam : currentMonthKey();

  const [nearest, setNearest] = useState<NearestResponse>(initialNearest);
  const [data, setData] = useState<GamesResponse>(initialData);
  const [standings, setStandings] = useState(initialStandings.teamsById);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Фильтр по команде — логика из main
  const [teamQuery, setTeamQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showNearest = tab === "upcoming" && month === currentMonthKey() && selectedTeamId === null;

  function setUrl(nextTab: Tab, nextMonth: string) {
    const params = new URLSearchParams({ tab: nextTab, month: nextMonth });
    if (selectedTeamId != null) params.set("team", String(selectedTeamId));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function switchTab(nextTab: Tab) {
    setUrl(nextTab, currentMonthKey());
  }

  function switchMonth(delta: number) {
    setUrl(tab, shiftMonthKey(month, delta));
  }

  // Чтение сохранённой команды: приоритет у URL, иначе localStorage (из main)
  useEffect(() => {
    const fromUrl = searchParams.get("team");
    if (fromUrl != null && Number.isFinite(Number(fromUrl))) {
      setSelectedTeamId(Number(fromUrl));
    } else {
      const saved = window.localStorage.getItem(TEAM_FILTER_KEY);
      const parsed = saved != null ? Number(saved) : null;
      if (parsed != null && Number.isFinite(parsed)) setSelectedTeamId(parsed);
    }
    setHydrated(true);
  }, [searchParams]);

  const teams = useMemo(
    () => Object.values(standings).sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [standings]
  );

  const selectedTeam = useMemo(
    () => (selectedTeamId != null ? teams.find((t) => t.id === selectedTeamId) : undefined),
    [teams, selectedTeamId]
  );

  function chooseTeam(teamId: number | null) {
    setSelectedTeamId(teamId);
    try {
      if (teamId == null) window.localStorage.removeItem(TEAM_FILTER_KEY);
      else window.localStorage.setItem(TEAM_FILTER_KEY, String(teamId));
    } catch {
      // приватный режим / localStorage недоступен — молча живём дальше
    }
    const params = new URLSearchParams({ tab, month });
    if (teamId == null) params.delete("team");
    else params.set("team", String(teamId));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Сохранённая команда не найдена в текущем составе — сбрасываем (из main)
  useEffect(() => {
    if (hydrated && selectedTeamId != null && teams.length > 0 && !selectedTeam) {
      chooseTeam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, teams, selectedTeamId, selectedTeam]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    document.getElementById("schedule")?.scrollIntoView({ behavior: "instant" });
  }, [tab, month, selectedTeamId]);

  useEffect(() => {
    const params = new URLSearchParams({ scope: tab, month });
    let cancelled = false;
    let timer: number;
    setIsLoading(true);

    const load = () =>
      fetch(`/api/games?${params.toString()}`)
        .then((res) => { if (!res.ok) throw new Error("Не удалось загрузить расписание"); return res.json() as Promise<GamesResponse>; })
        .then((json) => {
          if (cancelled) return;
          setError(null);
          setData(json);
          setIsLoading(false);
          scheduleNext(hasLiveGame(json.games));
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setError(e.message);
          setIsLoading(false);
          scheduleNext(false);
        });

    function scheduleNext(live: boolean) {
      if (cancelled) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(load, live ? LIVE_POLL_MS : IDLE_POLL_MS);
    }

    load();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [tab, month]);

  useEffect(() => {
    if (!showNearest) return;
    let cancelled = false;
    let timer: number;

    const load = () =>
      fetch("/api/games/nearest")
        .then((res) => res.json() as Promise<NearestResponse>)
        .then((json) => {
          if (cancelled) return;
          setNearest(json);
          scheduleNext(hasLiveGame(json.games));
        })
        .catch(() => { if (!cancelled) scheduleNext(false); });

    function scheduleNext(live: boolean) {
      if (cancelled) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(load, live ? LIVE_POLL_MS : NEAREST_IDLE_POLL_MS);
    }

    load();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [showNearest]);

  useEffect(() => {
    const loadStandings = () =>
      fetch("/api/standings")
        .then((res) => res.json() as Promise<StandingsData>)
        .then((json) => setStandings(json.teamsById))
        .catch(() => { });
    loadStandings();
    const timer = window.setInterval(loadStandings, 300_000);
    return () => window.clearInterval(timer);
  }, []);

  const nearestDayKey = useMemo(() => dayKey(nearest.date), [nearest.date]);

  // Клиентская фильтрация по команде — как в main
  const filteredGames = useMemo(() => {
    if (selectedTeamId == null) return data.games;
    return data.games.filter(
      (g) => g.teamA.id === selectedTeamId || g.teamB.id === selectedTeamId
    );
  }, [data.games, selectedTeamId]);

  const grouped = useMemo(() => {
    const map = new Map<string, Game[]>();
    for (const game of filteredGames) {
      const key = dayKey(game.date);
      if (showNearest && nearest.games.length > 0 && key === nearestDayKey) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(game);
    }
    return Array.from(map.entries()).map(([date, dayGames]) => [
      date,
      [...dayGames].sort((a, b) => parseTimeMinutes(a.timeFormat) - parseTimeMinutes(b.timeFormat)),
    ] as [string, Game[]]);
  }, [filteredGames, showNearest, nearestDayKey, nearest.games.length]);

  const menuTeams = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    return q ? teams.filter((t) => t.name.toLowerCase().includes(q)) : teams;
  }, [teams, teamQuery]);

  const inputValue = editing || !selectedTeam ? teamQuery : selectedTeam.name;

  function startEditing() {
    // Поле заполнено выбранной командой — очищаем только текст, фильтр не трогаем
    if (selectedTeam && !editing) {
      setEditing(true);
      setTeamQuery("");
    }
    setTeamMenuOpen(true);
  }

  function pickTeam(teamId: number | null) {
    chooseTeam(teamId);
    setTeamQuery("");
    setEditing(false);
    setTeamMenuOpen(false);
    inputRef.current?.blur();
  }

  function handleFilterKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (teamQuery.trim() === "") {
        if (selectedTeamId != null) pickTeam(null); // пустая строка + Enter = сброс фильтра
      } else if (menuTeams.length > 0) {
        pickTeam(menuTeams[0].id); // Enter с текстом = первая найденная команда
      }
    } else if (e.key === "Escape") {
      // отмена редактирования: возвращаем название выбранной команды
      setEditing(false);
      setTeamQuery("");
      setTeamMenuOpen(false);
      inputRef.current?.blur();
    }
  }

  const pagination = (compact?: boolean): ReactNode => (
    <div style={compact ? styles.paginationInline : styles.pagination}>
      <button style={styles.pageButton} onClick={() => switchMonth(-1)}>← Назад</button>
      <span style={styles.pageLabel}>{formatMonthLabel(month)}</span>
      <button style={styles.pageButton} onClick={() => switchMonth(1)}>Вперёд →</button>
    </div>
  );

  return (
    <main style={styles.page} className="schedule-page">
      <a className="skip-link" href="#schedule">К расписанию</a>
      {showNearest ? <ScheduleHero date={nearest.date} games={nearest.games} /> : <SiteHeader />}
      <section id="schedule" className="calendar-section" aria-labelledby="calendar-heading">
      <div className="calendar-heading"><h2 id="calendar-heading">{tab === "past" ? <>ТАК БЫЛО.<br />НА ЛЬДУ.</> : <>ДАЛЬШЕ<br /><span>НА ЛЬДУ.</span></>}</h2><p>Регулярный чемпионат<br />Время начала — московское</p></div>
      <div className="calendar-controls">
        {/* Фильтр по команде — разметка и поведение из main (левая колонка) */}
        <div style={styles.filterCell}>
          <div style={styles.filterWrap}>
            <input
              aria-label="Фильтр матчей по команде"
              aria-controls="team-filter-menu"
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                // selectedTeamId НЕ сбрасываем — список матчей остаётся прежним
                setEditing(true);
                setTeamQuery(e.target.value);
                setTeamMenuOpen(true);
              }}
              onClick={startEditing}
              onFocus={startEditing}
              onKeyDown={handleFilterKeyDown}
              onBlur={() =>
                window.setTimeout(() => {
                  setTeamMenuOpen(false);
                  setEditing(false); // ушли из поля — снова показываем выбранную команду
                }, 150)
              }
              placeholder="Фильтр по команде…"
              style={{
                ...styles.filterInput,
                ...(selectedTeam != null && !editing ? styles.filterInputWithCount : {}),
              }}
            />

            {selectedTeam != null && !editing && (
              <span style={styles.filterCount}>Матчей: {filteredGames.length}</span>
            )}

            {teamMenuOpen && (
              <div id="team-filter-menu" style={styles.filterMenu} className="khl-filter-menu">
                {menuTeams.map((team) => (
                  <button
                    key={team.id}
                    className="khl-filter-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickTeam(team.id)}
                    style={{ ...styles.filterMenuItem, ...(team.id === selectedTeamId ? styles.filterMenuItemActive : {}) }}
                  >
                    <TeamLogo team={team} size={22} />
                    <span>{team.name}</span>
                  </button>
                ))}
                {menuTeams.length === 0 && <div style={styles.filterMenuEmpty}>Команда не найдена</div>}
              </div>
            )}
          </div>

          {selectedTeam != null && (
            <button onClick={() => pickTeam(null)} style={styles.filterClear}>✕ сбросить</button>
          )}
        </div>
        {pagination(true)}
        <nav style={styles.tabs}>
          {TABS.map((item) => (
            <button
              key={item.key}
              aria-pressed={tab === item.key}
              onClick={() => switchTab(item.key)}
              onMouseEnter={() => setHoveredNav(item.key)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                ...styles.tabButton,
                ...(tab === item.key ? styles.tabButtonActive : {}),
                ...(hoveredNav === item.key && tab !== item.key ? styles.tabButtonHover : {}),
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {
        isLoading ? (
          <GamesSkeleton />
        ) : (
          <>
            {error && (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>Не удалось загрузить</p>
                <p style={styles.emptyBody}>{error}. Обновите страницу через минуту.</p>
              </div>
            )}
            {!error && filteredGames.length === 0 && (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>Матчей не найдено</p>
                <p style={styles.emptyBody}>
                  {selectedTeam != null
                    ? `У «${selectedTeam.name}» на этом периоде (${formatMonthLabel(month)}) матчей нет — попробуйте другой месяц или сбросьте фильтр.`
                    : `За этот период (${formatMonthLabel(month)}) матчей нет — попробуйте другой месяц.`}
                </p>
              </div>
            )}
            {grouped.length > 0 && (
              <section style={styles.list}>
                {grouped.map(([date, dayGames]) => (
                  <div key={date} style={{ marginTop: "1.5rem" }}>
                    <h3 className="schedule-day">{formatDayHeading(date)}</h3>
                    {dayGames.map((game) => (
                      <ScheduleGameRow key={game.id} game={game} standings={standings} showStats={tab === "upcoming"} />
                    ))}
                  </div>
                ))}
              </section>
            )}
          </>
        )
      }

      {pagination()}
      <footer className="schedule-footer"><span>Время начала матчей — московское.<br />Статистика обновляется автоматически.</span><a href="#schedule">НА ЛЬДУ. ↑</a></footer>
      </section>
    </main >
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "var(--font-body)", fontSize: "1.05rem", paddingBottom: "4rem" },
  // Стили фильтра — из main (теперь в левой колонке строки управления)
  filterCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    flexWrap: "nowrap",   // было "wrap"
    justifySelf: "start",
    minWidth: 0,          // чтобы 1fr-колонка не раздувалась содержимым
    width: "100%",
  },
  filterWrap: {
    position: "relative",
    flex: "1 1 0",        // поле занимает остаток и сжимается, если нужно
    minWidth: 0,
    maxWidth: "260px",
  },
  filterInput: {
    width: "100%",
    height: "2.5rem",     // фиксированная высота, не зависит от состояния
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
    lineHeight: 1.2,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: "0.9rem",
    paddingRight: "0.9rem",
    borderRadius: 0,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    background: "transparent",
    color: colors.text,
    outline: "none",
    boxSizing: "border-box",
  },
  filterClear: {
    fontFamily: "var(--font-display)",
    fontSize: "0.8rem",
    height: "2.5rem",     // такая же высота, как у поля
    padding: "0 0.9rem",
    borderRadius: 0,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.muted,
    cursor: "pointer",
    flexShrink: 0,        // кнопка не сжимается и не переносится
    whiteSpace: "nowrap",
  },
  filterInputWithCount: { paddingRight: "5.5rem" },
  filterMenu: { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, maxHeight: "280px", overflowY: "auto", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 0, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", zIndex: 10 },
  filterMenuItem: { display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", padding: "0.5rem 0.8rem", background: "transparent", border: "none", color: colors.text, cursor: "pointer", textAlign: "left", fontSize: "0.95rem", transition: "background-color 0.15s ease, padding-left 0.15s ease" },
  filterMenuItemActive: { background: `${colors.accent}22` },
  filterMenuEmpty: { padding: "0.7rem 0.9rem", color: colors.muted, fontSize: "0.9rem" },
  filterCount: { position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", color: colors.muted, fontSize: "0.75rem", fontFamily: "var(--font-display)", whiteSpace: "nowrap", pointerEvents: "none" },

  tabs: { display: "flex", gap: "0.4rem", alignItems: "center", justifySelf: "end" },
  tabButton: {
    fontFamily: "var(--font-display)",
    fontSize: "0.9rem",
    fontWeight: 500,
    lineHeight: 1,
    padding: "0.6rem 1.1rem",
    borderRadius: 0,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    background: "transparent",
    color: colors.muted,
    cursor: "pointer",
    transition: "border-color 0.18s ease, color 0.18s ease, background 0.18s ease",
  },
  tabButtonHover: { borderColor: colors.accent, color: colors.text },
  tabButtonActive: { borderColor: colors.accent, color: colors.bg, background: colors.accent },

  emptyState: { padding: "3rem clamp(1.25rem, 5vw, 3rem)" },
  emptyTitle: { fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, margin: "0 0 0.4rem", textAlign: "center" },
  emptyBody: { color: colors.muted, margin: 0, fontSize: "1.05rem", textAlign: "center" },
  list: {},
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2rem clamp(1.25rem, 5vw, 3rem) 0" },
  paginationInline: { display: "flex", alignItems: "center", gap: "0.75rem", justifySelf: "center", gridColumn: 2 },
  pageButton: {
    fontFamily: "var(--font-display)",
    fontSize: "0.9rem",
    fontWeight: 500,
    lineHeight: 1,
    padding: "0.6rem 1.1rem",
    borderRadius: 0,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.text,
    cursor: "pointer",
    transition: "border-color 0.18s ease, color 0.18s ease",
  },
  pageLabel: { color: colors.muted, fontSize: "0.9rem", fontFamily: "var(--font-display)", lineHeight: 1, whiteSpace: "nowrap" },
  skeletonRow: { padding: "0.9rem clamp(1.25rem, 5vw, 3rem)", borderBottom: `1px solid ${colors.borderSoft}` },
  skeletonLogo: { width: "56px", height: "56px", borderRadius: "50%", background: colors.borderSoft, flexShrink: 0, animation: "khl-skeleton-pulse 1.2s ease-in-out infinite" },
  skeletonBar: { borderRadius: "4px", background: colors.borderSoft, animation: "khl-skeleton-pulse 1.2s ease-in-out infinite" },
  skeletonList: { paddingTop: "1rem" },
  skeletonDayHeading: {
    width: "9rem",
    height: "0.9rem",              // как fontSize у dayHeading
    margin: "0 auto 0.6rem",       // по центру, небольшой просвет до первого матча
    borderRadius: "4px",
    background: colors.borderSoft,
    animation: "khl-skeleton-pulse 1.2s ease-in-out infinite",
  },
};
