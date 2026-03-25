"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import mu1 from "@/assets/images/screens/mu1.png";
import mu2 from "@/assets/images/screens/mu2.png";
import mu3 from "@/assets/images/screens/mu3.png";
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
      "Al abrir la app, tus miembros ven su posición en el ranking, la ocupación actual del gimnasio, promociones activas y su plan nutricional asignado. Información útil desde el primer segundo.",
    benefits: [
      "CrowdMeter en tiempo real",
      "Ranking de los más activos",
      "Promociones personalizadas",
    ],
    color: "#C5A356",
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
    color: "#3b82f6",
  },
  {
    image: mu3,
    tag: "Catálogo",
    title: "Muestra tus productos dentro de la app",
    description:
      "Tu gimnasio tiene su propio catálogo integrado. Tus miembros pueden consultar suplementos, bebidas y productos disponibles directamente desde la app — sin salir de la experiencia Fitzo.",
    benefits: [
      "Catálogo personalizable por el gimnasio",
      "Visibilidad de productos en todo momento",
      "Impulsa las ventas de tu tienda física",
    ],
    color: "#a855f7",
  },
  {
    image: mu4,
    tag: "Nutrición",
    title: "Plan de alimentación calculado para cada miembro",
    description:
      "Fitzo calcula automáticamente las calorías y macros según el perfil de cada miembro y les asigna un plan de comidas detallado con opciones para cada tiempo del día.",
    benefits: [
      "Cálculo automático de calorías y macros",
      "Dieta asignada por objetivo",
      "Menú diario con opciones de desayuno, almuerzo y cena",
    ],
    color: "#22c55e",
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
    color: "#FFD700",
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
    color: "#22c55e",
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
    color: "#3b82f6",
  },
];

function ScreenRow({ screen, index }: { screen: typeof screens[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isEven = index % 2 === 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-20`}
    >
      {/* Mockup */}
      <div
        className="flex-shrink-0 flex justify-center transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0px) scale(1)"
            : `translateY(50px) scale(0.92)`,
          transitionDelay: "0ms",
        }}
      >
        <div
          style={{
            filter: `drop-shadow(0 0 50px ${screen.color}35)`,
            transition: "filter 0.7s ease",
          }}
        >
          <Image
            src={screen.image}
            alt={screen.tag}
            width={240}
            className="w-48 md:w-60 h-auto"
          />
        </div>
      </div>

      {/* Text */}
      <div
        className="flex-1 text-center lg:text-left transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0px)" : `translateX(${isEven ? "40px" : "-40px"})`,
          transitionDelay: "150ms",
        }}
      >
        <span
          className="inline-block text-xs font-bold tracking-[4px] uppercase mb-4"
          style={{ color: screen.color }}
        >
          {screen.tag}
        </span>
        <h3 className="text-3xl md:text-4xl font-black text-white mb-5 leading-tight">
          {screen.title}
        </h3>
        <p className="text-white/50 text-lg leading-relaxed mb-8">
          {screen.description}
        </p>

        {/* Benefits */}
        <ul className="flex flex-col gap-3">
          {screen.benefits.map((b, i) => (
            <li
              key={b}
              className="flex items-center gap-3 justify-center lg:justify-start transition-all duration-500"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(20px)",
                transitionDelay: `${300 + i * 100}ms`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: screen.color }}
              />
              <span className="text-white/70 text-sm">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AppScreens() {
  return (
    <section className="relative py-24 md:py-32 section-padding overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
            La App
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Cada pantalla,{" "}
            <span className="gold-text">diseñada con propósito</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Una experiencia que tus miembros van a querer abrir todos los días.
          </p>
        </div>

        {/* Screens list */}
        <div className="flex flex-col gap-32">
          {screens.map((screen, i) => (
            <ScreenRow key={screen.tag} screen={screen} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
