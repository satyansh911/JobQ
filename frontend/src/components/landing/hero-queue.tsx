/**
 * Landing hero: four people queueing at a counter showing "Now 0142", with
 * the next ticket (0143) floating above. Ported from the design canvas.
 */
export function HeroQueue({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 420"
      className={className}
      role="img"
      aria-label="Four people waiting in line at a counter, each holding a numbered ticket"
    >
      <rect x="8" y="370" width="544" height="10" rx="5" fill="#1D1517" />
      <rect x="402" y="200" width="140" height="172" rx="10" fill="#C03C48" stroke="#1D1517" strokeWidth="3" />
      <rect x="392" y="188" width="160" height="22" rx="8" fill="#FFFDF8" stroke="#1D1517" strokeWidth="3" />
      <rect x="414" y="64" width="116" height="78" rx="10" fill="#1D1517" />
      <text x="472" y="94" textAnchor="middle" style={{ fontFamily: "var(--font-sans)" }} fontSize="14" fontWeight="700" fill="#F4B63F">NOW</text>
      <text x="472" y="128" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontSize="34" fontWeight="800" fill="#FBF5EA">0142</text>
      <path d="M472 142v46" stroke="#1D1517" strokeWidth="3" />
      <circle cx="472" cy="290" r="26" fill="#FBF5EA" stroke="#1D1517" strokeWidth="3" />
      <text x="472" y="299" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontSize="24" fontWeight="800" fill="#C03C48">Q</text>
      <rect x="300" y="210" width="76" height="160" rx="34" fill="#F4B63F" stroke="#1D1517" strokeWidth="3" />
      <circle cx="338" cy="176" r="30" fill="#8C5A3C" stroke="#1D1517" strokeWidth="3" />
      <path d="M310 170c4-22 52-26 58 0" fill="#1D1517" />
      <rect x="364" y="244" width="40" height="26" rx="4" fill="#FFFDF8" stroke="#1D1517" strokeWidth="3" transform="rotate(-12 384 257)" />
      <rect x="204" y="224" width="74" height="146" rx="34" fill="#FFFDF8" stroke="#1D1517" strokeWidth="3" />
      <circle cx="241" cy="192" r="28" fill="#C68B5E" stroke="#1D1517" strokeWidth="3" />
      <path d="M213 190c-2-30 54-36 56-4 0 0-8-12-28-12s-28 16-28 16z" fill="#1D1517" />
      <path d="M216 198c-8 18-6 40 0 54" stroke="#1D1517" strokeWidth="10" strokeLinecap="round" />
      <rect x="258" y="270" width="34" height="22" rx="4" fill="#C03C48" stroke="#1D1517" strokeWidth="3" />
      <rect x="112" y="236" width="72" height="134" rx="34" fill="#C03C48" stroke="#1D1517" strokeWidth="3" />
      <circle cx="148" cy="204" r="27" fill="#6E4430" stroke="#1D1517" strokeWidth="3" />
      <path d="M122 196c6-20 46-22 52 0" fill="#1D1517" />
      <rect x="128" y="200" width="18" height="8" rx="4" fill="none" stroke="#1D1517" strokeWidth="3" />
      <rect x="152" y="200" width="18" height="8" rx="4" fill="none" stroke="#1D1517" strokeWidth="3" />
      <rect x="170" y="282" width="32" height="22" rx="4" fill="#FFFDF8" stroke="#1D1517" strokeWidth="3" />
      <rect x="24" y="248" width="70" height="122" rx="33" fill="#1F4E9E" stroke="#1D1517" strokeWidth="3" />
      <circle cx="59" cy="216" r="26" fill="#A9714C" stroke="#1D1517" strokeWidth="3" />
      <path d="M34 210c0-24 50-26 50 0l-6-6c-10 4-28 4-38 0z" fill="#1D1517" />
      <rect x="80" y="262" width="20" height="32" rx="4" fill="#1D1517" />
      <g transform="rotate(-8 150 90)">
      <rect x="70" y="56" width="168" height="72" rx="10" fill="#FFFDF8" stroke="#1D1517" strokeWidth="3" />
      <circle cx="70" cy="92" r="11" fill="#FBF5EA" stroke="#1D1517" strokeWidth="3" />
      <circle cx="238" cy="92" r="11" fill="#FBF5EA" stroke="#1D1517" strokeWidth="3" />
      <rect x="58" y="78" width="12" height="28" fill="#FBF5EA" />
      <rect x="238" y="78" width="12" height="28" fill="#FBF5EA" />
      <path d="M120 62v60" stroke="#1D1517" strokeWidth="2.5" strokeDasharray="5 5" />
      <text x="96" y="99" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontSize="22" fontWeight="800" fill="#C03C48">Q</text>
      <text x="178" y="102" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontSize="28" fontWeight="800" fill="#1D1517">0143</text>
      </g>
    </svg>
  );
}
