import test from 'node:test';
import assert from 'node:assert/strict';
import {matchDisplay, filterGames, parseMatchRoute} from './schedule-model.mjs';

test('an upcoming match shows its start time between the teams',()=>{
  const game={status:'SCHEDULED',timeFormat:'19:30',homeScore:null,visitorScore:null};
  assert.equal(matchDisplay(game),'19:30');
});
test('a live match keeps its actual score including zero',()=>{
  const game={status:'LIVE',timeFormat:'19:30',homeScore:0,visitorScore:0};
  assert.equal(matchDisplay(game),'0 : 0');
});
test('team filter matches home and away participation',()=>{
  const games=[{id:1,teamAId:34,teamBId:1},{id:2,teamAId:2,teamBId:34},{id:3,teamAId:2,teamBId:1}];
  assert.deepEqual(filterGames(games,'34','all').map(g=>g.id),[1,2]);
});
test('team and LIVE filters apply together',()=>{
  const games=[{id:1,teamAId:34,teamBId:1,status:'LIVE'},{id:2,teamAId:34,teamBId:2,status:'SCHEDULED'},{id:3,teamAId:2,teamBId:1,status:'LIVE'}];
  assert.deepEqual(filterGames(games,'34','live').map(g=>g.id),[1]);
});
test('clearing the team filter restores all teams',()=>{
  const games=[{id:1,teamAId:34,teamBId:1},{id:2,teamAId:2,teamBId:1}];
  assert.equal(filterGames(games,'all','all').length,2);
});
test('match address supports opening the HTML directly at a match',()=>{
  assert.deepEqual(parseMatchRoute('#/match/9700240'),{kind:'match',id:9700240});
});
test('an invalid match address remains a not-found match page',()=>{
  assert.deepEqual(parseMatchRoute('#/match/no-such-game'),{kind:'match',id:null});
});
test('returning to the schedule clears the match route',()=>{
  assert.deepEqual(parseMatchRoute('#schedule'),{kind:'schedule'});
});
