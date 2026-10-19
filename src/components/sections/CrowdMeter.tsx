import Image from "next/image";
import af1 from "@/assets/images/af1.jpg";

const stats = [
  { value: "98%", label: "Uptime del sistema" },
  { value: "Auto", label: "Notificaciones automáticas" },
  { value: "360°", label: "Visión del gimnasio" },
  { value: "24/7", label: "Soporte disponible" },
];

export default function CrowdMeter() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="card-ember">
              <p className="text-sm">{s.label}</p>
              <p className="display text-[48px] md:text-[80px] leading-[1.1] mt-2">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="tag">Smart Notifications</span>
            <h2 className="h2 mt-6 mb-6">El mensaje correcto, en el momento justo</h2>
            <p className="text-obsidian/70 text-lg leading-[1.55] mb-8">
              Fitzo detecta cuándo un miembro lleva días sin ir y le envía automáticamente una notificación
              push personalizada. Sin que tú tengas que hacer nada — el sistema trabaja mientras tú descansas.
            </p>
            <ul>
              {[
                "Notificaciones por inactividad, cumpleaños y promociones",
                "Mensajes personalizados por perfil de miembro",
                "Más retención sin esfuerzo manual de tu parte",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 py-3 border-t-[1.5px] border-dotted border-obsidian">
                  <span className="dot" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <Image
            src={af1}
            alt="Fitzo — Notificaciones push automáticas"
            sizes="(min-width: 1024px) 600px, 100vw"
            className="w-full rounded-card"
          />
        </div>
      </div>
    </section>
  );
}
