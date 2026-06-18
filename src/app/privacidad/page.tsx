import Link from "next/link";

const sections = [
  {
    title: "1. Información que Recopilamos",
    content: "Para ofrecerte la mejor experiencia de entrenamiento, Fitzo recopila:",
    items: [
      { label: "Información de Perfil", text: "Nombre de usuario, correo electrónico y foto de perfil." },
      { label: "Datos de Fitness", text: "Historial de entrenamientos, rachas (streaks), puntos de experiencia (XP) y posición en el ranking." },
      { label: "Ubicación", text: "Utilizamos servicios de geolocalización (como Radar) para detectar automáticamente tu entrada y salida del gimnasio y validar tus sesiones." },
      { label: "Datos del Dispositivo", text: "Modelo de dispositivo, versión del sistema operativo e identificadores únicos para notificaciones push." },
    ],
  },
  {
    title: "2. Uso de la Información",
    content: "Utilizamos tus datos para:",
    items: [
      { text: "Gestionar tu cuenta y personalizar tu experiencia de usuario." },
      { text: "Calcular tus estadísticas de progreso y posiciones en el ranking global." },
      { text: "Verificar tu asistencia al gimnasio mediante geocercas (geofencing)." },
      { text: "Enviarte recordatorios y motivaciones para mantener tu racha de entrenamiento." },
    ],
  },
  {
    title: "3. Compartición de Datos",
    content: "Fitzo no vende tus datos personales a terceros. Tus datos solo se comparten en los siguientes casos:",
    items: [
      { label: "Ranking Público", text: "Tu nombre de usuario, XP y racha son visibles para otros miembros de la comunidad en la tabla de clasificación." },
      { label: "Proveedores de Servicios", text: "Utilizamos Supabase para el almacenamiento de datos y Radar para la geolocalización, quienes procesan los datos siguiendo estrictos estándares de seguridad." },
    ],
  },
  {
    title: "4. Seguridad de los Datos",
    content: "Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o alteración. Sin embargo, ningún método de transmisión por internet es 100% seguro.",
  },
  {
    title: "5. Conservación de Datos",
    content: "Conservamos tus datos personales mientras tu cuenta permanezca activa. Si solicitas la eliminación de tu cuenta, eliminamos tus datos personales en un plazo máximo de 30 días, salvo que debamos conservar cierta información por obligaciones legales o para resolver disputas.",
  },
  {
    title: "6. Tus Derechos",
    content: "Tienes derecho a acceder, corregir o eliminar tus datos personales en cualquier momento. Puedes hacerlo directamente desde la configuración de tu perfil en la app o contactándonos por correo electrónico.",
  },
  {
    title: "7. Cambios en esta Política",
    content: "Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cualquier cambio significativo a través de la aplicación o por correo electrónico.",
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen py-20 px-4 section-padding">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-gold text-sm transition-colors mb-10"
        >
          ← Volver al inicio
        </Link>

        {/* Header */}
        <div className="mb-12">
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Política de{" "}
            <span className="gold-text">Privacidad</span>
          </h1>
          <p className="text-white/40 text-sm">Última actualización: 5 de mayo de 2026</p>
        </div>

        {/* Intro */}
        <div className="glass-card p-6 mb-8">
          <p className="text-white/60 leading-relaxed">
            En <span className="text-white font-semibold">Fitzo</span>, valoramos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política explica cómo recopilamos, usamos y protegemos tu información cuando utilizas nuestra aplicación móvil.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.title} className="glass-card p-6">
              <h2 className="text-white font-bold text-lg mb-3">{section.title}</h2>
              <p className="text-white/55 leading-relaxed mb-4">{section.content}</p>
              {section.items && (
                <ul className="flex flex-col gap-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gold mt-2" />
                      <span className="text-white/55 text-sm leading-relaxed">
                        {"label" in item && item.label && (
                          <span className="text-white font-semibold">{item.label}: </span>
                        )}
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Contact section */}
          <div className="glass-card p-6">
            <h2 className="text-white font-bold text-lg mb-3">8. Contacto</h2>
            <p className="text-white/55 leading-relaxed mb-3">
              Si tienes preguntas sobre esta política o el tratamiento de tus datos, puedes contactarnos en:
            </p>
            <a
              href="mailto:daviddev47@hotmail.com"
              className="text-gold hover:text-gold-light transition-colors font-semibold text-sm"
            >
              daviddev47@hotmail.com
            </a>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-xs mt-12">
          © 2026 Fitzo App. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
}
