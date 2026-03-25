import Image from "next/image";
import LogoImg from "@/assets/images/Logo.png";

const links = {
  Producto: ["Características", "Precios", "Changelog", "Roadmap"],
  Comunidad: ["Fitzo Legends", "Ranking Global", "Eventos", "Blog"],
  Soporte: ["Centro de ayuda", "Contacto", "Estado del sistema", "API"],
  Legal: ["Privacidad", "Términos de uso", "Cookies"],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.06] section-padding pt-16 pb-10">
      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <Image src={LogoImg} alt="Fitzo" height={32} className="h-8 w-auto" />
            </div>
            <p className="text-white/35 text-sm leading-relaxed max-w-[180px]">
              Tu transformación comienza hoy. Máximo potencial.
            </p>
            {/* Social links */}
            <div className="flex gap-3 mt-5">
              {["Instagram", "TikTok", "YouTube"].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-white/40 hover:text-gold hover:border-gold/30 transition-colors text-xs font-bold"
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white/60 text-xs font-bold tracking-widest uppercase mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-white/35 text-sm hover:text-gold transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-white/25 text-sm">
            © {currentYear} Fitzo. Todos los derechos reservados.
          </p>
          <p className="text-white/20 text-xs">
            Hecho con 🦾 para atletas que van en serio.
          </p>
        </div>
      </div>
    </footer>
  );
}
