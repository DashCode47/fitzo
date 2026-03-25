const podium = [
  {
    rank: 2,
    name: "Carlos M.",
    points: 4820,
    streak: 18,
    badge: "🥈",
    color: "#C0C0C0",
    height: "h-32",
  },
  {
    rank: 1,
    name: "María V.",
    points: 6540,
    streak: 31,
    badge: "🥇",
    color: "#FFD700",
    height: "h-44",
  },
  {
    rank: 3,
    name: "Andrés L.",
    points: 3960,
    streak: 12,
    badge: "🥉",
    color: "#CD7F32",
    height: "h-24",
  },
];

const howToEarn = [
  { icon: "🏋️", action: "Visita al gimnasio", points: "+50 pts" },
  { icon: "📱", action: "Escaneo QR de rutina", points: "+30 pts" },
  { icon: "🔥", action: "Racha de 7 días", points: "+200 pts" },
  { icon: "👥", action: "Referido activo", points: "+500 pts" },
];

export default function Rankings() {
  return (
    <section
      id="rankings"
      className="relative py-24 md:py-32 section-padding overflow-hidden"
    >
      {/* Gold radial background */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #FFD700 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div>
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
            Fitzo Legends
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Compite por el{" "}
            <span className="gold-text">trono del gimnasio</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-10">
            Cada mes se resetean los puntos y todos tienen una oportunidad de llegar al
            podio. ¿Tienes lo que se necesita para ser una{" "}
            <span className="text-gold font-semibold">Fitzo Legend</span>?
          </p>

          {/* How to earn */}
          <div className="space-y-3">
            <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-4">
              Cómo ganar puntos
            </p>
            {howToEarn.map((item) => (
              <div
                key={item.action}
                className="flex items-center justify-between glass-card px-5 py-3.5 hover:border-gold/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-white/70 text-sm">{item.action}</span>
                </div>
                <span className="text-gold font-bold text-sm">{item.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Podium */}
        <div className="flex flex-col items-center">
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase mb-8">
            Ranking mensual — Marzo 2026
          </p>

          {/* Podium visualization */}
          <div className="flex items-end justify-center gap-4 w-full mb-6">
            {[podium[0], podium[1], podium[2]].map((member) => (
              <div key={member.rank} className="flex flex-col items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${member.color}22, ${member.color}44)`,
                      border: `2px solid ${member.color}`,
                      boxShadow: `0 0 20px ${member.color}40`,
                    }}
                  >
                    {member.name[0]}
                  </div>
                  <span className="absolute -top-2 -right-2 text-lg">{member.badge}</span>
                </div>

                {/* Name & points */}
                <div className="text-center">
                  <p className="text-white text-xs font-bold">{member.name}</p>
                  <p className="text-xs font-black" style={{ color: member.color }}>
                    {member.points.toLocaleString()} pts
                  </p>
                  <p className="text-white/30 text-[10px]">🔥 {member.streak} días</p>
                </div>

                {/* Podium block */}
                <div
                  className={`w-24 ${member.height} rounded-t-xl flex items-center justify-center`}
                  style={{
                    background: `linear-gradient(180deg, ${member.color}30 0%, ${member.color}10 100%)`,
                    border: `1px solid ${member.color}30`,
                  }}
                >
                  <span
                    className="text-4xl font-black opacity-30"
                    style={{ color: member.color }}
                  >
                    {member.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ELITE badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(197,163,86,0.15), rgba(255,215,0,0.1))",
              border: "1px solid rgba(197,163,86,0.4)",
            }}
          >
            <span className="text-gold-bright text-sm font-black tracking-widest">
              ⚡ MODO ELITE ACTIVO
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
