const steps = [
  {
    number: "01",
    title: "Cero esfuerzo inicial",
    description:
      "Tú nos das los datos básicos y nosotros configuramos todo: perfiles, notificaciones y personalización. No tienes que aprender a programar nada.",
  },
  {
    number: "02",
    title: "Toma el mando",
    description:
      "Carga tus rutinas en minutos. El panel es tan intuitivo que tu equipo lo dominará en la primera hora de uso.",
  },
  {
    number: "03",
    title: "Mira cómo crece",
    description:
      "Tus miembros compiten, progresan y regresan. Reciben notificaciones que los reactivan y tú ves los resultados mientras el sistema trabaja solo.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="wrap">
        <div className="max-w-3xl mb-10 md:mb-14">
          <span className="tag">Cómo Funciona</span>
          <h2 className="h2 mt-6">Empieza en 3 simples pasos</h2>
          <p className="text-lg text-obsidian/70 mt-6">Tu gimnasio operando con Fitzo desde el primer día.</p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <li key={step.number} className={i === 1 ? "card-ember" : "card"}>
              <span className={`display text-[96px] ${i === 1 ? "text-obsidian" : "text-ember"}`}>{step.number}</span>
              <h3 className="display text-[32px] mt-8 mb-4">{step.title}</h3>
              <p className={`leading-[1.55] ${i === 1 ? "" : "text-obsidian/70"}`}>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
