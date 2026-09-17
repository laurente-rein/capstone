export interface DonutSegment {
  label: string
  value: number
  colorClass: string // Tailwind bg-* class, reused for the legend swatch
  hex: string // matching hex for the SVG stroke
}

/** A status-breakdown donut. Never relies on color alone — every segment has a
 * visible legend label + count, per accessibility guidance for status charts. */
export function DonutChart({ segments, centerLabel }: { segments: DonutSegment[]; centerLabel: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const r = 45
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 120 120" className="size-40 -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {total > 0 &&
            segments
              .filter((s) => s.value > 0)
              .map((seg) => {
                const length = (seg.value / total) * circumference
                const dasharray = `${length} ${circumference - length}`
                const dashoffset = -offset
                offset += length
                return (
                  <circle
                    key={seg.label}
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke={seg.hex}
                    strokeWidth="16"
                    strokeDasharray={dasharray}
                    strokeDashoffset={dashoffset}
                  />
                )
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-neutral-900">{total}</p>
          <p className="text-[11px] text-neutral-400">{centerLabel}</p>
        </div>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-neutral-600">
              <span className={`size-2.5 rounded-full ${seg.colorClass}`} />
              {seg.label}
            </span>
            <span className="font-semibold text-neutral-800">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
