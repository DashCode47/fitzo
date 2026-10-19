"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/assets/images/logo-mark.png";
import { WA_URL, WhatsAppIcon } from "@/lib/whatsapp";

const navLinks = [
  { label: "Características", href: "#features" },
  { label: "Cómo funciona", href: "#how-it-works" },
  { label: "Rankings", href: "#rankings" },
  { label: "Nutrición", href: "#nutrition" },
  { label: "Blog", href: "/blog" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Fitzo — Software de gestión para gimnasios">
      <Image src={LogoMark} alt="" height={24} className="h-6 w-auto" />
      <span className="display text-[28px] leading-none">Fitzo</span>
    </Link>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = usePathname() === "/";

  const resolveHref = (href: string) => (href.startsWith("#") && !isHome ? `/${href}` : href);

  return (
    <header className="fixed top-3 inset-x-0 z-50 px-4">
      <nav className="max-w-page mx-auto bg-limestone rounded-full flex items-center justify-between h-14 md:h-16 pl-5 pr-2">
        <Logo />

        <ul className="hidden md:flex items-center gap-[9px]">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={resolveHref(link.href)}
                className="rounded-full px-3 py-2 hover:bg-pumice transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary hidden md:inline-flex"
        >
          <WhatsAppIcon />
          Prueba gratis
        </a>

        <button
          className="md:hidden flex flex-col gap-1.5 p-3"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <span className={`block w-6 h-0.5 bg-obsidian transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-obsidian transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-obsidian transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden mt-2 bg-limestone rounded-card p-6 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={resolveHref(link.href)}
              onClick={() => setMenuOpen(false)}
              className="rounded-full px-3 py-3 text-lg hover:bg-pumice transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4">
            <WhatsAppIcon />
            Activar mi gimnasio gratis
          </a>
        </div>
      )}
    </header>
  );
}
