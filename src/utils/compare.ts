export type MatchStatus = 'match' | 'changed' | 'only-yours' | 'only-figma'

export interface DiffRow {
  status: MatchStatus
  yours: string | null
  figma: string | null
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

const FUZZY_THRESHOLD = 0.6

export function compareText(yoursCopy: string, figmaTexts: string[]): DiffRow[] {
  const yourLines = yoursCopy
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const figmaSet = new Set(figmaTexts.map((t) => t.toLowerCase()))
  const usedFigma = new Set<string>()
  const rows: DiffRow[] = []

  // First pass: exact matches
  const unmatchedYours: string[] = []
  for (const line of yourLines) {
    const lower = line.toLowerCase()
    if (figmaSet.has(lower)) {
      const original = figmaTexts.find((t) => t.toLowerCase() === lower) ?? line
      rows.push({ status: 'match', yours: line, figma: original })
      usedFigma.add(lower)
    } else {
      unmatchedYours.push(line)
    }
  }

  // Second pass: fuzzy match remaining
  const unmatchedFigma = figmaTexts.filter((t) => !usedFigma.has(t.toLowerCase()))
  const usedFigmaFuzzy = new Set<string>()
  const stillUnmatchedYours: string[] = []

  for (const line of unmatchedYours) {
    let bestScore = 0
    let bestFigma: string | null = null

    for (const ft of unmatchedFigma) {
      if (usedFigmaFuzzy.has(ft)) continue
      const score = similarity(line.toLowerCase(), ft.toLowerCase())
      if (score > bestScore) {
        bestScore = score
        bestFigma = ft
      }
    }

    if (bestScore >= FUZZY_THRESHOLD && bestFigma !== null) {
      rows.push({ status: 'changed', yours: line, figma: bestFigma })
      usedFigmaFuzzy.add(bestFigma)
    } else {
      stillUnmatchedYours.push(line)
    }
  }

  // Only in yours
  for (const line of stillUnmatchedYours) {
    rows.push({ status: 'only-yours', yours: line, figma: null })
  }

  // Only in Figma
  for (const ft of unmatchedFigma) {
    if (!usedFigmaFuzzy.has(ft)) {
      rows.push({ status: 'only-figma', yours: null, figma: ft })
    }
  }

  // Sort: matches first, changed, only-yours, only-figma
  const order: Record<MatchStatus, number> = {
    match: 0,
    changed: 1,
    'only-yours': 2,
    'only-figma': 3,
  }
  rows.sort((a, b) => order[a.status] - order[b.status])

  return rows
}
