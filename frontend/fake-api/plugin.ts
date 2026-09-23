import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { handleFakeApi } from './handlers.ts'

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim()
      if (!raw) {
        resolve(undefined)
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(undefined)
      }
    })
    req.on('error', () => resolve(undefined))
  })
}

async function middleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url ?? ''
  if (!url.startsWith('/api/')) {
    next()
    return
  }

  const method = (req.method ?? 'GET').toUpperCase()
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req)
  const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined
  const result = handleFakeApi(method, url, body, authHeader)

  res.statusCode = result.status
  if (result.status === 204) {
    res.end()
    return
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(result.body ?? null))
}

export function fakeApiPlugin(): Plugin {
  return {
    name: 'fatto-fake-api',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(middleware)
      server.httpServer?.once('listening', () => {
        server.config.logger.info('  Fake API: /api/v1 (sem Docker, sem banco)')
        server.config.logger.info('  Login:    ju@fattovirtual.com / Admin123!')
        server.config.logger.info('  Assistente: marina@fattovirtual.com / Admin123!')
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
