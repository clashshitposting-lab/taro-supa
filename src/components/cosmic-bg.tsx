import { Moon } from "lucide-react";

interface Props {
  showMoon?: boolean;
  showAurora?: boolean;
}

export function CosmicBg({ showMoon = true, showAurora = true }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="nebula" />
      <div className="starfield" />
      {showAurora && (
        <div
          className="aurora-ring absolute"
          style={{ width: 700, height: 700, top: "-200px", right: "-200px", borderRadius: "50%" }}
        />
      )}
      {showMoon && (
        <div className="absolute right-12 top-20 hidden md:block">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, oklch(0.85 0.14 80 / 0.4), transparent 70%)" }}
            />
            <Moon className="relative h-16 w-16 text-gold opacity-80" strokeWidth={1} />
          </div>
        </div>
      )}
      {/* Constellation lines (subtle SVG) */}
      <svg
        className="absolute left-10 bottom-20 hidden opacity-30 md:block"
        width="220"
        height="160"
        viewBox="0 0 220 160"
        fill="none"
      >
        <g stroke="oklch(0.82 0.15 80 / 0.6)" strokeWidth="0.6">
          <line x1="10" y1="20" x2="60" y2="50" />
          <line x1="60" y1="50" x2="110" y2="30" />
          <line x1="110" y1="30" x2="160" y2="80" />
          <line x1="160" y1="80" x2="200" y2="60" />
          <line x1="60" y1="50" x2="80" y2="120" />
          <line x1="80" y1="120" x2="160" y2="80" />
        </g>
        <g fill="oklch(0.95 0.12 80)">
          {[
            [10, 20], [60, 50], [110, 30], [160, 80], [200, 60], [80, 120],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.4} />
          ))}
        </g>
      </svg>
    </div>
  );
}