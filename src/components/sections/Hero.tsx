import Image from "next/image";
import Script from "next/script";
import mu1 from "@/assets/images/screens/mu1.png";
import { WA_URL, WhatsAppIcon } from "@/lib/whatsapp";

export default function Hero() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://fitzo.one/#organization",
        name: "Fitzo",
        url: "https://fitzo.one",
        logo: "https://fitzo.one/icon.png",
        description:
          "Software gamificado de gestión para gimnasios con check-in por geofencing, rankings, planes nutricionales y retención de miembros.",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+593-97-872-4619",
          contactType: "sales",
          areaServed: "EC",
          availableLanguage: ["Spanish"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://fitzo.one/#website",
        url: "https://fitzo.one",
        name: "Fitzo",
        publisher: { "@id": "https://fitzo.one/#organization" },
        inLanguage: "es-EC",
      },
      {
        "@type": "SoftwareApplication",
        name: "Fitzo",
        applicationCategory: "HealthApplication",
        operatingSystem: "iOS, Android",
        description:
          "App gamificada de gestión de gimnasio con rankings, nutrición y seguimiento de asistencia por geolocalización.",
        publisher: { "@id": "https://fitzo.one/#organization" },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <section className="pt-24 md:pt-28 pb-10 md:pb-20">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="wrap">
        {/* Signature display wordmark */}
        <p aria-hidden="true" className="display text-[clamp(96px,24vw,189px)] text-center select-none">
          Fitzo
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="card flex flex-col justify-between gap-10">
            <div>
              <span className="tag">La app que gamifica tu gimnasio</span>
              <h1 className="display text-[40px] md:text-[64px] mt-6">
                La solución definitiva para dueños de gimnasios
              </h1>
              <p className="text-lg leading-[1.55] mt-6">
                Transforma a tus miembros en fanáticos y duplica tu retención.
              </p>
              <p className="text-obsidian/60 leading-[1.55] mt-2">
                Gamifica el entrenamiento, automatiza la operación y toma el control total de tu negocio — sin complicaciones.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <WhatsAppIcon />
                Activar mi gimnasio gratis
              </a>
              <a href="#features" className="btn-secondary">
                Ver características
              </a>
            </div>
          </div>

          <div className="halftone rounded-card min-h-[420px] overflow-hidden flex items-end justify-center pt-10">
            <Image
              src={mu1}
              alt="App Fitzo — pantalla de inicio con ranking y puntos"
              priority
              sizes="(min-width: 768px) 300px, 240px"
              className="w-60 md:w-[300px] h-auto -mb-16"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[
            { value: "Push", label: "Notificaciones automáticas" },
            { value: "Sin contratos", label: "Cancela cuando quieras" },
            { value: "24/7", label: "Soporte incluido" },
          ].map((stat) => (
            <div key={stat.label} className="card-ember">
              <p className="text-sm">{stat.label}</p>
              <p className="display text-[56px] md:text-[64px] leading-[1.1] mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
