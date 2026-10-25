export function standingTeams(rows) {
  return rows.map(row=>({...row,id:row.teamId}));
}

export function standingGroups(teams,view) {
  if(view==='overall')return [{title:'Чемпионат',conference:'',division:'',teams:[...teams]}];
  const groups=new Map();
  for(const team of teams){
    const conference=team.conference||'КХЛ';
    const division=view==='division'?(team.division||'Без дивизиона'):'';
    const key=JSON.stringify([conference,division]);
    if(!groups.has(key))groups.set(key,{title:division||conference,conference,division,teams:[]});
    groups.get(key).teams.push(team);
  }
  return [...groups.values()];
}

export function teamMatches(games,teamId,view) {
  const key=game=>`${String(game.date).slice(0,10)} ${game.timeFormat||'00:00'}`;
  return games.filter(game=>(String(game.teamAId)===String(teamId)||String(game.teamBId)===String(teamId))&&(view==='results'?game.status==='FINISHED':game.status!=='FINISHED')).sort((a,b)=>{
    if(view==='results')return key(b).localeCompare(key(a));
    return Number(b.status==='LIVE')-Number(a.status==='LIVE')||key(a).localeCompare(key(b));
  });
}

export function teamForm(games,teamId) {
  return teamMatches(games,teamId,'results').slice(0,5).reverse().map(game=>{
    const home=String(game.teamAId)===String(teamId);
    const own=home?game.homeScore:game.visitorScore;
    const opponent=home?game.visitorScore:game.homeScore;
    return {...game,home,opponentTeam:home?game.teamB:game.teamA,ownScore:own,opponentScore:opponent,result:own===opponent?'draw':own>opponent?'win':'loss'};
  });
}

export function standingsContext(teams,teamId) {
  const ranked=[...teams].sort((a,b)=>a.rank-b.rank);
  const index=ranked.findIndex(team=>String(team.id)===String(teamId));
  if(index<0)return [];
  const start=Math.max(0,Math.min(index-2,ranked.length-5));
  return ranked.slice(start,start+5);
}
