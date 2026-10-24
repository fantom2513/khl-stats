import Link from "next/link";

export function SiteHeader({ active = "schedule" }: { active?: "schedule" | "standings" | null }) {
  return <header className="site-header">
    <Link href="/" className="site-wordmark" aria-label="На льду — главная">НА ЛЬДУ<span>.</span></Link>
    <nav aria-label="Главная навигация">
      <Link href="/#schedule" aria-current={active === "schedule" ? "page" : undefined}>Расписание</Link>
      <Link href="/standings" aria-current={active === "standings" ? "page" : undefined}>Таблица ↗</Link>
    </nav>
  </header>;
}
