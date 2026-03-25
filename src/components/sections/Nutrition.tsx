const macros = [
  { label: "Proteína", value: 165, unit: "g", color: "#C5A356", percent: 70 },
  { label: "Carbohidratos", value: 220, unit: "g", color: "#3b82f6", percent: 55 },
  { label: "Grasas", value: 65, unit: "g", color: "#22c55e", percent: 45 },
];

const goals = [
  { icon: "💪", label: "Ganancia muscular" },
  { icon: "🔥", label: "Pérdida de grasa" },
  { icon: "⚡", label: "Rendimiento deportivo" },
  { icon: "🏃", label: "Resistencia cardiovascular" },
];

export default function Nutrition() {
  return (
    <section
      id="nutrition"
      className="relative py-24 md:py-32 section-padding overflow-hidden"
    >
      <div
        className="absolute right-0 bottom-0 w-[400px] h-[400px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #22c55e 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Nutrition card mockup */}
        <div className="flex flex-col items-center lg:items-start">
          <div
            className="w-full max-w-sm glass-card p-7 rounded-3xl"
            style={{ boxShadow: "0 0 60px rgba(197,163,86,0.1)" }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest">Plan activo</p>
                <p className="text-white font-bold text-lg">Volumen Limpio 🍗</p>
              </div>
              <div
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(197,163,86,0.15)",
                  color: "#C5A356",
                  border: "1px solid rgba(197,163,86,0.3)",
                }}
              >
                ACTIVO
              </div>
            </div>

            {/* Calorie ring */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="url(#goldGrad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.72} ${2 * Math.PI * 40}`}
                  />
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#C5A356" />
                      <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">2,340</span>
                  <span className="text-white/40 text-xs">kcal / día</span>
                </div>
              </div>
            </div>

            {/* Macros */}
            <div className="space-y-4">
              {macros.map((macro) => (
                <div key={macro.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/60">{macro.label}</span>
                    <span className="font-bold" style={{ color: macro.color }}>
                      {macro.value}{macro.unit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${macro.percent}%`, background: macro.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Text */}
        <div>
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
            Nutrición
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Tu dieta,{" "}
            <span className="gold-text">calculada para ti</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-8">
            Ingresa tu peso, altura, edad y objetivo. Fitzo calcula automáticamente
            tus calorías y macros ideales, asignándote un plan de alimentación
            personalizado para maximizar tus resultados.
          </p>

          {/* Goals */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {goals.map((goal) => (
              <div
                key={goal.label}
                className="glass-card flex items-center gap-3 px-4 py-3.5 hover:border-gold/20 transition-colors"
              >
                <span className="text-xl">{goal.icon}</span>
                <span className="text-white/70 text-sm font-medium">{goal.label}</span>
              </div>
            ))}
          </div>

          <a
            href="https://wa.me/593978724619?text=Hola%2C%20me%20interesa%20una%20demo%20de%20Fitzo%20para%20mi%20gimnasio%20%F0%9F%92%AA"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            Calcula tus macros gratis
          </a>
        </div>
      </div>
    </section>
  );
}
