"use client";

import { useId } from "react";

export type Artwork = {
  /** Tipo de esfera: GMT (bisel 24 h y aguja extra), crono (subesferas + taquímetro) o clásico */
  style?: "gmt" | "chrono" | "classic" | "diver";
  dial?: string;
  bezel?: [string, string];
  accent?: string;
};

export const DEFAULT_ART: Required<Artwork> = { style: "classic", dial: "#121212", bezel: ["#151515", "#151515"], accent: "#C6A664" };

export function parseArtwork(json?: string | null): Required<Artwork> {
  try {
    const v = json ? JSON.parse(json) : {};
    return { ...DEFAULT_ART, ...(v && typeof v === "object" ? v : {}) };
  } catch {
    return DEFAULT_ART;
  }
}

const CX = 200;
const CY = 270;

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r2(CX + r * Math.cos(a)), r2(CY + r * Math.sin(a))] as const;
}

// Redondeo para que servidor y navegador generen exactamente el mismo SVG
function r2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Ilustración vectorial de estudio de un reloj. Sirve como imagen elegante
 * mientras no haya fotografía real del producto.
 */
export default function WatchRender({ art, className = "", title }: { art?: Artwork; className?: string; title?: string }) {
  const a = { ...DEFAULT_ART, ...art };
  const id = useId().replace(/:/g, "");
  const light = isLight(a.dial);
  const ink = light ? "#1a1a1a" : "#ECE7DA";
  const hands = light ? "#1a1a1a" : "#F3EFE4";

  // Hora congelada a las 10:09, la pose clásica de relojería
  const hourDeg = 10 * 30 + 9 * 0.5;
  const minDeg = 9 * 6;
  const secDeg = 36 * 6;
  const gmtDeg = (15 / 24) * 360;

  return (
    <svg viewBox="0 0 400 540" className={className} role="img" aria-label={title ?? "Reloj"}>
      <defs>
        <linearGradient id={`steel${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FAFAF8" />
          <stop offset=".35" stopColor="#B9B8B3" />
          <stop offset=".55" stopColor="#ECEBE7" />
          <stop offset=".8" stopColor="#8E8D88" />
          <stop offset="1" stopColor="#D6D5D0" />
        </linearGradient>
        <linearGradient id={`link${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8F8E89" />
          <stop offset=".2" stopColor="#E9E8E4" />
          <stop offset=".5" stopColor="#BDBCB7" />
          <stop offset=".8" stopColor="#EFEEEA" />
          <stop offset="1" stopColor="#8F8E89" />
        </linearGradient>
        <radialGradient id={`dial${id}`} cx=".45" cy=".35" r=".75">
          <stop offset="0" stopColor={shade(a.dial, 0.18)} />
          <stop offset=".7" stopColor={a.dial} />
          <stop offset="1" stopColor={shade(a.dial, -0.35)} />
        </radialGradient>
        <linearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`shadow${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`bezelClip${id}`}>
          <circle cx={CX} cy={CY} r="146" />
        </clipPath>
      </defs>

      {/* sombra */}
      <ellipse cx={CX} cy="522" rx="120" ry="12" fill={`url(#shadow${id})`} />

      {/* brazalete */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`t${i}`}>
          <rect x={CX - 62 + i * 1.5} y={92 - i * 30} width={124 - i * 3} height="28" rx="4" fill={`url(#link${id})`} stroke="#77766f" strokeWidth=".6" />
          <rect x={CX - 18} y={92 - i * 30} width="36" height="28" fill="#fff" opacity=".18" />
          <rect x={CX - 62 + i * 1.5} y={420 + i * 30} width={124 - i * 3} height="28" rx="4" fill={`url(#link${id})`} stroke="#77766f" strokeWidth=".6" />
          <rect x={CX - 18} y={420 + i * 30} width="36" height="28" fill="#fff" opacity=".18" />
        </g>
      ))}

      {/* asas y caja */}
      <path d={`M${CX - 78} 120 h156 l-6 40 h-144 Z`} fill={`url(#steel${id})`} />
      <path d={`M${CX - 78} 420 h156 l-6 -40 h-144 Z`} fill={`url(#steel${id})`} />
      <rect x="345" y={CY - 15} width="20" height="30" rx="5" fill={`url(#steel${id})`} stroke="#8a8984" strokeWidth=".8" />
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={i} x1="349" x2="361" y1={r2(CY - 11 + i * 3.7)} y2={r2(CY - 11 + i * 3.7)} stroke="#7d7c77" strokeWidth=".7" />
      ))}
      <circle cx={CX} cy={CY} r="160" fill={`url(#steel${id})`} />
      <circle cx={CX} cy={CY} r="160" fill="none" stroke="#7d7c77" strokeWidth=".8" />

      {/* bisel */}
      <g clipPath={`url(#bezelClip${id})`}>
        {a.style === "gmt" ? (
          <>
            <path d={arc(146, -90, 90)} fill={a.bezel[0]} />
            <path d={arc(146, 90, 270)} fill={a.bezel[1]} />
          </>
        ) : (
          <circle cx={CX} cy={CY} r="146" fill={a.bezel[0]} />
        )}
      </g>
      <circle cx={CX} cy={CY} r="146" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="1" />
      <BezelMarks style={a.style} />
      <circle cx={CX} cy={CY} r="118" fill={`url(#steel${id})`} />

      {/* esfera */}
      <circle cx={CX} cy={CY} r="113" fill={`url(#dial${id})`} />

      {/* minutero */}
      {Array.from({ length: 60 }).map((_, i) => {
        const [x1, y1] = polar(110, i * 6);
        const [x2, y2] = polar(i % 5 ? 105 : 102, i * 6);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeOpacity=".7" strokeWidth={i % 5 ? 0.8 : 1.4} />;
      })}

      {/* índices aplicados */}
      {Array.from({ length: 12 }).map((_, i) => {
        if (a.style === "chrono" && (i === 3 || i === 6 || i === 9)) return null;
        if (i === 3 && a.style !== "chrono") return null; // ventana de fecha
        const deg = i * 30;
        const [x, y] = polar(i === 0 ? 86 : 88, deg);
        const big = i === 0;
        return (
          <g key={i} transform={`rotate(${deg} ${x} ${y})`}>
            <rect x={x - (big ? 5 : 3.2)} y={y - 12} width={big ? 10 : 6.4} height="24" rx="1.2" fill="#E8E6E0" stroke="#8b8a85" strokeWidth=".6" />
            <rect x={x - (big ? 2.5 : 1.6)} y={y - 9} width={big ? 5 : 3.2} height="18" rx=".8" fill={light ? "#2b2b2b" : "#EFE9D6"} />
          </g>
        );
      })}

      {/* fecha */}
      {a.style !== "chrono" && (
        <g>
          <rect x={CX + 66} y={CY - 10} width="24" height="20" rx="2" fill="#fbfaf6" stroke="#8b8a85" strokeWidth="1.2" />
          <text x={CX + 78} y={CY + 5} textAnchor="middle" fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600" fill="#1a1a1a">
            10
          </text>
        </g>
      )}

      {/* subesferas de cronógrafo */}
      {a.style === "chrono" &&
        [
          [CX - 48, CY],
          [CX + 48, CY],
          [CX, CY + 50],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="24" fill={light ? "#1c1c1c" : "#f1ede2"} />
            <circle cx={x} cy={y} r="24" fill="none" stroke="#8b8a85" strokeWidth="1" />
            {Array.from({ length: 12 }).map((_, j) => {
              const ang = ((j * 30 - 90) * Math.PI) / 180;
              return <line key={j} x1={r2(x + 18 * Math.cos(ang))} y1={r2(y + 18 * Math.sin(ang))} x2={r2(x + 22 * Math.cos(ang))} y2={r2(y + 22 * Math.sin(ang))} stroke={light ? "#eee" : "#222"} strokeWidth=".8" />;
            })}
            <line x1={x} y1={y} x2={r2(x + 15 * Math.cos(((i * 110 - 60) * Math.PI) / 180))} y2={r2(y + 15 * Math.sin(((i * 110 - 60) * Math.PI) / 180))} stroke={a.accent} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        ))}

      {/* textos de esfera */}
      <text x={CX} y={CY - 52} textAnchor="middle" fontSize="11" letterSpacing="3" fontFamily="Inter, sans-serif" fontWeight="600" fill={ink}>
        IWATCHWORKS
      </text>
      <text x={CX} y={CY + (a.style === "chrono" ? 92 : 58)} textAnchor="middle" fontSize="7" letterSpacing="2.5" fontFamily="Inter, sans-serif" fill={a.accent}>
        {a.style === "gmt" ? "AUTOMATIC · GMT" : a.style === "chrono" ? "CHRONOGRAPH" : a.style === "diver" ? "DIVER'S 200M" : "AUTOMATIC"}
      </text>

      {/* agujas */}
      {a.style === "gmt" && (
        <g transform={`rotate(${gmtDeg} ${CX} ${CY})`}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - 96} stroke={a.accent} strokeWidth="2" />
          <path d={`M${CX - 7} ${CY - 92} L${CX} ${CY - 108} L${CX + 7} ${CY - 92} Z`} fill={a.accent} />
        </g>
      )}
      <g transform={`rotate(${hourDeg} ${CX} ${CY})`}>
        <path d={`M${CX - 5} ${CY + 14} L${CX - 6} ${CY - 50} L${CX} ${CY - 64} L${CX + 6} ${CY - 50} L${CX + 5} ${CY + 14} Z`} fill={hands} stroke="#7d7c77" strokeWidth=".6" />
        <path d={`M${CX - 2.5} ${CY - 18} L${CX - 3} ${CY - 50} L${CX} ${CY - 57} L${CX + 3} ${CY - 50} L${CX + 2.5} ${CY - 18} Z`} fill="#f6f1e3" />
      </g>
      <g transform={`rotate(${minDeg} ${CX} ${CY})`}>
        <path d={`M${CX - 4} ${CY + 18} L${CX - 4.5} ${CY - 86} L${CX} ${CY - 100} L${CX + 4.5} ${CY - 86} L${CX + 4} ${CY + 18} Z`} fill={hands} stroke="#7d7c77" strokeWidth=".6" />
        <path d={`M${CX - 2} ${CY - 25} L${CX - 2.2} ${CY - 86} L${CX} ${CY - 93} L${CX + 2.2} ${CY - 86} L${CX + 2} ${CY - 25} Z`} fill="#f6f1e3" />
      </g>
      <g transform={`rotate(${secDeg} ${CX} ${CY})`}>
        <line x1={CX} y1={CY + 26} x2={CX} y2={CY - 106} stroke={a.accent} strokeWidth="1.3" />
        <circle cx={CX} cy={CY - 70} r="3.4" fill="none" stroke={a.accent} strokeWidth="1.2" />
      </g>
      <circle cx={CX} cy={CY} r="5" fill={a.accent} />
      <circle cx={CX} cy={CY} r="2" fill="#2a2a2a" />

      {/* cristal */}
      <circle cx={CX} cy={CY} r="113" fill={`url(#glass${id})`} />
    </svg>
  );
}

