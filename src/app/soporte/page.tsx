import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soporte",
  description: "Centro de ayuda de Fitzo: preguntas frecuentes y contacto con soporte.",
};

const faqs = [
  {
    q: "¿Cómo se registran mis entrenamientos?",
    a: "Fitzo detecta automáticamente tu entrada y salida del gimnasio mediante geolocalización. Asegúrate de conceder el permiso de ubicación \"Siempre\" para que tus sesiones se validen correctamente.",
  },
  {
    q: "Mi sesión no se registró, ¿qué hago?",
    a: "Verifica que la ubicación y las notificaciones estén activadas para Fitzo y que no tengas el modo de ahorro de batería restringiendo la app. Si el problema persiste, escríbenos con la fecha y hora de tu entrenamiento.",
  },
  {
    q: "¿Cómo funcionan las rachas, el XP y el ranking?",
    a: "Cada entrenamiento validado suma puntos de experiencia (XP) y mantiene tu racha. Tu posición en el ranking se calcula con base en tu XP frente a otros miembros de la comunidad.",
  },
  {
    q: "No recibo notificaciones",
    a: "Revisa en la configuración de tu teléfono que las notificaciones de Fitzo estén permitidas. Cerrar sesión y volver a ingresar también renueva el registro de notificaciones.",
  },
  {
    q: "¿Cómo elimino mi cuenta?",
    a: "Puedes eliminar tu cuenta desde la configuración de tu perfil en la app o solicitándolo por correo. Eliminamos tus datos personales en un plazo máximo de 30 días.",
  },
];

export default function Support() {
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
            Ayuda
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Centro de <span className="gold-text">Soporte</span>
          </h1>
          <p className="text-white/40 text-sm">¿Tienes un problema con la app? Estamos para ayudarte.</p>
        </div>

        {/* Contact */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-3">Contáctanos</h2>
          <p className="text-white/55 leading-relaxed mb-4">
            Respondemos normalmente en menos de 48 horas.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href="mailto:daviddev47@hotmail.com"
              className="text-gold hover:text-gold-light transition-colors font-semibold"
            >
              Correo: daviddev47@hotmail.com
            </a>
            <a
              href="https://wa.me/593978724619"
              className="text-gold hover:text-gold-light transition-colors font-semibold"
            >
              WhatsApp: +593 97 872 4619
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="flex flex-col gap-6">
          {faqs.map((f) => (
            <div key={f.q} className="glass-card p-6">
              <h2 className="text-white font-bold text-lg mb-3">{f.q}</h2>
              <p className="text-white/55 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-white/40 text-sm mt-12">
          Consulta también nuestra{" "}
          <Link href="/privacidad" className="text-gold hover:text-gold-light transition-colors">
            Política de Privacidad
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
