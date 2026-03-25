"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";

export default function VideoDemo() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;

    const player = new Player(iframeRef.current);
    playerRef.current = player;

    player.ready().then(() => setIsReady(true));
    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));
    player.on("ended", () => setIsPlaying(false));

    return () => { player.destroy(); };
  }, []);

  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pause() : playerRef.current.play();
  };

  return (
    <section className="relative py-24 md:py-32 section-padding overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(197,163,86,0.04) 50%, transparent 100%)",
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-gold text-xs font-bold tracking-[4px] uppercase mb-4">
            Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Míralo en{" "}
            <span className="gold-text">acción</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Así se ve Fitzo desde adentro — la experiencia que vivirán tus miembros cada día.
          </p>
        </div>

        {/* Video wrapper */}
        <div className="flex justify-center">
          <div
            className="relative rounded-2xl overflow-hidden w-full"
            style={{
              aspectRatio: "16/9",
              border: "1px solid rgba(197,163,86,0.25)",
              boxShadow: "0 0 80px rgba(197,163,86,0.15), 0 0 0 8px rgba(255,255,255,0.03)",
            }}
          >
            <iframe
              ref={iframeRef}
              src="https://player.vimeo.com/video/1177014189?badge=0&autopause=0&player_id=0&app_id=58479&portrait=0&byline=0&title=0&controls=0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              className="absolute inset-0 w-full h-full"
              title="Fitzo — Demo"
            />

            {/* Custom play/pause overlay */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
              className="absolute inset-0 w-full h-full flex items-center justify-center group"
              style={{ background: "transparent" }}
            >
              {/* Show big play button when paused, subtle pause on hover when playing */}
              <div
                className="flex items-center justify-center rounded-full transition-all duration-300"
                style={{
                  width: 64,
                  height: 64,
                  background: isPlaying
                    ? "rgba(0,0,0,0)"
                    : "rgba(197,163,86,0.95)",
                  boxShadow: isPlaying
                    ? "none"
                    : "0 0 40px rgba(197,163,86,0.5)",
                  opacity: isPlaying ? 0 : 1,
                  transform: isPlaying ? "scale(0.8)" : "scale(1)",
                }}
              >
                {/* Play icon */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="black"
                  style={{ marginLeft: 3 }}
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>

              {/* Pause indicator on hover while playing */}
              {isReady && (
                <div
                  className="absolute flex items-center justify-center rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  style={{
                    width: 56,
                    height: 56,
                    background: "rgba(0,0,0,0.5)",
                    display: isPlaying ? undefined : "none",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <rect x="5" y="3" width="4" height="18" rx="1" />
                    <rect x="15" y="3" width="4" height="18" rx="1" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
