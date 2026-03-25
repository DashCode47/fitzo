const features = [
  {
    icon: "🏆",
    title: "Fitzo Legends Rankings",
    description:
      "Un ranking mensual gamificado que mantiene a tus miembros comprometidos. Puntos por asistencia, rutinas y referidos — incentivos que impulsan la retención.",
    color: "#FFD700",
  },
  {
    icon: "📍",
    title: "Check-in Automático",
    description:
      "Geofencing detecta automáticamente cuando un miembro entra a tu gimnasio y registra su asistencia. Sin filas, sin personal extra, sin errores.",
    color: "#C5A356",
  },
  {
    icon: "🥗",
    title: "Planes Nutricionales",
    description:
      "Asigna planes de dieta personalizados a tus miembros según sus objetivos. Valor agregado que diferencia tu gimnasio de la competencia.",
    color: "#22c55e",
  },
  {
    icon: "📊",
    title: "Ocupación en Tiempo Real",
    description:
      "Tus miembros consultan la capacidad del gimnasio desde la app antes de ir. Menos aglomeraciones, mejor experiencia, mayor satisfacción.",
    color: "#3b82f6",
  },
  {
    icon: "🎯",
    title: "Códigos QR por Actividad",
    description:
      "Genera QRs para cada actividad, clase o evento especial. Tus miembros los escanean para sumar puntos — tú controlas qué se premia y cómo.",
    color: "#a855f7",
  },
  {
    icon: "🔥",
    title: "Rachas y Logros",
    description:
      "El sistema de rachas y badges crea un hábito de asistencia. Miembros que entrenan más frecuentemente cancelan menos — el dato lo respalda.",
    color: "#FF4500",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-24 md:py-32 section-padding"
    >
      {/* Section header */}
      <div className="text-center mb-16 md:mb-20">
        <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
          Características
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
          Todo lo que tu gimnasio necesita
          <br />
          <span className="gold-text">para retener y crecer</span>
        </h2>
        <p className="text-white/50 max-w-xl mx-auto text-lg">
          Diseñado para propietarios que quieren más que solo administrar —
          quieren{" "}
          <span className="text-white/80">fidelizar</span>.
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {features.map((feature, i) => (
          <article
            key={feature.title}
            className="glass-card p-7 group hover:border-gold/20 transition-all duration-300 hover:shadow-gold-sm hover:-translate-y-1"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div
              className="text-4xl mb-5 w-14 h-14 flex items-center justify-center rounded-2xl"
              style={{ background: `${feature.color}15` }}
            >
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-gold transition-colors">
              {feature.title}
            </h3>
            <p className="text-white/50 text-sm leading-relaxed">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
