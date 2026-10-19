const pillars = [
  {
    number: "01",
    headline: "Retención que se paga sola",
    body: "La gamificación crea una adicción saludable. Cuando tus miembros ven que bajan en el ranking, regresan sin que tú tengas que llamarlos. Menos deserción significa más ingresos recurrentes.",
  },
  {
    number: "02",
    headline: "Notificaciones que retienen",
    body: "El sistema detecta miembros inactivos y les envía notificaciones push personalizadas en el momento justo. Recordatorios de rutina, promociones exclusivas y mensajes motivacionales que los hacen regresar sin que tú tengas que llamar a nadie.",
  },
  {
    number: "03",
    headline: "Más valor por cada membresía",
    body: "Rutinas, planes nutricionales, rangos de fuerza y seguimiento de progreso incluidos en la app. Tus miembros reciben más por lo que pagan, sin que tengas que contratar más personal.",
  },
];

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="wrap">
        <div className="max-w-3xl mb-10 md:mb-14">
          <span className="tag">Por qué funciona</span>
          <h2 className="h2 mt-6">Retención que no depende de ti</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <div key={p.number} className="card flex flex-col">
              <span className="display text-[80px] text-ember">{p.number}</span>
              <h3 className="display text-[32px] mt-8 mb-4">{p.headline}</h3>
              <p className="text-obsidian/70 leading-[1.55]">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
