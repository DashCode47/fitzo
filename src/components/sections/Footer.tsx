import Link from "next/link";
import { Logo } from "@/components/sections/Navbar";

const links: Record<string, { label: string; href: string }[]> = {
  Producto: [
    { label: "Características", href: "#features" },
    { label: "Blog", href: "/blog" },
  ],
  Soporte: [
    { label: "Contacto", href: "https://wa.me/593978724619" },
    { label: "Centro de ayuda", href: "/soporte" },
  ],
  Legal: [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Términos de uso", href: "/terminos" },
  ],
};

export default function Footer() {
  return (
    <footer className="pb-6">
      <div className="wrap">
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="text-obsidian/60 text-sm leading-[1.55] max-w-[220px] mt-4">
                El sistema que hace que tus miembros vuelvan — mes tras mes.
              </p>
            </div>

            {Object.entries(links).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-obsidian/50 text-xs mb-4">{category}</h4>
                <ul className="space-y-2.5">
                  {items.map((item) =>
                    <li key={item.label}>
                      {item.href.startsWith("/") ? (
                        <Link href={item.href} className="hover:text-ember transition-colors">
                          {item.label}
                        </Link>
                      ) : (
                        <a href={item.href} className="hover:text-ember transition-colors">
                          {item.label}
                        </a>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          <hr className="divider my-10" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-obsidian/60">
            <p>© {new Date().getFullYear()} Fitzo. Todos los derechos reservados.</p>
            <p>Hecho con 🦾 para gimnasios que van en serio.</p>
          </div>
        </div>

        <p aria-hidden="true" className="display text-[clamp(96px,26vw,189px)] text-center select-none mt-6">
          Fitzo
        </p>
      </div>
    </footer>
  );
}
