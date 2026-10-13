/**
 * The illustration set: 3px ink line, flat palette fills, pill-bodied
 * figures with no faces. Ported from the design canvas.
 *
 * Pass `label` for meaningful images; omit it for decoration beside text
 * that already says the same thing.
 */
import React from "react";

type Props = { label?: string; className?: string };

function Frame({ label, className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 280 180"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {children}
    </svg>
  );
}

/** People waiting in line at a counter */
export function Queue({ label = "People waiting in line at a counter", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <rect x="200" y="84" width="70" height="86" rx="8" fill="#C03C48" />
      <rect x="204" y="18" width="62" height="38" rx="8" fill="#1D1517" />
      <path d="M235 56v28" />
      <rect x="146" y="82" width="42" height="88" rx="21" fill="#F4B63F" /><circle cx="167" cy="64" r="16" fill="#8C5A3C" />
      <rect x="94" y="90" width="42" height="80" rx="21" fill="#FFFDF8" /><circle cx="115" cy="72" r="15" fill="#C68B5E" />
      <rect x="42" y="96" width="40" height="74" rx="20" fill="#1F4E9E" /><circle cx="62" cy="80" r="15" fill="#6E4430" />
      <rect x="180" y="112" width="20" height="14" rx="3" fill="#FFFDF8" />
      </g>
      <text x="235" y="44" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="800" fontSize="18" fill="#F4B63F">0142</text>
    </Frame>
  );
}

/** A token dispenser with one ticket ready to take */
export function TakeANumber({ label = "A token dispenser with one ticket ready to take", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <rect x="130" y="104" width="20" height="66" fill="#1D1517" />
      <ellipse cx="140" cy="170" rx="36" ry="6" fill="#1D1517" />
      <rect x="92" y="28" width="96" height="80" rx="12" fill="#C03C48" />
      <rect x="112" y="52" width="56" height="8" rx="4" fill="#1D1517" />
      <g transform="rotate(-10 140 86)"><rect x="114" y="58" width="52" height="40" rx="5" fill="#FFFDF8" /><path d="M114 86h52" strokeDasharray="4 4" strokeWidth="2" /></g>
      <path d="M206 60l14-6M210 80h16M206 100l14 6" stroke="#F4B63F" strokeWidth="4" />
      </g>
      <text x="138" y="80" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="800" fontSize="13" fill="#C03C48" transform="rotate(-10 140 86)">Q-0001</text>
    </Frame>
  );
}

/** A person cheering next to a You're up stamp */
export function YoureUp({ label = "A person cheering next to a You're up stamp", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <path d="M98 96 78 52M140 96l20-44" strokeWidth="9" />
      <rect x="94" y="82" width="50" height="88" rx="25" fill="#F4B63F" />
      <circle cx="119" cy="62" r="17" fill="#A9714C" />
      <path d="M103 58c2-16 30-18 32 0" fill="#1D1517" />
      <g transform="rotate(-10 212 116)"><rect x="164" y="96" width="96" height="40" rx="8" fill="#DDF1E4" stroke="#17663F" strokeWidth="4" /></g>
      <rect x="40" y="40" width="10" height="6" fill="#C03C48" transform="rotate(30 45 43)" />
      <rect x="184" y="34" width="10" height="6" fill="#1F4E9E" transform="rotate(-25 189 37)" />
      <rect x="60" y="20" width="10" height="6" fill="#F4B63F" transform="rotate(10 65 23)" />
      <rect x="214" y="58" width="10" height="6" fill="#C03C48" transform="rotate(50 219 61)" />
      </g>
      <text x="212" y="122" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="800" fontSize="17" fill="#17663F" transform="rotate(-10 212 116)">You're up!</text>
    </Frame>
  );
}

