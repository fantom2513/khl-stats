import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GameStatus } from "./GameStatus";
import type { Game } from "../lib/types";

const base: Game = { id: 1, status: "SCHEDULED", date: "2026-10-24", timeFormat: "14:30", homeScore: null, visitorScore: null, overtime: null, teamA: { id: 1, name: "А", logoUrl: null }, teamB: { id: 2, name: "Б", logoUrl: null } };

test("a scheduled match shows Moscow time rather than an invented score", () => {
  assert.match(renderToStaticMarkup(<GameStatus game={base} />), /14:30.*МСК/);
});
test("a live score keeps zero and includes the supplied clock", () => {
  const html = renderToStaticMarkup(<GameStatus game={{ ...base, status: "LIVE", homeScore: 0, visitorScore: 2, liveClock: "12:34" }} />);
  assert.match(html, /0 : 2.*LIVE.*12:34/);
});
test("an unknown score is not presented as zero", () => {
  assert.match(renderToStaticMarkup(<GameStatus game={{ ...base, status: "FINISHED", homeScore: null, visitorScore: 0 }} />), /— : 0/);
});
test("a finished shootout remains identifiable", () => {
  assert.match(renderToStaticMarkup(<GameStatus game={{ ...base, status: "FINISHED", homeScore: 3, visitorScore: 2, overtime: "SO" }} />), /3 : 2.*Завершён.*Б/);
});
