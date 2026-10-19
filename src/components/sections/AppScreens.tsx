import Image from "next/image";
import mu1 from "@/assets/images/screens/mu1.png";
import mu2 from "@/assets/images/screens/mu2.png";
import mu4 from "@/assets/images/screens/mu4.png";
import mu5 from "@/assets/images/screens/mu5.png";
import mu6 from "@/assets/images/screens/mu6.png";
import mu7 from "@/assets/images/screens/mu7.png";

const screens = [
  {
    image: mu1,
    tag: "Dashboard",
    title: "Todo lo que importa, en una sola pantalla",
    description:
      "Al abrir la app, tus miembros ven su posición en el ranking, notificaciones activas, promociones y su plan nutricional asignado. Información útil desde el primer segundo.",
    benefits: [
      "Notificaciones personalizadas",
      "Ranking de los más activos",
      "Promociones personalizadas",
    ],
  },
  {
    image: mu2,
    tag: "Rutinas",
    title: "Su plan de entrenamiento siempre a la mano",
    description:
      "Cada miembro tiene su plan semanal organizado por día. Saben exactamente qué entrenar hoy, pueden explorar rutinas disponibles y registrar su progreso sin papel ni excusas.",
    benefits: [
      "Plan semanal personalizado",
      "Entrenamiento del día destacado",
      "Biblioteca de rutinas por nivel",
    ],
  },
  {
    image: mu4,
    tag: "Nutrición",
    title: "Nutrición personalizada: valor premium sin costos",
    description:
      "Ofrece planes de alimentación profesionales sin contratar nutricionistas. Fitzo calcula automáticamente las calorías y macros según el perfil de cada miembro, dándote una ventaja competitiva brutal.",
    benefits: [
      "Automatización de planes alimenticios",
      "Diferenciación inmediata de tu competencia",
      "Valor agregado de alto impacto",
    ],
  },
  {
    image: mu5,
    tag: "Rankings",
    title: "Competencia real que engancha y retiene",
    description:
      "El sistema de ranking gamifica la asistencia. Tus miembros compiten por los primeros puestos, ganan títulos y no quieren perder su posición — lo que se traduce en menos cancelaciones.",
    benefits: [
      "Tabla de posiciones en tiempo real",
      "Títulos y rangos por rendimiento",
      "FOMO que convierte ausencias en asistencia",
    ],
  },
  {
    image: mu6,
    tag: "Mis Rangos",
    title: "Sube de nivel según tu fuerza real",
    description:
      "El rango de cada miembro se calcula en base a su fuerza relativa — el peso que levanta dividido por su propio peso corporal. Cuanto más fuerte, mayor el rango. Un sistema justo que motiva a todos por igual.",
    benefits: [
      "Rangos basados en fuerza relativa, no en talla",
      "Guía clara de cómo subir de nivel",
      "Seguimiento por grupo muscular",
    ],
  },
  {
    image: mu7,
    tag: "Progresión",
    title: "Cada kilo importa. Cada sesión, registrada.",
    description:
      "Tus miembros pueden ver su historial de carga por ejercicio, su récord personal y cómo han progresado sesión a sesión. Ver el avance en una gráfica es el mejor motivador para volver mañana.",
    benefits: [
      "Récord personal por ejercicio",
      "Historial de carga con gráfica",
      "Detalle de cada sesión registrada",
    ],
  },
];

export default function AppScreens() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="max-w-3xl mb-10 md:mb-14">
          <span className="tag">La App</span>
          <h2 className="h2 mt-6">Cada pantalla, diseñada con propósito</h2>
          <p className="text-lg text-obsidian/70 mt-6">
            Una experiencia que tus miembros van a querer abrir todos los días.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {screens.map((screen, i) => (
            <article key={screen.tag} className="card grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div
                className={`rounded-card overflow-hidden flex justify-center pt-10 px-6 ${
                  i % 2 ? "bg-obsidian lg:order-2" : "bg-ember"
                }`}
              >
                <Image
                  src={screen.image}
                  alt={`App Fitzo — ${screen.tag}`}
                  sizes="240px"
                  className="w-48 md:w-60 h-auto -mb-12"
                />
              </div>

              <div>
                <span className="tag">{screen.tag}</span>
                <h3 className="display text-[32px] md:text-[48px] mt-6 mb-5">{screen.title}</h3>
                <p className="text-obsidian/70 text-lg leading-[1.55] mb-8">{screen.description}</p>
                <ul className="flex flex-col">
                  {screen.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-3 py-3 border-t-[1.5px] border-dotted border-obsidian">
                      <span className="dot" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
