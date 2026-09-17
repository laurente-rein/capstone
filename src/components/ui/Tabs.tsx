import { cn } from '../../lib/utils'

export interface TabItem {
  key: string
  label: string
  count?: number
}

export function Tabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-neutral-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative px-4 py-2.5 text-sm font-medium transition-colors',
            active === tab.key ? 'text-brand-700' : 'text-neutral-500 hover:text-neutral-700',
          )}
        >
          <span className="flex items-center gap-1.5">
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  active === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-neutral-100 text-neutral-500',
                )}
              >
                {tab.count}
              </span>
            )}
          </span>
          {active === tab.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-700" />}
        </button>
      ))}
    </div>
  )
}
