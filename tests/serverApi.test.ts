import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { isSafeMediaUrl, validateArticleInput } from '../server/utils/articles'

test('isSafeMediaUrl allows http(s) and /uploads/ but rejects javascript:/data:', () => {
  assert.equal(isSafeMediaUrl('https://example.com/a.jpg'), true)
  assert.equal(isSafeMediaUrl('/uploads/123.png'), true)
  assert.equal(isSafeMediaUrl('javascript:alert(1)'), false)
  assert.equal(isSafeMediaUrl('data:text/html,<script>'), false)
})

test('validateArticleInput rejects oversized payloads and unsafe heroImage', () => {
  assert.throws(() => validateArticleInput({ title: 'a'.repeat(201), lead: '1234567890', content: 'x'.repeat(30) }))
  assert.throws(() => validateArticleInput({ title: 'a', heroImage: 'https://ok.com/a.jpg' }, true))
  assert.throws(() => validateArticleInput({ heroImage: 'javascript:alert(1)' }, true))
  assert.doesNotThrow(() => validateArticleInput({ title: 'عنوان صالح للمقال' }, true))
})

class CookieClient {
  private cookies = new Map<string, string>()

  constructor(private baseUrl: string) {}

  async request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const reqHeaders: Record<string, string> = { ...headers }
    if (this.cookies.size > 0) {
      reqHeaders.cookie = Array.from(this.cookies.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ')
    }
    let rawBody: BodyInit | undefined
    if (body instanceof Uint8Array || typeof body === 'string') {
      rawBody = body as BodyInit
    } else if (body !== undefined) {
      reqHeaders['content-type'] = 'application/json'
      rawBody = JSON.stringify(body)
    }

    const res = await fetch(`${this.baseUrl}${path}`, { method, headers: reqHeaders, body: rawBody })
    const setCookies = res.headers.getSetCookie?.() ?? []
    for (const sc of setCookies) {
      const pair = sc.split(';')[0]
      const eqIdx = pair.indexOf('=')
      if (eqIdx > 0) {
        this.cookies.set(pair.slice(0, eqIdx).trim(), pair.slice(eqIdx + 1).trim())
      }
    }
    const text = await res.text()
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {
      json = text
    }
    return { status: res.status, data: json }
  }
}

