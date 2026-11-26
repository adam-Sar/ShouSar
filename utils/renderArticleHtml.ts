function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatInline(text: string): string {
  const escaped = escapeHtml(text)
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function isSafeUrl(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('https://') || url.startsWith('http://')
}

export function renderArticleBody(
  content: string,
  pullQuote?: string | null,
  pullQuoteAuthor?: string | null
): string {
  const blocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)

  const htmlParts: string[] = []
  let paragraphCount = 0
  let quoteInserted = false

  for (const block of blocks) {
    if (block.startsWith('## ')) {
      htmlParts.push(`<h2>${formatInline(block.slice(3).trim())}</h2>`)
      continue
    }

    const imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch && isSafeUrl(imgMatch[2].trim())) {
      const alt = escapeHtml(imgMatch[1].trim() || 'صورة داخل المقال')
      const src = escapeHtml(imgMatch[2].trim())
      htmlParts.push(
        `<figure class="article-inline-media"><img src="${src}" alt="${alt}" />${
          imgMatch[1].trim() ? `<figcaption class="media-caption">${alt}</figcaption>` : ''
        }</figure>`
      )
      continue
    }

    const lines = block.split('\n').map((l) => l.trim())
    if (lines.every((l) => l.startsWith('- '))) {
      const items = lines.map((l) => `<li>${formatInline(l.slice(2).trim())}</li>`).join('')
      htmlParts.push(`<ul class="article-inline-list">${items}</ul>`)
      continue
    }

    htmlParts.push(`<p>${formatInline(block).replace(/\n/g, '<br />')}</p>`)
    paragraphCount += 1

    if (paragraphCount === 2 && pullQuote && !quoteInserted) {
      quoteInserted = true
      const cite = pullQuoteAuthor
        ? `<cite class="quote-author-cite">— ${escapeHtml(pullQuoteAuthor)}</cite>`
        : ''
      htmlParts.push(
        `<blockquote class="editorial-pull-quote">"${escapeHtml(pullQuote)}"${cite}</blockquote>`
      )
    }
  }

  return htmlParts.join('\n')
}
