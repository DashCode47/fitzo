const customizations = [
  { icon: "🎨", label: "Colores de marca" },
  { icon: "🖼️", label: "Logo del gimnasio" },
  { icon: "✏️", label: "Nombre de la app" },
  { icon: "🏷️", label: "Nombre del ranking" },
  { icon: "🎁", label: "Recompensas propias" },
  { icon: "📣", label: "Banners y promociones" },
];

export default function Customization() {
  return (
    <section className="relative py-24 md:py-32 section-padding overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(197,163,86,0.04) 50%, transparent 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div>
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
            White Label
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Tu gimnasio,
            <br />
            <span className="gold-text">tu identidad</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-8">
            Fitzo se adapta completamente a la imagen de tu negocio. Tus
            miembros verán{" "}
            <span className="text-white/80">tu marca</span> — no la nuestra.
            Personaliza colores, logo, nombre del ranking y mucho más desde el
            panel de administración.
          </p>

          {/* Customization chips */}
          <div className="flex flex-wrap gap-3 mb-10">
            {customizations.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:border-gold/30 transition-colors"
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-white/70 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <a
            href="https://wa.me/593978724619?text=Hola%2C%20me%20interesa%20una%20demo%20de%20Fitzo%20para%20mi%20gimnasio%20%F0%9F%92%AA"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            Ver demo personalizada
          </a>
        </div>

        {/* Right: Phone mockup with two "themes" */}
        <div className="flex items-center justify-center gap-6">
          {/* Theme A — dark gold (default Fitzo) */}
          <div className="relative flex-shrink-0">
            <div
              className="w-44 rounded-3xl p-4 flex flex-col gap-3"
              style={{
                background: "#111",
                border: "1px solid rgba(197,163,86,0.25)",
                boxShadow: "0 0 40px rgba(197,163,86,0.12)",
              }}
            >
              {/* Status bar mock */}
              <div className="flex justify-between items-center px-1">
                <span className="text-white/30 text-[9px]">9:41</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gold/60" />
                </div>
              </div>
              {/* App header */}
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(197,163,86,0.1)" }}>
                <p className="text-[10px] font-black tracking-widest text-white">FITZO</p>
                <p className="text-gold text-[8px] mt-0.5">Tu Gimnasio</p>
              </div>
              {/* Mock cards */}
              <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-16 h-1.5 rounded-full bg-gold/40 mb-1.5" />
                <div className="w-10 h-1.5 rounded-full bg-white/10" />
              </div>
              <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-12 h-1.5 rounded-full bg-gold/40 mb-1.5" />
                <div className="w-8 h-1.5 rounded-full bg-white/10" />
              </div>
              <p className="text-center text-[9px] text-gold/60 font-semibold tracking-widest mt-1">
                DEFAULT
              </p>
            </div>
          </div>

          {/* Divider arrow */}
          <div className="flex flex-col items-center gap-2 text-white/20">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
            <span className="text-xl">→</span>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
          </div>

          {/* Theme B — custom brand example */}
          <div className="relative flex-shrink-0">
            {/* "Personalizado" label */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black tracking-wider whitespace-nowrap"
              style={{
                background: "linear-gradient(135deg, #C5A356, #FFD700)",
                color: "#000",
              }}
            >
              PERSONALIZADO
            </div>

            <div
              className="w-44 rounded-3xl p-4 flex flex-col gap-3 mt-2"
              style={{
                background: "#0d1117",
                border: "1px solid rgba(99,102,241,0.35)",
                boxShadow: "0 0 40px rgba(99,102,241,0.12)",
              }}
            >
              {/* Status bar mock */}
              <div className="flex justify-between items-center px-1">
                <span className="text-white/30 text-[9px]">9:41</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
                </div>
              </div>
              {/* App header custom */}
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                <p className="text-[10px] font-black tracking-widest text-white">POWERHOUSE</p>
                <p className="text-[8px] mt-0.5" style={{ color: "#818cf8" }}>Elite Fitness Club</p>
              </div>
              {/* Mock cards */}
              <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="w-16 h-1.5 rounded-full mb-1.5" style={{ background: "rgba(99,102,241,0.5)" }} />
                <div className="w-10 h-1.5 rounded-full bg-white/10" />
              </div>
              <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="w-12 h-1.5 rounded-full mb-1.5" style={{ background: "rgba(99,102,241,0.5)" }} />
                <div className="w-8 h-1.5 rounded-full bg-white/10" />
              </div>
              <p className="text-center text-[9px] font-semibold tracking-widest mt-1" style={{ color: "#818cf8" }}>
                TU MARCA
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
