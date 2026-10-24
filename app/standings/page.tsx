import { SiteHeader } from "@/components/SiteHeader";
import { StandingsBrowser } from "./StandingsBrowser";
import { getStandingsSafe } from "@/lib/standings";

export const revalidate = 60;

export default async function StandingsPage() {
  const standings = await getStandingsSafe();

  return (
    <><a className="skip-link" href="#standings">К таблице</a><SiteHeader active="standings" />
    <main id="standings" className="standings-page">
      <header className="standings-heading">
        <div><p className="eyebrow">Регулярный чемпионат КХЛ</p><h1>РАСКЛАД<br /><span>СИЛ.</span></h1></div>
        <p>{standings.overall.teams.length} команд.<br />Каждое очко имеет вес.</p>
      </header>
      <StandingsBrowser standings={standings} />
    </main></>
  );
}
