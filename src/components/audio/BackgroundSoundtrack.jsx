import { useEffect, useRef } from "react";

export default function BackgroundSoundtrack({ volume = 0.18 }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));

    const tryPlay = async () => {
      try {
        await audio.play();
      } catch {
        // Autoplay blocked by browser; user interaction required.
      }
    };

    tryPlay();
  }, [volume]);

  return (
    <div aria-hidden="false" style={{ position: "fixed", left: 8, bottom: 8, zIndex: 9999 }}>
      <audio
        ref={audioRef}
        src="/audio/quantum-cloud-ambient-loop.ogg"
        loop
        controls
        preload="auto"
      >
        <source src="/audio/quantum-cloud-ambient-loop.ogg" type="audio/ogg" />
        <source src="/audio/quantum-cloud-ambient-loop.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
