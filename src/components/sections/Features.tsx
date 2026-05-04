const pillars = [
  {
    number: "01",
    icon: "🏆",
    headline: "El ranking los trae de vuelta",
    body: "Cuando alguien ve que bajó tres lugares en el ranking porque no fue a entrenar, vuelve. No porque se lo pidas — sino porque no puede quedarse atrás.",
    accent: "#7B2FF7",
  },
  {
    number: "02",
    icon: "⚡",
    headline: "Aforo en tiempo real, sin esfuerzo",
    body: "Cuando un miembro llega, su ubicación lo detecta automáticamente y el aforo se actualiza solo. Sin conteos, sin planillas, sin distracciones — tú y tu equipo saben en todo momento si hay espacio disponible.",
    accent: "#A855F7",
  },
  {
    number: "03",
    icon: "🎯",
    headline: "Valor agregado sin contratar a nadie",
    body: "Rutinas, nutrición y productos en un solo lugar. Tus miembros tienen todo lo que necesitan sin salir de tu app — y tú te diferencias sin contratar a nadie.",
    accent: "#5B1FCF",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-20 md:py-24 section-padding"
    >
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(123,47,247,0.3) 30%, rgba(123,47,247,0.3) 70%, transparent)" }}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(123,47,247,0.15) 30%, rgba(123,47,247,0.15) 70%, transparent)" }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto">
        {/* Label */}
        <div className="text-center mb-14">
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-3">
            Por qué funciona
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Retención que{" "}
            <span className="gold-text">no depende de ti</span>
          </h2>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-white/[0.06]">
          {pillars.map((p) => (
            <div key={p.number} className="flex flex-col px-0 md:px-10 first:pl-0 last:pr-0 py-8 md:py-0 border-b border-white/[0.06] last:border-b-0 md:border-b-0">
              {/* Watermark number */}
              <div className="relative mb-6">
                <span
                  className="text-8xl font-black select-none pointer-events-none absolute -top-4 -left-2 opacity-[0.06]"
                  style={{ color: p.accent }}
                >
                  {p.number}
                </span>
                <div
                  className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${p.accent}18`, border: `1px solid ${p.accent}30` }}
                >
                  {p.icon}
                </div>
              </div>

              <h3 className="text-lg font-black text-white mb-3 leading-snug">
                {p.headline}
              </h3>
              <p className="text-white/45 text-sm leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
