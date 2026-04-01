import type { DiffRow, MatchStatus } from '../utils/compare'

const statusConfig: Record<
  Exclude<MatchStatus, 'match'>,
  { icon: string; rowClass: string; iconClass: string }
> = {
  changed: {
    icon: '~',
    rowClass: 'bg-yellow-50 border-yellow-100',
    iconClass: 'text-yellow-600',
  },
  'only-yours': {
    icon: '+',
    rowClass: 'bg-blue-50 border-blue-100',
    iconClass: 'text-blue-600',
  },
  'only-figma': {
    icon: '−',
    rowClass: 'bg-red-50 border-red-100',
    iconClass: 'text-red-600',
  },
}

interface DiffViewProps {
  rows: DiffRow[]
}

export function DiffView({ rows }: DiffViewProps) {
  const discrepancies = rows.filter((r) => r.status !== 'match')
  const matchCount = rows.length - discrepancies.length

  const counts = {
    changed: discrepancies.filter((r) => r.status === 'changed').length,
    'only-yours': discrepancies.filter((r) => r.status === 'only-yours').length,
    'only-figma': discrepancies.filter((r) => r.status === 'only-figma').length,
  }

  return (
    <div className="mt-6">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
        <span className="text-gray-500 font-medium">
          {discrepancies.length} discrepanc{discrepancies.length !== 1 ? 'ies' : 'y'}
          <span className="text-gray-400 font-normal ml-1">
            · {matchCount} match{matchCount !== 1 ? 'es' : ''} hidden
          </span>
        </span>
        <div className="flex gap-2">
          {counts.changed > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium text-xs">
              ~ {counts.changed} changed
            </span>
          )}
          {counts['only-yours'] > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">
              + {counts['only-yours']} only intended
            </span>
          )}
          {counts['only-figma'] > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium text-xs">
              − {counts['only-figma']} only in Figma
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
              <th className="w-8 py-2 px-3"></th>
              <th className="py-2 px-4 text-left font-semibold">Intended Copy</th>
              <th className="py-2 px-4 text-left font-semibold">Figma Copy</th>
            </tr>
          </thead>
          <tbody>
            {discrepancies.map((row, i) => {
              const cfg = statusConfig[row.status as Exclude<MatchStatus, 'match'>]
              return (
                <tr key={i} className={`border-b last:border-0 ${cfg.rowClass}`}>
                  <td className={`py-2.5 px-3 text-center font-bold ${cfg.iconClass}`}>
                    {cfg.icon}
                  </td>
                  <td className="py-2.5 px-4 font-mono">
                    {row.yours ?? <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="py-2.5 px-4 font-mono">
                    {row.figma ?? <span className="text-gray-400 italic">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
