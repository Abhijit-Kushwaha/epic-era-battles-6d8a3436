import { ReactNode } from "react";

interface NightVisionProps {
  active: boolean;
  children: ReactNode;
}

const NightVision = ({ active, children }: NightVisionProps) => {
  return (
    <div className="relative w-full h-full">
      {/* Filtered content wrapper */}
      <div
        className="w-full h-full"
        style={{
          filter: active
            ? "hue-rotate(90deg) saturate(3) brightness(1.5) contrast(1.4)"
            : "none",
          transition: "filter 0.3s ease",
        }}
      >
        {children}
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: active
            ? "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)"
            : "none",
          opacity: active ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Grain/noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          opacity: active ? 0.08 : 0,
          transition: "opacity 0.3s ease",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
          mixBlendMode: "overlay",
          animation: active ? "nvGrain 0.1s steps(2) infinite" : "none",
        }}
      />

      <style>{`
        @keyframes nvGrain {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-2px, 1px); }
          100% { transform: translate(1px, -2px); }
        }
      `}</style>
    </div>
  );
};

export default NightVision;
