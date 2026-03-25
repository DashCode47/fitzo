const messages = [
  { name: "Carlos F.", handle: "@carlosf_gym", text: "La app está 🔥 mis miembros no paran de competir en el ranking", color: "#C5A356" },
  { name: "Rodrigo S.", handle: "@rodrigo.elite", text: "Nunca pensé que mis clientes iban a pelear por ir al gym más seguido 😂", color: "#a855f7" },
  { name: "Tomás R.", handle: "@tomasfit", text: "Lo del CrowdMeter es una locura, mis miembros me preguntan si ya está en App Store", color: "#3b82f6" },
  { name: "Valeria M.", handle: "@vale.training", text: "El plan nutricional personalizado fue lo que me convenció. Vale cada peso 💪", color: "#22c55e" },
  { name: "Diego A.", handle: "@diegoactivo", text: "Llevaba años buscando algo así. Sencillo para el usuario, potente por dentro", color: "#FF4500" },
];

export default function Testimonials() {
  return (
    <section className="relative py-24 md:py-32 section-padding overflow-hidden">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
            Wall of Love
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Lo que dicen{" "}
            <span className="gold-text">los primeros</span>
          </h2>
          <p className="text-white/40 text-sm">
            Mensajes reales de nuestros early users
          </p>
        </div>

        {/* Masonry-style grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.handle}
              className="break-inside-avoid glass-card p-5 flex flex-col gap-3"
            >
              {/* Author row */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{
                    background: `${m.color}18`,
                    border: `1.5px solid ${m.color}50`,
                    color: m.color,
                  }}
                >
                  {m.name[0]}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-none">{m.name}</p>
                  <p className="text-white/30 text-xs mt-0.5">{m.handle}</p>
                </div>
              </div>

              {/* Message */}
              <p className="text-white/65 text-sm leading-relaxed">
                {m.text}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-white/20 text-xs mt-10">
          ¿Ya usas Fitzo? Etiquétanos y aparece aquí.
        </p>

      </div>
    </section>
  );
}
