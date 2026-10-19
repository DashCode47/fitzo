const podium = [
  { rank: 2, name: "Carlos M.", points: 4820, streak: 18, block: "bg-limestone text-obsidian h-32" },
  { rank: 1, name: "María V.", points: 6540, streak: 31, block: "bg-ember text-obsidian h-44" },
  { rank: 3, name: "Andrés L.", points: 3960, streak: 12, block: "bg-pumice text-obsidian h-24" },
];

const howToEarn = [
  { action: "Visita al gimnasio", points: "+50 pts" },
  { action: "Escaneo QR de rutina", points: "+30 pts" },
  { action: "Racha de 7 días", points: "+200 pts" },
  { action: "Referido activo", points: "+500 pts" },
];

export default function Rankings() {
  return (
    <section id="rankings" className="section">
      <div className="wrap">
        <div className="card-dark md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="tag">Fitzo Legends</span>
            <h2 className="h2 mt-6 mb-6">
              Compite por el <span className="text-ember">trono del gimnasio</span>
            </h2>
            <p className="text-chalk/70 text-lg leading-[1.55] mb-10">
              Cada mes se resetean los puntos y todos tienen una oportunidad de llegar al podio. ¿Tienes lo
              que se necesita para ser una <span className="text-chalk">Fitzo Legend</span>?
            </p>

            <p className="text-chalk/50 text-sm mb-2">Cómo ganar puntos</p>
            <ul>
              {howToEarn.map((item) => (
                <li
                  key={item.action}
                  className="flex items-center justify-between py-4 border-t-[1.5px] border-dotted border-chalk/40"
                >
                  <span>{item.action}</span>
                  <span className="display text-[26px] text-ember">{item.points}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-chalk/50 text-sm mb-8">Ranking mensual</p>

            <div className="flex items-end justify-center gap-3 w-full mb-8">
              {podium.map((m) => (
                <div key={m.rank} className="flex flex-col items-center gap-3 flex-1 max-w-[120px]">
                  <div className="w-14 h-14 rounded-full border-[1.5px] border-chalk flex items-center justify-center display text-2xl">
                    {m.name[0]}
                  </div>
                  <div className="text-center">
                    <p className="text-sm">{m.name}</p>
                    <p className="text-ember text-sm">{m.points.toLocaleString("es-EC")} pts</p>
                    <p className="text-chalk/50 text-xs">🔥 {m.streak} días</p>
                  </div>
                  <div className={`w-full rounded-t-[20px] flex items-start justify-center pt-3 ${m.block}`}>
                    <span className="display text-[48px]">{m.rank}</span>
                  </div>
                </div>
              ))}
            </div>

            <span className="tag text-sm px-4 py-2">⚡ Modo elite activo</span>
          </div>
        </div>
      </div>
    </section>
  );
}
