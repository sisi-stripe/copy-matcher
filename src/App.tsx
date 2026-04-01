import { useState } from 'react'
import { fetchFigmaText } from './utils/figma'
import { compareText } from './utils/compare'
import type { DiffRow } from './utils/compare'
import { DiffView } from './components/DiffView'

const TOKEN_KEY = 'copy-matcher:figma-token'

export default function App() {
  const [yourCopy, setYourCopy] = useState('')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || import.meta.env.VITE_FIGMA_TOKEN || '')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<DiffRow[] | null>(null)

  function saveToken(val: string) {
    setToken(val)
    localStorage.setItem(TOKEN_KEY, val)
  }

  async function handleRun() {
    setError(null)
    setRows(null)

    if (!yourCopy.trim()) {
      setError('Paste your intended copy into the left panel first.')
      return
    }
    if (!figmaUrl.trim()) {
      setError('Enter a Figma frame link in the right panel.')
      return
    }
    if (!token.trim()) {
      setError('Enter your Figma API token in the top-right.')
      return
    }

    setLoading(true)
    try {
      const figmaTexts = await fetchFigmaText(figmaUrl.trim(), token.trim())
      const result = compareText(yourCopy, figmaTexts)
      setRows(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">Copy Matcher</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Intended ↔ Figma
          </span>
        </div>
        {/* Figma token */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Figma token
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="figd_..."
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 pr-8 w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              title={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? '🙈' : '👁'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* Two panels */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left: intended copy */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Intended Copy
            </label>
            <textarea
              value={yourCopy}
              onChange={(e) => setYourCopy(e.target.value)}
              placeholder={"Paste your intended copy here, one string per line.\n\nExample:\nSave changes\nCancel\nSubmit form"}
              className="flex-1 min-h-72 border border-gray-200 rounded-xl p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder:text-gray-400"
            />
          </div>

          {/* Right: Figma frame link */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Figma Frame
            </label>
            <div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col gap-3 min-h-72">
              <input
                type="url"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/... or /design/..."
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 leading-relaxed">
                Paste a Figma frame link. All text nodes in the frame will be extracted
                and compared against your intended copy on the left.
              </p>
              <div className="flex-1" />
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 leading-relaxed">
                <strong className="text-gray-500">Need a token?</strong> Go to Figma →
                Account Settings → Personal access tokens → Generate new token.
              </div>
            </div>
          </div>
        </div>

        {/* Run button */}
        <div className="flex justify-center mb-2">
          <button
            onClick={handleRun}
            disabled={loading}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            {loading ? 'Fetching Figma…' : 'Run'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {rows !== null && rows.filter((r) => r.status !== 'match').length === 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center">
            No discrepancies found — everything matches!
          </div>
        )}
        {rows !== null && rows.filter((r) => r.status !== 'match').length > 0 && (
          <DiffView rows={rows} />
        )}
      </main>
    </div>
  )
}