/** A person walking from a closed counter towards an open one */
export function MoreCounters({ label = "A person walking from a closed counter towards an open one", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <rect x="16" y="90" width="64" height="80" rx="8" fill="#ECE6DE" />
      <path d="M16 106h64M16 120h64M16 134h64M16 148h64" strokeWidth="2" />
      <rect x="204" y="90" width="64" height="80" rx="8" fill="#C03C48" />
      <rect x="212" y="54" width="48" height="26" rx="6" fill="#FFFDF8" />
      <path d="M236 80v10" />
      <g transform="rotate(8 140 120)">
      <path d="M128 168l-10-30M152 168l8-30" strokeWidth="9" />
      <rect x="116" y="76" width="46" height="70" rx="23" fill="#1F4E9E" />
      <circle cx="139" cy="58" r="16" fill="#C68B5E" />
      </g>
      <path d="M96 120h12M90 132h14" stroke="#5E5254" strokeWidth="2.5" />
      </g>
      <path d="M228 67l5 5 9-10" fill="none" stroke="#17663F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

/** A résumé under a magnifying glass with a score badge */
export function ResumeCheck({ label = "A résumé under a magnifying glass with a score badge", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <rect x="74" y="16" width="112" height="146" rx="8" fill="#FFFDF8" />
      <circle cx="102" cy="44" r="12" fill="#F3EADA" />
      <path d="M122 40h46M122 50h30M90 72h80M90 86h70M90 100h80M90 114h50" strokeWidth="5" stroke="#E2D6C4" />
      <circle cx="182" cy="112" r="28" fill="#E3ECFA" fillOpacity=".85" />
      <path d="M202 132l26 26" strokeWidth="10" />
      <circle cx="86" cy="148" r="24" fill="#C03C48" />
      </g>
      <text x="86" y="156" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="800" fontSize="20" fill="#FFFFFF">78</text>
    </Frame>
  );
}

/** A signpost with three arrows and a person looking up at it */
export function WhichWay({ label = "A signpost with three arrows and a person looking up at it", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <rect x="164" y="20" width="12" height="150" fill="#5E5254" />
      <path d="M176 28h70l14 13-14 13h-70z" fill="#F4B63F" />
      <path d="M164 62h-68l-14 13 14 13h68z" fill="#1F4E9E" />
      <path d="M176 96h56l14 13-14 13h-56z" fill="#C03C48" />
      <rect x="54" y="104" width="40" height="66" rx="20" fill="#FFFDF8" />
      <circle cx="74" cy="88" r="14" fill="#8C5A3C" />
      <path d="M84 80l10-6" strokeWidth="2.5" />
      </g>
    </Frame>
  );
}

/** A counter with its shutter down and a clock sign */
export function ClosedCounter({ label = "A counter with its shutter down and a clock sign", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <path d="M44 34h192l-12 22H56z" fill="#C03C48" />
      <rect x="56" y="56" width="168" height="114" fill="#F3EADA" />
      <path d="M56 74h168M56 92h168M56 110h168M56 128h168M56 146h168" strokeWidth="2" />
      <path d="M120 56l20 24 20-24" strokeWidth="2" />
      <circle cx="140" cy="110" r="26" fill="#F4B63F" />
      <path d="M140 96v14l10 6" />
      </g>
    </Frame>
  );
}

/** A ticket blowing away in the wind and a person searching for it */
export function LostTicket({ label = "A ticket blowing away in the wind and a person searching for it", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <rect x="60" y="96" width="44" height="74" rx="22" fill="#C03C48" />
      <circle cx="82" cy="80" r="15" fill="#6E4430" />
      <path d="M94 74h14" strokeWidth="5" />
      <g transform="rotate(18 196 60)"><rect x="160" y="40" width="74" height="40" rx="6" fill="#FFFDF8" /><path d="M182 40v40" strokeDasharray="4 4" strokeWidth="2" /></g>
      <path d="M126 40c14-6 22 4 34-2M120 60c14-4 22 4 30 0M130 80c10-2 14 2 22 0" stroke="#5E5254" strokeWidth="2.5" fill="none" />
      </g>
      <text x="210" y="66" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="800" fontSize="15" fill="#C03C48" transform="rotate(18 196 60)">404</text>
    </Frame>
  );
}

/** A gold ticket jumping over a line of people to the front */
export function GoldTicket({ label = "A gold ticket jumping over a line of people to the front", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <rect x="226" y="104" width="44" height="66" rx="8" fill="#C03C48" />
      <rect x="40" y="120" width="30" height="50" rx="15" fill="#ECE6DE" /><circle cx="55" cy="108" r="11" fill="#ECE6DE" />
      <rect x="90" y="120" width="30" height="50" rx="15" fill="#ECE6DE" /><circle cx="105" cy="108" r="11" fill="#ECE6DE" />
      <rect x="140" y="120" width="30" height="50" rx="15" fill="#ECE6DE" /><circle cx="155" cy="108" r="11" fill="#ECE6DE" />
      <path d="M30 110C70 10 170 0 214 92" fill="none" strokeDasharray="6 7" strokeWidth="2.5" />
      <g transform="rotate(14 190 50)"><rect x="160" y="32" width="64" height="38" rx="6" fill="#F4B63F" /><path d="M180 32v38" strokeDasharray="4 4" strokeWidth="2" /></g>
      </g>
    </Frame>
  );
}

/** A receipt with a round Paid stamp */
export function Receipt({ label = "A receipt with a round Paid stamp", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <path d="M90 14h100v138l-10-8-10 8-10-8-10 8-10-8-10 8-10-8-10 8-10-8-10 8z" fill="#FFFDF8" />
      <path d="M106 36h68M106 52h48M106 76h68M106 92h40" stroke="#E2D6C4" strokeWidth="5" />
      <circle cx="170" cy="112" r="30" fill="#DDF1E4" fillOpacity=".9" stroke="#17663F" strokeWidth="4" />
      </g>
      <text x="170" y="119" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="800" fontSize="18" fill="#17663F" transform="rotate(-12 170 112)">PAID</text>
    </Frame>
  );
}

/** A funnel with too many filters and nothing coming out */
export function TooNarrow({ label = "A funnel with too many filters and nothing coming out", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <path d="M80 50h120l-44 56v40l-32 14v-54z" fill="#FFFDF8" />
      <rect x="88" y="16" width="40" height="20" rx="5" fill="#C03C48" />
      <rect x="136" y="10" width="44" height="20" rx="5" fill="#1F4E9E" />
      <rect x="112" y="30" width="42" height="16" rx="5" fill="#F4B63F" />
      <circle cx="140" cy="166" r="3" fill="#5E5254" stroke="none" />
      </g>
    </Frame>
  );
}

/** An empty shop counter with a striped awning and a bell */
export function OpenCounter({ label = "An empty shop counter with a striped awning and a bell", className }: Props) {
  return (
    <Frame label={label} className={className}>
      <g stroke="#1D1517" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 170h264" />
      <path d="M40 30h200v24H40z" fill="#FFFDF8" />
      <path d="M40 30h40v24H40zM120 30h40v24h-40zM200 30h40v24h-40z" fill="#C03C48" />
      <path d="M40 54c0 12 20 12 20 0 0 12 20 12 20 0 0 12 20 12 20 0 0 12 20 12 20 0 0 12 20 12 20 0 0 12 20 12 20 0 0 12 20 12 20 0 0 12 20 12 20 0 0 12 20 12 20 0 0 12 20 12 20 0" fill="#FFFDF8" />
      <rect x="50" y="110" width="180" height="60" rx="8" fill="#F4B63F" />
      <path d="M44 110h192" />
      <path d="M128 106a12 12 0 0 1 24 0z" fill="#1D1517" /><path d="M140 94v-4" />
      </g>
    </Frame>
  );
}
