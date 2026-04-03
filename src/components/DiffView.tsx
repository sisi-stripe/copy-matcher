import type { DiffRow, MatchStatus } from '../utils/compare'

// --- Word-level diff ---

type Segment = { type: 'equal' | 'remove' | 'add'; text: string }

function wordDiff(a: string, b: string): { left: Segment[]; right: Segment[] } {
  const aW = a.split(/(\s+)/)
  const bW = b.split(/(\s+)/)
  const m = aW.length
  const n = bW.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0) as number[])

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = aW[i - 1] === bW[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const left: Segment[] = []
  const right: Segment[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aW[i - 1] === bW[j - 1]) {
      left.unshift({ type: 'equal', text: aW[i - 1] })
      right.unshift({ type: 'equal', text: bW[j - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      right.unshift({ type: 'add', text: bW[j - 1] })
      j--
    } else {
      left.unshift({ type: 'remove', text: aW[i - 1] })
      i--
    }
  }

  return { left, right }
}

function renderSegments(segments: Segment[], side: 'left' | 'right') {
  return segments.map((seg, i) => {
    if (seg.type === 'equal') {
      return <span key={i}>{seg.text}</span>
    }
    if (seg.type === 'remove' && side === 'left') {
      return (
        <span key={i} className="bg-red-200 text-red-900 rounded px-0.5">
          {seg.text}
        </span>
      )
    }
    if (seg.type === 'add' && side === 'right') {
      return (
        <span key={i} className="bg-green-200 text-green-900 rounded px-0.5">
          {seg.text}
        </span>
      )
    }
    return null
  })
}

// --- Component ---

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
    <div className="mt-6 flex flex-col gap-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-400">
          {matchCount} match{matchCount !== 1 ? 'es' : ''} hidden
        </span>
        <span className="text-gray-300">·</span>
        {counts.changed > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium border border-amber-200">
            <span className="font-mono font-bold">~</span> {counts.changed} changed
          </span>
        )}
        {counts['only-yours'] > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium border border-blue-200">
            <span className="font-mono font-bold">+</span> {counts['only-yours']} only intended
          </span>
        )}
        {counts['only-figma'] > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium border border-red-200">
            <span className="font-mono font-bold">−</span> {counts['only-figma']} only in Figma
          </span>
        )}
      </div>

      {/* Diff cards */}
      {discrepancies.map((row, i) => {
        if (row.status === 'changed') {
          const { left, right } = wordDiff(row.yours!, row.figma!)
          return (
            <div key={i} className="rounded-xl border border-amber-200 overflow-hidden text-sm font-mono">
              {/* Column headers */}
              <div className="grid grid-cols-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-600 font-sans font-semibold uppercase tracking-wide">
                <div className="px-4 py-1.5 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold leading-none">~</span>
                  Intended
                </div>
                <div className="px-4 py-1.5 border-l border-amber-200 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 5.5A3.5 3.5 0 018.5 2H12v7H8.5A3.5 3.5 0 015 5.5zM12 2h3.5a3.5 3.5 0 110 7H12V2zM12 12.5h-3.5a3.5 3.5 0 100 7H12v-7zM12 12.5H15.5a3.5 3.5 0 110 7H12v-7z" />
                  </svg>
                  Figma
                </div>
              </div>
              <div className="grid grid-cols-2 bg-white">
                <div className="px-4 py-3 leading-relaxed">{renderSegments(left, 'left')}</div>
                <div className="px-4 py-3 leading-relaxed border-l border-amber-100">{renderSegments(right, 'right')}</div>
              </div>
            </div>
          )
        }

        if (row.status === 'only-yours') {
          return (
            <div key={i} className="rounded-xl border border-blue-200 overflow-hidden text-sm font-mono">
              <div className="grid grid-cols-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-600 font-sans font-semibold uppercase tracking-wide">
                <div className="px-4 py-1.5 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold leading-none">+</span>
                  Intended only
                </div>
                <div className="px-4 py-1.5 border-l border-blue-200 text-blue-300">
                  Not in Figma
                </div>
              </div>
              <div className="grid grid-cols-2 bg-white">
                <div className="px-4 py-3 text-blue-900 bg-blue-50/40">{row.yours}</div>
                <div className="px-4 py-3 border-l border-blue-100 text-blue-300 italic text-xs flex items-center">missing</div>
              </div>
            </div>
          )
        }

        if (row.status === 'only-figma') {
          return (
            <div key={i} className="rounded-xl border border-red-200 overflow-hidden text-sm font-mono">
              <div className="grid grid-cols-2 bg-red-50 border-b border-red-200 text-xs text-red-600 font-sans font-semibold uppercase tracking-wide">
                <div className="px-4 py-1.5 flex items-center gap-1.5 text-red-300">
                  Not in intended
                </div>
                <div className="px-4 py-1.5 border-l border-red-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-xs font-bold leading-none">−</span>
                  Figma only
                </div>
              </div>
              <div className="grid grid-cols-2 bg-white">
                <div className="px-4 py-3 border-r border-red-100 text-red-300 italic text-xs flex items-center">missing</div>
                <div className="px-4 py-3 text-red-900 bg-red-50/40">{row.figma}</div>
              </div>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
