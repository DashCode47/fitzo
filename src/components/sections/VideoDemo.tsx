"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";

export default function VideoDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || !iframeRef.current) return;

    const player = new Player(iframeRef.current);
    playerRef.current = player;

    player.ready().then(() => setIsReady(true));
    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));
    player.on("ended", () => setIsPlaying(false));

    return () => { player.destroy(); };
  }, [shouldLoad]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pause() : playerRef.current.play();
  };

  return (
    <section className="section">
      <div className="wrap">
        <div className="max-w-3xl mb-10 md:mb-14">
          <span className="tag">Demo</span>
          <h2 className="h2 mt-6">Míralo en acción</h2>
          <p className="text-lg text-obsidian/70 mt-6">
            Así se ve Fitzo desde adentro — la experiencia que vivirán tus miembros cada día.
          </p>
        </div>

        <div ref={containerRef} className="relative rounded-card overflow-hidden bg-obsidian w-full aspect-video">
          {shouldLoad && (
            <iframe
              ref={iframeRef}
              src="https://player.vimeo.com/video/1177014189?badge=0&autopause=0&player_id=0&app_id=58479&portrait=0&byline=0&title=0&controls=0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              title="Fitzo — Demo en video del software de gestión gamificado para gimnasios"
            />
          )}

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            className="absolute inset-0 w-full h-full flex items-center justify-center group"
          >
            <span
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isPlaying
                  ? "bg-obsidian/60 opacity-0 group-hover:opacity-100"
                  : "bg-ember"
              } ${isReady ? "" : "opacity-80"}`}
            >
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="3" width="4" height="18" rx="1" />
                  <rect x="15" y="3" width="4" height="18" rx="1" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#070607" style={{ marginLeft: 3 }}>
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
