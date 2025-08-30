"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string };

export default function AppHeader({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <header className="header sticky top-0 z-40">
      {/* --- ESTE ES EL CAMBIO CLAVE --- */}
      {/* Usamos el mismo contenedor que el layout principal para una alineación perfecta */}
      <div className="mx-auto max-w-5xl px-4">
        <nav className="h-16 flex items-center justify-between">
          <Link href="/proyecto" className="font-bold text-lg text-foreground hover:opacity-90">
            Bob Electricista
          </Link>
          <ul className="flex items-center gap-6 text-sm">
            {tabs.map((t) => {
              const active = pathname?.startsWith(t.href);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className={
                      active
                        ? "font-medium underline decoration-[var(--color-base)] underline-offset-4"
                        : "text-foreground/70 hover:text-foreground"
                    }
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}