test('end-to-end auth permissions, upload cleanup, and validation against built server', async () => {
  const outputEntry = resolve('.output/server/index.mjs')
  assert.ok(existsSync(outputEntry), 'Run npm run build before running integration tests')

  const dbPath = resolve('prisma/dev.db').replace(/\\/g, '/')
  const port = 3466
  const baseUrl = `http://127.0.0.1:${port}`

  const proc = spawn('node', [outputEntry], {
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      DATABASE_URL: `file:${dbPath}`,
      SESSION_SECRET: 'shousar-integration-test-secret-key-at-least-32-chars'
    },
    stdio: 'pipe'
  })

  const prisma = new PrismaClient()
  const stamp = Date.now()
  const userA = `test_a_${stamp}`
  const userB = `test_b_${stamp}`

  try {
    let ready = false
    for (let i = 0; i < 30; i++) {
      try {
        const r = await fetch(`${baseUrl}/api/categories`)
        if (r.status === 200) {
          ready = true
          break
        }
      } catch {
        await new Promise((r) => setTimeout(r, 300))
      }
    }
    assert.equal(ready, true, 'Server failed to start')

    const clientA = new CookieClient(baseUrl)
    const clientB = new CookieClient(baseUrl)

    const catsRes = await clientA.request('GET', '/api/categories')
    const catId = catsRes.data.categories[0].id

    const regA = await clientA.request('POST', '/api/auth/register', {
      name: 'كاتب أول',
      username: userA,
      email: `${userA}@shousar.lb`,
      password: 'Password123!'
    })
    assert.equal(regA.status, 200)

    const regB = await clientB.request('POST', '/api/auth/register', {
      name: 'كاتب ثاني',
      username: userB,
      email: `${userB}@shousar.lb`,
      password: 'Password123!'
    })
    assert.equal(regB.status, 200)

    // Upload a valid 1x1 PNG
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    )
    const boundary = '----ShouSarTestBoundary'
    const head = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="tiny.png"\r\nContent-Type: image/png\r\n\r\n`
    )
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
    const uploadRes = await clientA.request('POST', '/api/upload', Buffer.concat([head, pngBytes, tail]), {
      'content-type': `multipart/form-data; boundary=${boundary}`
    })
    assert.equal(uploadRes.status, 200)
    const uploadedPath = uploadRes.data.url as string
    assert.ok(uploadedPath.startsWith('/uploads/'))
    const diskFile = join(process.cwd(), 'public', uploadedPath.replace(/^\//, ''))
    assert.equal(existsSync(diskFile), true)

    // Reject unsafe heroImage
    const badImgRes = await clientA.request('POST', '/api/articles', {
      title: 'عنوان مقال تجريبي كامل',
      lead: 'مقدمة صالحة للمقال التجريبي المطلوب',
      content: 'نص طويل بما يكفي لاجتياز التحقق الأولي للمقال التجريبي.',
      categoryId: catId,
      heroImage: 'javascript:alert(1)'
    })
    assert.equal(badImgRes.status, 400)

    // Create valid article with uploaded image
    const createRes = await clientA.request('POST', '/api/articles', {
      title: 'مقال تجريبي للاختبار المتكامل',
      lead: 'مقدمة صالحة للمقال التجريبي المطلوب اختبار صلاحياته',
      content: 'نص طويل بما يكفي لاجتياز التحقق الأولي للمقال التجريبي.',
      categoryId: catId,
      heroImage: uploadedPath
    })
    assert.equal(createRes.status, 200)
    const slug = createRes.data.article.slug as string

    // User B cannot PATCH or DELETE User A's article
    const patchB = await clientB.request('PATCH', `/api/articles/${encodeURIComponent(slug)}`, {
      title: 'تعديل غير مصرح به'
    })
    assert.equal(patchB.status, 403)

    const delB = await clientB.request('DELETE', `/api/articles/${encodeURIComponent(slug)}`)
    assert.equal(delB.status, 403)

    // User A cannot PATCH invalid short title or oversized comment
    const shortPatch = await clientA.request('PATCH', `/api/articles/${encodeURIComponent(slug)}`, { title: 'a' })
    assert.equal(shortPatch.status, 400)

    const longComment = await clientA.request('POST', `/api/articles/${encodeURIComponent(slug)}/comments`, {
      body: 'x'.repeat(2005)
    })
    assert.equal(longComment.status, 400)

    // User A posts valid comment; User B cannot delete it (403)
    const cmtRes = await clientA.request('POST', `/api/articles/${encodeURIComponent(slug)}/comments`, {
      body: 'تعليق صالح'
    })
    assert.equal(cmtRes.status, 200)
    const cmtId = cmtRes.data.comment.id as string

    const delCmtB = await clientB.request('DELETE', `/api/comments/${cmtId}`)
    assert.equal(delCmtB.status, 403)

    // Deleting User A's article cleans up the unused uploaded file
    const delA = await clientA.request('DELETE', `/api/articles/${encodeURIComponent(slug)}`)
    assert.equal(delA.status, 200)
    assert.equal(existsSync(diskFile), false)

    // Verify breaking=1 query filter
    const breakingRes = await clientA.request('GET', '/api/articles?breaking=1&limit=5')
    assert.equal(breakingRes.status, 200)
    assert.ok(Array.isArray(breakingRes.data.articles))
  } finally {
    await prisma.user.deleteMany({ where: { username: { in: [userA, userB] } } })
    await prisma.$disconnect()
    proc.kill()
  }
})
