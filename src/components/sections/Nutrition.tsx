import { WA_URL } from "@/lib/whatsapp";

const macros = [
  { label: "Proteína", value: 165, percent: 70, bar: "bg-ember" },
  { label: "Carbohidratos", value: 220, percent: 55, bar: "bg-plasma" },
  { label: "Grasas", value: 65, percent: 45, bar: "bg-obsidian" },
];

const goals = ["Ganancia muscular", "Pérdida de grasa", "Rendimiento deportivo", "Resistencia cardiovascular"];

const R = 40;
const C = 2 * Math.PI * R;

export default function Nutrition() {
  return (
    <section id="nutrition" className="section">
      <div className="wrap grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan mockup */}
        <div className="card flex items-center justify-center">
          <div className="w-full max-w-sm bg-chalk rounded-card p-7">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-obsidian/50 text-xs">Plan activo</p>
                <p className="display text-[26px]">Volumen limpio</p>
              </div>
              <span className="tag">Activo</span>
            </div>

            <div className="relative w-40 h-40 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e2df" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r={R} fill="none" stroke="#fc5000" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${C * 0.72} ${C}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="display text-[48px]">2,340</span>
                <span className="text-obsidian/50 text-xs">kcal / día</span>
              </div>
            </div>

            <div className="space-y-4">
              {macros.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-obsidian/70">{m.label}</span>
                    <span>{m.value}g</span>
                  </div>
                  <div className="h-2 rounded-full bg-pumice">
                    <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${m.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <span className="tag">Nutrición</span>
          <h2 className="h2 mt-6 mb-6">Tu dieta, calculada para ti</h2>
          <p className="text-obsidian/70 text-lg leading-[1.55] mb-8">
            Tus miembros ingresan su peso, altura, edad y objetivo. Fitzo calcula automáticamente sus calorías
            y macros, y les asigna un plan de alimentación personalizado — sin que tengas que contratar a un
            nutricionista.
          </p>

          <ul className="mb-10">
            {goals.map((g) => (
              <li key={g} className="flex items-center gap-3 py-3 border-t-[1.5px] border-dotted border-obsidian">
                <span className="dot" />
                {g}
              </li>
            ))}
          </ul>

          <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Activar nutrición en mi gimnasio
          </a>
        </div>
      </div>
    </section>
  );
}
