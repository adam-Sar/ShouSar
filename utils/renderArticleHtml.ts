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

function buildQuoteHtml(quote: string, author?: string | null): string {
  const cleanQuote = escapeHtml(quote.trim().replace(/^["«]|["»]$/g, ''))
  const cite = author?.trim()
    ? `<cite class="quote-author-cite">— ${escapeHtml(author.trim().replace(/^[—-]\s*/, ''))}</cite>`
    : ''
  return `<blockquote class="editorial-pull-quote">"${cleanQuote}"${cite}</blockquote>`
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
    if (block === '[quote]' && pullQuote) {
      htmlParts.push(buildQuoteHtml(pullQuote, pullQuoteAuthor))
      quoteInserted = true
      continue
    }

    if (block.startsWith('> ')) {
      const lines = block.split('\n').map((l) => l.trim())
      const quoteLines: string[] = []
      let inlineAuthor = ''

      for (const line of lines) {
        if (line.startsWith('> ')) {
          quoteLines.push(line.slice(2).trim())
        } else if (line.startsWith('—') || line.startsWith('--')) {
          inlineAuthor = line
        } else {
          quoteLines.push(line)
        }
      }

      if (quoteLines.length) {
        htmlParts.push(buildQuoteHtml(quoteLines.join(' '), inlineAuthor || null))
        quoteInserted = true
      }
      continue
    }

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
      htmlParts.push(buildQuoteHtml(pullQuote, pullQuoteAuthor))
    }
  }

  if (pullQuote && !quoteInserted) {
    htmlParts.push(buildQuoteHtml(pullQuote, pullQuoteAuthor))
  }

  return htmlParts.join('\n')
}
