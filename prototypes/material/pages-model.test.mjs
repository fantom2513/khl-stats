import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMatchRoute} from './schedule-model.mjs';
import {standingTeams,standingGroups,teamMatches,teamForm,standingsContext} from './pages-model.mjs';

test('standings has a direct page address',()=>{
  assert.deepEqual(parseMatchRoute('#/standings'),{kind:'standings'});
});
test('team has a direct page address',()=>{
  assert.deepEqual(parseMatchRoute('#/team/34'),{kind:'team',id:34});
});
test('invalid team identifiers reach the missing-team page',()=>{
  assert.deepEqual(parseMatchRoute('#/team/not-a-team'),{kind:'team',id:null});
});
test('standings adapter keeps team identity and the supplied statistics',()=>{
  const rows=[{teamId:34,name:'Авангард',rank:3,points:22}];
  assert.deepEqual(standingTeams(rows),[{teamId:34,id:34,name:'Авангард',rank:3,points:22}]);
});
test('conference groups contain each team once',()=>{
  const teams=[{id:1,conference:'Западная конференция',division:'Дивизион А'},{id:2,conference:'Восточная конференция',division:'Дивизион Б'},{id:3,conference:'Западная конференция',division:'Дивизион В'}];
  const groups=standingGroups(teams,'conference');
  assert.deepEqual(groups.map(g=>[g.conference,g.teams.map(t=>t.id)]),[['Западная конференция',[1,3]],['Восточная конференция',[2]]]);
});
test('divisions with equal names in different conferences stay separate',()=>{
  const teams=[{id:1,conference:'Запад',division:'А'},{id:2,conference:'Восток',division:'А'}];
  assert.equal(standingGroups(teams,'division').length,2);
});
test('upcoming includes home and away games, with LIVE first',()=>{
  const games=[{id:1,teamAId:34,teamBId:2,status:'SCHEDULED',date:'2026-10-27',timeFormat:'19:00'},{id:2,teamAId:2,teamBId:34,status:'LIVE',date:'2026-10-25',timeFormat:'19:30'},{id:3,teamAId:2,teamBId:1,status:'SCHEDULED',date:'2026-10-26',timeFormat:'17:00'}];
  assert.deepEqual(teamMatches(games,34,'upcoming').map(g=>g.id),[2,1]);
});
test('results show most recent matches first, using time within a day',()=>{
  const games=[{id:1,teamAId:34,teamBId:2,status:'FINISHED',date:'2026-10-23',timeFormat:'17:00'},{id:2,teamAId:2,teamBId:34,status:'FINISHED',date:'2026-10-23',timeFormat:'19:30'},{id:3,teamAId:34,teamBId:2,status:'SCHEDULED',date:'2026-10-27',timeFormat:'19:00'}];
  assert.deepEqual(teamMatches(games,34,'results').map(g=>g.id),[2,1]);
});
test('form uses the selected team perspective for away victories',()=>{
  const games=[{id:1,teamAId:2,teamBId:34,status:'FINISHED',date:'2026-10-23',timeFormat:'19:30',homeScore:0,visitorScore:2}];
  assert.deepEqual(teamForm(games,34).map(g=>g.result),['win']);
});
test('a team without games has an empty form and match list',()=>{
  assert.deepEqual([teamMatches([],34,'upcoming'),teamForm([],34)],[[],[]]);
});

test('standings context shows the team between its ranked neighbours without changing input',()=>{
  const teams=[7,2,5,1,6,3,4].map(rank=>({id:rank,rank}));
  assert.deepEqual([standingsContext(teams,4).map(t=>t.rank),teams.map(t=>t.rank)],[[2,3,4,5,6],[7,2,5,1,6,3,4]]);
});
test('standings context fills the window at either end of the table',()=>{
  const teams=Array.from({length:7},(_,i)=>({id:i+1,rank:i+1}));
  assert.deepEqual([standingsContext(teams,1),standingsContext(teams,'7')].map(list=>list.map(t=>t.rank)),[[1,2,3,4,5],[3,4,5,6,7]]);
});
test('standings context handles a short table and an absent team',()=>{
  const teams=[{id:1,rank:1},{id:2,rank:2}];
  assert.deepEqual([standingsContext(teams,2),standingsContext(teams,99)],[teams,[]]);
});
test('form exposes opponent and scores from the selected team perspective',()=>{
  const own={id:34,name:'Команда'},other={id:2,name:'Соперник'};
  const games=[{id:1,teamAId:34,teamBId:2,teamA:own,teamB:other,status:'FINISHED',date:'2026-10-22',homeScore:0,visitorScore:2},{id:2,teamAId:2,teamBId:34,teamA:other,teamB:own,status:'FINISHED',date:'2026-10-23',homeScore:1,visitorScore:3}];
  assert.deepEqual(teamForm(games,34).map(g=>[g.opponentTeam,g.ownScore,g.opponentScore,g.home]),[[other,0,2,true],[other,3,1,false]]);
});
