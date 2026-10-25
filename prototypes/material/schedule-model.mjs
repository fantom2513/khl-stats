export function matchDisplay(game) {
  return game.status==='SCHEDULED'?game.timeFormat:`${game.homeScore} : ${game.visitorScore}`;
}

export function filterGames(games, teamId='all', scope='all') {
  return games.filter(game=>(teamId==='all'||String(game.teamAId)===String(teamId)||String(game.teamBId)===String(teamId))&&(scope==='all'||game.status==='LIVE'));
}

export function parseMatchRoute(hash) {
  if(hash==='#/standings')return {kind:'standings'};
  if(!hash.startsWith('#/match/')&&!hash.startsWith('#/team/'))return {kind:'schedule'};
  const kind=hash.startsWith('#/team/')?'team':'match';
  const key=hash.slice(kind==='team'?7:8);
  const id=/^[1-9]\d*$/.test(key)&&Number.isSafeInteger(Number(key))?Number(key):null;
  return {kind,id};
}
