import { WA_URL } from "@/lib/whatsapp";

const customizations = [
  "Colores de marca",
  "Logo del gimnasio",
  "Nombre de la app",
  "Nombre del ranking",
  "Recompensas propias",
  "Banners y promociones",
];

function PhoneMock({ name, sub, dark, label }: { name: string; sub: string; dark: boolean; label: string }) {
  const bar = dark ? "bg-chalk/20" : "bg-obsidian/15";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`w-40 md:w-44 rounded-[32px] p-4 flex flex-col gap-3 ${dark ? "bg-obsidian text-chalk" : "bg-chalk"}`}>
        <span className={`text-[10px] ${dark ? "text-chalk/50" : "text-obsidian/50"}`}>9:41</span>
        <div className={`rounded-[20px] p-3 text-center ${dark ? "bg-ember text-obsidian" : "bg-plasma text-chalk"}`}>
          <p className="display text-lg">{name}</p>
          <p className="text-[10px]">{sub}</p>
        </div>
        {[16, 12].map((w) => (
          <div key={w} className={`rounded-2xl p-3 ${dark ? "bg-chalk/10" : "bg-pumice"}`}>
            <div className={`h-1.5 rounded-full mb-1.5 ${dark ? "bg-ember" : "bg-plasma"}`} style={{ width: w * 4 }} />
            <div className={`h-1.5 rounded-full w-10 ${bar}`} />
          </div>
        ))}
      </div>
      <span className="tag">{label}</span>
    </div>
  );
}

export default function Customization() {
  return (
    <section className="section">
      <div className="wrap grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <span className="tag">White Label</span>
          <h2 className="h2 mt-6 mb-6">Tu gimnasio, tu identidad</h2>
          <p className="text-obsidian/70 text-lg leading-[1.55] mb-8">
            Fitzo se adapta completamente a la imagen de tu negocio. Tus miembros verán{" "}
            <span className="text-obsidian">tu marca</span> — no la nuestra. Personaliza colores, logo,
            nombre del ranking y mucho más desde el panel de administración.
          </p>

          <div className="flex flex-wrap gap-2 mb-10">
            {customizations.map((label) => (
              <span key={label} className="rounded-full bg-pumice px-4 py-2 text-sm">
                {label}
              </span>
            ))}
          </div>

          <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Ver demo personalizada
          </a>
        </div>

        <div className="card flex items-center justify-center gap-4 md:gap-8 py-12">
          <PhoneMock name="Fitzo" sub="Tu Gimnasio" dark label="Default" />
          <span className="display text-[36px] text-ember" aria-hidden="true">→</span>
          <PhoneMock name="Powerhouse" sub="Elite Fitness Club" dark={false} label="Tu marca" />
        </div>
      </div>
    </section>
  );
}