function BezelMarks({ style }: { style: string }) {
  if (style === "gmt") {
    return (
      <g>
        {Array.from({ length: 24 }).map((_, i) => {
          const deg = i * 15;
          if (i % 2) {
            const [x1, y1] = polar(140, deg);
            const [x2, y2] = polar(134, deg);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E9E4D6" strokeWidth="1.6" />;
          }
          const [x, y] = polar(131, deg);
          return i === 0 ? (
            <path key={i} d={`M${x - 7} ${y - 6} L${x + 7} ${y - 6} L${x} ${y + 6} Z`} fill="#E9E4D6" />
          ) : (
            <text key={i} x={x} y={y + 4} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="#E9E4D6" transform={`rotate(${deg} ${x} ${y})`}>
              {i}
            </text>
          );
        })}
      </g>
    );
  }
  if (style === "chrono") {
    return (
      <g>
        {[70, 80, 90, 100, 120, 150, 200, 300, 500].map((v) => {
          const deg = r2((3600 / v) * 6);
          const [x, y] = polar(131, deg);
          return (
            <text key={v} x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontFamily="Inter, sans-serif" fill="#E9E4D6" transform={`rotate(${deg} ${x} ${y})`}>
              {v}
            </text>
          );
        })}
        <text x={CX} y={CY - 128} textAnchor="middle" fontSize="7" letterSpacing="2" fontFamily="Inter, sans-serif" fill="#E9E4D6">
          TACHYMETER
        </text>
      </g>
    );
  }
  return (
    <g>
      {Array.from({ length: 60 }).map((_, i) => {
        const deg = i * 6;
        if (i % 10 === 0 && i) {
          const [x, y] = polar(131, deg);
          return (
            <text key={i} x={x} y={y + 4} textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="#E9E4D6" transform={`rotate(${deg} ${x} ${y})`}>
              {i}
            </text>
          );
        }
        if (i === 0) {
          const [x, y] = polar(131, 0);
          return <circle key={i} cx={x} cy={y} r="5" fill="#E9E4D6" />;
        }
        const [x1, y1] = polar(141, deg);
        const [x2, y2] = polar(i % 5 ? 137 : 130, deg);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E9E4D6" strokeWidth={i % 5 ? 0.8 : 2.2} />;
      })}
    </g>
  );
}

function arc(r: number, from: number, to: number) {
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, to);
  return `M${CX} ${CY} L${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function isLight(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)))));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
