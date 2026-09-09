import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const desktopRoot = join(__dirname, '..')
const frontendRoot = join(desktopRoot, '..', 'frontend')
const distDir = join(frontendRoot, 'dist')
const rendererDir = join(desktopRoot, 'renderer')

const apiBase = process.env.VITE_API_BASE || 'http://localhost:5080/api/v1'

console.log(`[desktop] Building frontend for Electron (VITE_API_BASE=${apiBase})…`)

const build = spawnSync('npm', ['run', 'build'], {
  cwd: frontendRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    VITE_DESKTOP: '1',
    VITE_API_BASE: apiBase,
  },
})

if (build.status !== 0) {
  console.error('[desktop] frontend build failed', build.error || `exit ${build.status}`)
  process.exit(build.status ?? 1)
}

if (!existsSync(distDir)) {
  console.error('[desktop] frontend/dist not found after build')
  process.exit(1)
}

if (existsSync(rendererDir)) rmSync(rendererDir, { recursive: true, force: true })
mkdirSync(rendererDir, { recursive: true })
cpSync(distDir, rendererDir, { recursive: true })
console.log(`[desktop] Copied UI → ${rendererDir}`)
