"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Nosotros lo configuramos",
    description:
      "Tú solo nos das los datos de tu gimnasio y nosotros nos encargamos de todo — cuenta, perfil, geofencing y configuración inicial. Listo para usar desde el día uno.",
    icon: "🏢",
  },
  {
    number: "02",
    title: "Personaliza la Experiencia",
    description:
      "Configura tus planes nutricionales, genera los QRs de actividades y activa el ranking. La plataforma se adapta a la dinámica de tu negocio.",
    icon: "⚙️",
  },
  {
    number: "03",
    title: "Tus Miembros lo Usan",
    description:
      "Comparte la app con tus miembros y listo. Ellos se registran, hacen check-in automático y compiten. Tú ves los resultados desde el panel.",
    icon: "🚀",
  },
];

export default function HowItWorks() {
  const [visible, setVisible] = useState<boolean[]>([false, false, false]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        // Animate steps one by one with 350ms delay each
        steps.forEach((_, i) => {
          setTimeout(() => {
            setVisible((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, i * 350);
        });

        observer.disconnect();
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-24 md:py-32 section-padding overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #C5A356 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
            Cómo Funciona
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Empieza en{" "}
            <span className="gold-text">3 simples pasos</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto text-lg">
            Tu gimnasio operando con Fitzo desde el primer día.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-16 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(197,163,86,0.3) 20%, rgba(197,163,86,0.3) 80%, transparent)",
            }}
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center transition-all duration-700"
              style={{
                opacity: visible[i] ? 1 : 0,
                transform: visible[i] ? "translateY(0px)" : "translateY(40px)",
              }}
            >
              {/* Step number circle */}
              <div className="relative mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black relative z-10 transition-all duration-700"
                  style={{
                    background: "linear-gradient(135deg, #C5A356 0%, #FFD700 100%)",
                    boxShadow: visible[i]
                      ? "0 0 40px rgba(197,163,86,0.6)"
                      : "0 0 0px rgba(197,163,86,0)",
                    transform: visible[i] ? "scale(1)" : "scale(0.7)",
                  }}
                >
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-dark-card border border-gold/50 flex items-center justify-center">
                  <span className="text-gold text-[10px] font-black">{i + 1}</span>
                </div>
              </div>

              {/* Big number watermark */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-8xl font-black text-white/[0.03] pointer-events-none select-none -z-10">
                {step.number}
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed max-w-[260px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
