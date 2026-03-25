export default function CTA() {
  return (
    <section id="cta" className="relative py-24 md:py-32 section-padding overflow-hidden">
      {/* Gold glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #C5A356 0%, transparent 65%)" }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Icon */}
        <div className="text-6xl mb-8 animate-float inline-block">🦾</div>

        {/* Free month badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ background: "rgba(197,163,86,0.12)", border: "1px solid rgba(197,163,86,0.35)" }}>
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="text-gold text-xs font-bold tracking-widest uppercase">1 mes gratis · sin tarjeta · sin compromiso</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
          Prueba Fitzo gratis
          <br />
          <span className="gold-text">un mes completo</span>
        </h2>

        <p className="text-white/50 text-lg mb-12 leading-relaxed max-w-xl mx-auto">
          Sin contratos, sin tarjeta de crédito. Activa tu gimnasio hoy y
          decide al final del mes si Fitzo es para ti.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href="https://wa.me/593978724619?text=Hola%2C%20me%20interesa%20una%20demo%20de%20Fitzo%20para%20mi%20gimnasio%20%F0%9F%92%AA"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-lg w-full sm:w-auto gap-3 py-4 px-10 flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.833L.057 23.25a.75.75 0 00.918.928l5.555-1.43A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.66-.523-5.176-1.432l-.372-.22-3.849.99.999-3.75-.242-.386A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Empezar 1 mes gratis
          </a>
        </div>

        <p className="text-white/25 text-sm">
          La app para tus miembros está disponible en iOS y Android
        </p>
      </div>
    </section>
  );
}
