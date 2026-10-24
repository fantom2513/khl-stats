import type { Game } from "../lib/types";
import { overtimeLabel } from "../lib/format";

export function GameStatus({ game }: { game: Game }) {
  const scheduled = game.status === "SCHEDULED";
  return <div className={`game-status ${game.status === "LIVE" ? "is-live" : ""}`}>
    <strong>{scheduled ? game.timeFormat || "Время уточняется" : `${game.homeScore ?? "—"} : ${game.visitorScore ?? "—"}`}</strong>
    <span>{scheduled ? "МСК" : game.status === "LIVE" ? `LIVE${game.liveStatus ? ` · ${game.liveStatus}` : ""}${game.livePeriod ? ` · ${game.livePeriod} период` : ""}${game.liveClock ? ` · ${game.liveClock}` : ""}` : `Завершён${game.overtime ? ` · ${overtimeLabel(game.overtime)}` : ""}`}</span>
  </div>;
}
