import Image from "next/image";
import af1 from "@/assets/images/af1.jpg";

export default function CrowdMeter() {
  return (
    <section className="relative py-20 md:py-28 section-padding overflow-hidden">
      {/* Background divider */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(197,163,86,0.03) 50%, transparent 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { value: "98%", label: "Uptime del sistema", icon: "⚡" },
            { value: "<2s", label: "Check-in automático", icon: "📍" },
            { value: "360°", label: "Visión del gimnasio", icon: "👁️" },
            { value: "24/7", label: "Soporte disponible", icon: "💬" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card p-6 text-center hover:border-gold/20 transition-all hover:shadow-gold-sm"
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-3xl font-black gold-text mb-1">{stat.value}</div>
              <div className="text-white/40 text-xs leading-snug">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CrowdMeter feature highlight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
              CrowdMeter
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Sabe cuándo ir{" "}
              <span className="gold-text">antes de salir</span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Tus miembros consultan la ocupación del gimnasio en tiempo real
              desde la app. Sin sorpresas, sin aglomeraciones. Verde, amarillo
              o rojo — siempre saben qué esperar antes de salir de casa.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Aforo actualizado cada 30 segundos",
                "Indicador visual por nivel de ocupación",
                "Menos quejas, mejor experiencia para todos",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gold" />
                  <span className="text-white/70 text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CrowdMeter image */}
          <div className="flex items-center justify-center">
            <div
              style={{
                filter: "drop-shadow(0 0 60px rgba(34,197,94,0.2))",
              }}
            >
              <Image
                src={af1}
                alt="CrowdMeter — Aforo en tiempo real"
                className="w-full max-w-lg rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
