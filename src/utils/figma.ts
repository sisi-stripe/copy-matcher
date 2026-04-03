export function parseFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export function parseFigmaNodeId(url: string): string | null {
  // node-id can appear as ?node-id=123%3A456 or ?node-id=123:456
  const match = url.match(/node-id=([^&]+)/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

interface FigmaNode {
  type: string
  characters?: string
  children?: FigmaNode[]
}

function extractTextNodes(node: FigmaNode, results: string[]): void {
  if (node.type === 'TEXT' && node.characters) {
    const trimmed = node.characters.trim()
    if (trimmed.length > 0) {
      results.push(trimmed)
    }
  }
  if (node.children) {
    for (const child of node.children) {
      extractTextNodes(child, results)
    }
  }
}

export async function fetchFigmaText(url: string, token: string): Promise<string[]> {
  const fileKey = parseFigmaFileKey(url)
  if (!fileKey) {
    throw new Error('Invalid Figma URL. Expected a URL containing /file/ or /design/.')
  }

  const nodeId = parseFigmaNodeId(url)

  // If a specific node-id is present, fetch only that node's subtree
  const apiUrl = nodeId
    ? `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`
    : `https://api.figma.com/v1/files/${fileKey}`

  const response = await fetch(apiUrl, {
    headers: { 'X-Figma-Token': token },
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        'Figma returned 403. If you generated a new token, make sure it has the "File content" (read) scope enabled — Figma now requires explicit scopes when creating tokens.'
      )
    }
    if (response.status === 404) {
      throw new Error('Figma file not found. Check the URL.')
    }
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as {
    document?: FigmaNode
    nodes?: Record<string, { document: FigmaNode }>
  }

  const texts: string[] = []

  if (data.nodes) {
    // Node-specific response
    for (const entry of Object.values(data.nodes)) {
      extractTextNodes(entry.document, texts)
    }
  } else if (data.document) {
    // Full file response
    extractTextNodes(data.document, texts)
  }

  // Deduplicate while preserving order
  return [...new Set(texts)]
}
