import test from 'node:test'
import assert from 'node:assert/strict'
import { renderArticleBody } from '../utils/renderArticleHtml'

test('escapes raw HTML tags to prevent XSS', () => {
  const html = renderArticleBody('Hello <script>alert(1)</script> **bold**\n\n## Sub <img src=x>')
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(html.includes('<strong>bold</strong>'))
  assert.ok(html.includes('<h2>Sub &lt;img src=x&gt;</h2>'))
})

test('blocks unsafe markdown image schemes like javascript:', () => {
  const safe = renderArticleBody('![photo](/uploads/test.png)')
  const unsafe = renderArticleBody('![bad](javascript:alert(1))')
  assert.ok(safe.includes('<img src="/uploads/test.png"'))
  assert.ok(!unsafe.includes('<img'))
})

test('places [quote] and inline > quote blocks accurately', () => {
  const customSpot = renderArticleBody('P1\n\n[quote]\n\nP2\n\nP3', 'Lead quote', 'Author')
  assert.ok(customSpot.indexOf('editorial-pull-quote') < customSpot.indexOf('P2'))

  const inlineQuote = renderArticleBody('P1\n\n> Inline text\n— Writer\n\nP2')
  assert.ok(inlineQuote.includes('Inline text'))
  assert.ok(inlineQuote.includes('Writer'))

  const singlePara = renderArticleBody('Only one paragraph', 'Fallback quote', null)
  assert.ok(singlePara.includes('Fallback quote'))
})
