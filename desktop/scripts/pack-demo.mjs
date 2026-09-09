import { cpSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const desktopRoot = join(__dirname, '..')
const demoSrc = join(desktopRoot, 'demo')
const releaseDemo = join(desktopRoot, 'release', 'demo')

if (existsSync(releaseDemo)) rmSync(releaseDemo, { recursive: true, force: true })
mkdirSync(releaseDemo, { recursive: true })

for (const name of [
  'Start-FattoDemo.ps1',
  'Stop-FattoDemo.ps1',
  'Iniciar-Demonstracao.bat',
  'Parar-Demonstracao.bat',
  'README.md',
]) {
  const from = join(demoSrc, name)
  if (!existsSync(from)) {
    console.warn(`[pack-demo] missing ${name}`)
    continue
  }
  cpSync(from, join(releaseDemo, name))
}

writeFileSync(
  join(releaseDemo, 'LEIA-ME.txt'),
  `FattoVirtual — demonstração desktop + API
==========================================

1) Instale e inicie o Docker Desktop.
2) Mantenha este repositório completo (a API é buildada do código).
3) Duplo clique em Iniciar-Demonstracao.bat
   - sobe Postgres + API em http://localhost:5080
   - abre o .exe em ..\\ (portable ou win-unpacked)

Login: ju@fattovirtual.com / Admin123!
URL da API no app (padrão): http://localhost:5080/api/v1

Parar containers: Parar-Demonstracao.bat

Opcional: copie FattoVirtual-*-portable.exe para a pasta release\\
antes de zipar o kit de demo.
`,
  'utf8',
)

console.log(`[pack-demo] Kit de demo → ${releaseDemo}`)
