import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Uso",
  description: "Términos y condiciones de uso de la aplicación Fitzo.",
};

const sections = [
  {
    title: "1. Aceptación de los Términos",
    content: "Al descargar, registrarte o utilizar Fitzo, aceptas estos Términos de Uso. Si no estás de acuerdo con ellos, no debes utilizar la aplicación.",
  },
  {
    title: "2. Uso de la Aplicación",
    content: "Fitzo es una aplicación de seguimiento de entrenamiento y gamificación para miembros de gimnasios. Al usarla te comprometes a:",
    items: [
      "Proporcionar información veraz y mantener la seguridad de tu cuenta.",
      "No manipular la ubicación de tu dispositivo ni falsear tus sesiones de entrenamiento para obtener XP, rachas o posiciones en el ranking.",
      "No publicar nombres de usuario o contenido ofensivo, ilegal o que suplante a otra persona.",
      "No intentar acceder sin autorización a los sistemas de Fitzo ni interferir con su funcionamiento.",
    ],
  },
  {
    title: "3. Cuentas",
    content: "Eres responsable de toda la actividad realizada desde tu cuenta. Podemos suspender o eliminar cuentas que incumplan estos términos, incluyendo el reinicio de XP, rachas o rankings obtenidos de forma fraudulenta.",
  },
  {
    title: "4. Salud y Responsabilidad",
    content: "Fitzo no ofrece asesoramiento médico. Consulta a un profesional de la salud antes de iniciar cualquier programa de ejercicio. Realizas tu actividad física bajo tu propia responsabilidad y Fitzo no se hace responsable de lesiones o daños derivados de ella.",
  },
  {
    title: "5. Propiedad Intelectual",
    content: "La aplicación, su diseño, marca y contenido son propiedad de Fitzo. No está permitido copiar, modificar o distribuir ninguna parte de la aplicación sin autorización previa por escrito.",
  },
  {
    title: "6. Disponibilidad del Servicio",
    content: "Fitzo se ofrece \"tal cual\". Trabajamos para mantener el servicio disponible y preciso, pero no garantizamos que funcione sin interrupciones ni errores, ni que la detección automática de sesiones sea exacta en todos los casos.",
  },
  {
    title: "7. Privacidad",
    content: "El tratamiento de tus datos personales se rige por nuestra Política de Privacidad.",
  },
  {
    title: "8. Cambios en los Términos",
    content: "Podemos actualizar estos términos ocasionalmente. Te notificaremos sobre cambios significativos a través de la aplicación o por correo electrónico. El uso continuado de Fitzo implica la aceptación de los términos actualizados.",
  },
];

export default function Terms() {
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
            Términos de <span className="gold-text">Uso</span>
          </h1>
          <p className="text-white/40 text-sm">Última actualización: 19 de octubre de 2026</p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.title} className="glass-card p-6">
              <h2 className="text-white font-bold text-lg mb-3">{section.title}</h2>
              <p className="text-white/55 leading-relaxed">
                {section.content}
                {section.title.startsWith("7.") && (
                  <>
                    {" "}
                    <Link href="/privacidad" className="text-gold hover:text-gold-light transition-colors">
                      Ver Política de Privacidad
                    </Link>
                  </>
                )}
              </p>
              {section.items && (
                <ul className="flex flex-col gap-3 mt-4">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gold mt-2" />
                      <span className="text-white/55 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Contact section */}
          <div className="glass-card p-6">
            <h2 className="text-white font-bold text-lg mb-3">9. Contacto</h2>
            <p className="text-white/55 leading-relaxed mb-3">
              Si tienes preguntas sobre estos términos, puedes contactarnos en:
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
