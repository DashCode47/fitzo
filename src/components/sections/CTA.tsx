import { WA_URL, WhatsAppIcon } from "@/lib/whatsapp";

export default function CTA() {
  return (
    <section id="cta" className="section">
      <div className="wrap">
        <div className="card-dark md:p-20 text-center flex flex-col items-center">
          <span className="tag">1 mes gratis · sin tarjeta · sin compromiso</span>

          <h2 className="display text-[56px] md:text-[96px] mt-8 mb-8">
            Tu gimnasio, listo
            <br />
            <span className="text-ember">en 24 horas</span>
          </h2>

          <p className="text-chalk/70 text-lg leading-[1.55] mb-10 max-w-xl">
            Sin contratos, sin tarjeta de crédito. Nosotros configuramos todo — tú solo dinos el nombre de tu
            gimnasio y en un día ya estás operando.
          </p>

          <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="btn-primary text-lg px-8 py-4 hover:bg-chalk hover:text-obsidian">
            <WhatsAppIcon size={20} />
            Quiero activar mi gimnasio
          </a>

          <p className="text-chalk/50 text-sm mt-8">
            App para miembros disponible en iOS y Android · Configuración incluida
          </p>
        </div>
      </div>
    </section>
  );
}
