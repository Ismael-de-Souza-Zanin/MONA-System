import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import mGlbUrl from './models/mona-m.glb?url'
import hojeUrl from './captures/widgets/hoje.png'
import kpiClientesUrl from './captures/widgets/kpi-clientes.png'
import kpiFinanceiroUrl from './captures/widgets/kpi-financeiro.png'
import tarefasUrl from './captures/widgets/tarefas.png'
import agendaDockUrl from './captures/widgets/agenda.png'
import clienteCardUrl from './captures/widgets/cliente.png'
import clienteFinanceiroUrl from './captures/widgets/cliente-financeiro.png'
import heroWidgetUrl from './captures/widgets/hero.png'
import emailsUrl from './captures/emails.png'
import whatsappUrl from './captures/whatsapp.png'
import sopsUrl from './captures/sops.png'
import onboardingUrl from './captures/onboarding.png'
import operacaoUrl from './captures/operacao.png'
import { LAND_NODES, nodeRing3d } from './landingNodes'

const ROSE = 0xf54d7d
const LILAC = 0xb388ff
const PURPLE = 0x582b86
const ORANGE = 0xff7a33
const WHITE = 0xffffff
const CREAM = 0xfff7f1
const SKY = 0xead6f0

const NODE_COLOR = {
  purple: PURPLE,
  rose: ROSE,
  orange: ORANGE,
  lilac: LILAC,
} as const

const STEPS = ['Cliente', 'Onboarding', 'Procedimento', 'Execução', 'Acompanha', 'Resultado']

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function range(t: number, a: number, b: number) {
  return clamp01((t - a) / Math.max(0.0001, b - a))
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) * (2 - 2 * t) / 2
}

function windowed(t: number, a: number, b: number, c: number, d: number) {
  return easeInOut(range(t, a, b)) * (1 - easeInOut(range(t, c, d)))
}

function roundedRect(w: number, h: number, r: number) {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  const radius = Math.min(r, w / 2.4, h / 2.4)
  shape.moveTo(x + radius, y)
  shape.lineTo(x + w - radius, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + radius)
  shape.lineTo(x + w, y + h - radius)
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  shape.lineTo(x + radius, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)
  return shape
}

function paintScreen(group: THREE.Group, texture: THREE.Texture) {
  const face = group.getObjectByName('screen') as THREE.Mesh | undefined
  if (!face) return
  const material = face.material as THREE.MeshBasicMaterial
  material.map = texture
  material.color.setHex(WHITE)
  material.needsUpdate = true
}

function setCable(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3) {
  const dir = to.clone().sub(from)
  const length = Math.max(dir.length(), 0.001)
  mesh.position.copy(from).add(to).multiplyScalar(0.5)
  mesh.scale.set(1, length, 1)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.multiplyScalar(1 / length))
}

function makePortalPhrase() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 256)
    ctx.fillStyle = '#2a1540'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '600 40px Georgia, "Times New Roman", serif'
    ctx.shadowColor = 'rgba(255,255,255,0.95)'
    ctx.shadowBlur = 16
    ctx.fillText('Seu dia começa aqui.', 512, 128)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.16),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  mesh.name = 'portal-phrase'
  mesh.renderOrder = 3
  return mesh
}

function makePortalFill() {
  // Soft glow that fills the vão openings — feathered rect, not a round ball.
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512)
    // Horizontal soft light field (matches the M openings better than a circle).
    const glow = ctx.createRadialGradient(256, 256, 4, 256, 256, 240)
    glow.addColorStop(0, 'rgba(255,255,255,1)')
    glow.addColorStop(0.2, 'rgba(255,248,252,0.95)')
    glow.addColorStop(0.45, 'rgba(255,220,236,0.7)')
    glow.addColorStop(0.75, 'rgba(255,190,220,0.25)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = glow
    ctx.save()
    ctx.translate(256, 256)
    ctx.beginPath()
    ctx.ellipse(0, 0, 220, 175, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.95),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  )
  mesh.name = 'portal-fill'
  mesh.renderOrder = 1
  return mesh
}

function makePanel(w: number, h: number, accent: number) {
  const group = new THREE.Group()
  const board = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRect(w, h, 0.12), {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.016,
      bevelSegments: 2,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xe8d8f4,
      roughness: 0.14,
      metalness: 0.1,
    }),
  )
  board.position.z = -0.03
  board.castShadow = true
  board.receiveShadow = true
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.93, h * 0.9),
    new THREE.MeshBasicMaterial({ color: CREAM }),
  )
  face.name = 'screen'
  face.position.z = 0.04
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.96, h * 0.94),
    new THREE.MeshPhysicalMaterial({
      color: WHITE,
      roughness: 0.08,
      metalness: 0.04,
      transparent: true,
      opacity: 0.16,
    }),
  )
  glass.position.z = 0.048
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.42, 0.028, 0.012),
    new THREE.MeshBasicMaterial({ color: accent }),
  )
  rim.position.set(0, h / 2 - 0.05, 0.05)
  group.add(board, face, glass, rim)
  return group
}

function mountM(model: THREE.Object3D, size: number) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.castShadow = true
    child.receiveShadow = true
    const paint = (material: THREE.Material) => {
      const mapped = material as THREE.MeshStandardMaterial
      if (mapped.map) mapped.map.colorSpace = THREE.SRGBColorSpace
      mapped.envMapIntensity = 1.2
      mapped.needsUpdate = true
    }
    if (Array.isArray(child.material)) child.material.forEach(paint)
    else paint(child.material)
  })
  const wrap = new THREE.Group()
  wrap.add(model)
  wrap.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(wrap)
  const dim = box.getSize(new THREE.Vector3())
  const longest = Math.max(dim.x, dim.y, dim.z) || 1
  const scale = size / longest
  wrap.scale.set(scale, scale, dim.z * scale < 0.22 ? 0.22 / Math.max(dim.z, 0.001) : scale)
  wrap.updateMatrixWorld(true)
  const centered = new THREE.Box3().setFromObject(wrap)
  wrap.position.sub(centered.getCenter(new THREE.Vector3()))
  return wrap
}

function makeDots() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const fill = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    fill.addColorStop(0, 'rgba(255,255,255,1)')
    fill.addColorStop(0.45, 'rgba(255,180,210,0.7)')
    fill.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, 64, 64)
  }
  const texture = new THREE.CanvasTexture(canvas)
  const count = 320
  const positions = new Float32Array(count * 3)
  const seeds: number[] = []
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 16
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    seeds.push(Math.random())
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      map: texture,
      color: 0xffc0d8,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  return { points, seeds, positions }
}

const CAM = [
  { t: 0, p: [0, 0.35, 16], l: [0, 0.45, 0] },
  { t: 0.08, p: [0, 0.32, 12], l: [0, 0.22, 0] },
  { t: 0.14, p: [0, 0.38, 12.4], l: [0, 0.22, 0] },
  { t: 0.22, p: [0, 0.38, 9.4], l: [0, 0.3, 0] },
  { t: 0.28, p: [0, 0.3, 5.8], l: [0, 0.24, 0] },
  { t: 0.34, p: [0, 0.26, 4.4], l: [0, 0.22, 0] },
  // Hold: full M + soft light + small phrase.
  { t: 0.4, p: [0, 0.24, 3.8], l: [0, 0.2, 0] },
  { t: 0.42, p: [0, 0.22, 3.2], l: [0, 0.16, -0.25] },
  // Cross through the M — hide emblem before the session-05 camera.
  { t: 0.45, p: [0, 0.14, 1.6], l: [0, 0.1, -0.55] },
  { t: 0.475, p: [0, 0.08, 0.5], l: [0, 0.05, -0.85] },
  { t: 0.5, p: [0, 0.18, 14], l: [0, 0.12, 0] },
  { t: 0.56, p: [0, 0.18, 14], l: [0, 0.12, 0] },
  { t: 0.62, p: [0, 0.2, 14], l: [0, 0.1, 0] },
  { t: 0.72, p: [0, 0.22, 13.5], l: [0, 0.1, 0] },
  { t: 0.82, p: [0, 0.28, 12], l: [0, 0.12, 0] },
  { t: 0.88, p: [-0.55, 0.42, 8.8], l: [-0.55, 0.18, 0] },
  { t: 0.93, p: [0.55, 0.36, 9.2], l: [0.55, 0.18, 0] },
  { t: 1, p: [0.62, 0.34, 9.4], l: [0.62, 0.18, 0] },
]

function sampleCam(t: number) {
  const last = CAM[CAM.length - 1]
  if (t <= CAM[0].t) return CAM[0]
  if (t >= last.t) return last
  let i = 1
  while (i < CAM.length && CAM[i].t < t) i += 1
  const a = CAM[i - 1]
  const b = CAM[i]
  const u = range(t, a.t, b.t)
  return {
    t,
    p: [mix(a.p[0], b.p[0], u), mix(a.p[1], b.p[1], u), mix(a.p[2], b.p[2], u)] as [number, number, number],
    l: [mix(a.l[0], b.l[0], u), mix(a.l[1], b.l[1], u), mix(a.l[2], b.l[2], u)] as [number, number, number],
  }
}

export type MonaScene = {
  setProgress: (progress: number) => void
  resize: () => void
  dispose: () => void
}

export function createMonaScene(canvas: HTMLCanvasElement): MonaScene {
  const mobile = window.matchMedia('(max-width: 767px)').matches
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75))
  renderer.setClearColor(0xfff7f1, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(SKY, 16, 36)
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 80)

  scene.add(new THREE.AmbientLight(0xfff4fb, 0.7))
  scene.add(new THREE.HemisphereLight(0xffe8f4, 0xe8d8ff, 0.48))
  const sun = new THREE.DirectionalLight(0xfff6ee, 1.15)
  sun.position.set(5, 9, 7)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 28
  sun.shadow.camera.left = -10
  sun.shadow.camera.right = 10
  sun.shadow.camera.top = 8
  sun.shadow.camera.bottom = -8
  scene.add(sun)
  const fill = new THREE.DirectionalLight(0xffd4ea, 0.7)
  fill.position.set(-3.2, 2.4, 8)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xc4a0ff, 0.45)
  rim.position.set(4, 1.6, -5)
  scene.add(rim)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = env
  scene.environmentIntensity = 0.92
  pmrem.dispose()

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(16, 48),
    new THREE.ShadowMaterial({ opacity: 0.16 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -2.6
  floor.receiveShadow = true
  floor.visible = false
  scene.add(floor)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 9.5, 72),
    new THREE.MeshBasicMaterial({ color: 0xdcc4f4, transparent: true, opacity: 0.38, side: THREE.DoubleSide }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = -2.48
  ring.visible = false
  scene.add(ring)
  const glowFloor = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 40),
    new THREE.MeshBasicMaterial({ color: ROSE, transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
  )
  glowFloor.rotation.x = -Math.PI / 2
  glowFloor.position.y = -2.46
  glowFloor.visible = false
  scene.add(glowFloor)

  const orbs = [
    { color: PURPLE, p: [-7.4, 3.2, -8], s: 3.4 },
    { color: ROSE, p: [8.2, -1.6, -7], s: 2.8 },
    { color: ORANGE, p: [1.2, 4.8, -10], s: 2.2 },
    { color: LILAC, p: [-4.2, -3.2, -6], s: 1.8 },
  ].map((spec) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(spec.s, 24, 24),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.16, depthWrite: false }),
    )
    mesh.position.set(spec.p[0], spec.p[1], spec.p[2])
    mesh.visible = false
    scene.add(mesh)
    return mesh
  })

  const root = new THREE.Group()
  scene.add(root)

  const shards: THREE.Group[] = []
  const cables: THREE.Mesh[] = []
  const cableFrom = new THREE.Vector3()
  const cableTo = new THREE.Vector3(0, 0.28, 0)
  LAND_NODES.forEach((node) => {
    const ring = nodeRing3d(node.angle)
    const panel = makePanel(0.4, 0.4, NODE_COLOR[node.tone])
    panel.visible = false
    panel.position.set(ring.x, ring.y, ring.z)
    root.add(panel)
    shards.push(panel)
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.01, 1, 8),
      new THREE.MeshBasicMaterial({ color: NODE_COLOR[node.tone], transparent: true, opacity: 0.78 }),
    )
    cable.visible = false
    root.add(cable)
    cables.push(cable)
  })

  const chaos: THREE.Group[] = []
  for (let i = 0; i < 16; i += 1) {
    const tile = makePanel(1.05 + (i % 4) * 0.08, 0.68 + (i % 3) * 0.06, [PURPLE, ROSE, ORANGE][i % 3])
    tile.position.set(((i % 4) - 1.5) * 1.05, (Math.floor(i / 4) - 1.5) * 0.72, -0.4 - (i % 5) * 0.12)
    tile.rotation.z = (i % 5) * 0.08 - 0.16
    tile.visible = false
    root.add(tile)
    chaos.push(tile)
  }

  const steps: THREE.Group[] = []
  STEPS.forEach((_, index) => {
    const node = makePanel(1.42, 0.92, index === STEPS.length - 1 ? PURPLE : WHITE)
    node.visible = false
    root.add(node)
    steps.push(node)
  })

  const scanner = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 8.2, 0.08),
    new THREE.MeshBasicMaterial({ color: ROSE }),
  )
  const scanGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 9),
    new THREE.MeshBasicMaterial({ color: ROSE, transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
  )
  scanner.add(scanGlow)
  scanner.visible = false
  root.add(scanner)

  const orbits: THREE.Group[] = []
  ;[2.2, 3.45, 4.7].forEach((radius, ring) => {
    const group = new THREE.Group()
    const count = 7 + ring * 2
    for (let i = 0; i < count; i += 1) {
      const tile = makePanel(1.18, 0.74, [PURPLE, ROSE, ORANGE][i % 3])
      const angle = (i / count) * Math.PI * 2
      tile.position.set(Math.cos(angle) * radius, Math.sin(angle) * 0.35, Math.sin(angle) * radius)
      group.add(tile)
    }
    group.visible = false
    root.add(group)
    orbits.push(group)
  })

  const emblem = new THREE.Group()
  emblem.visible = false
  root.add(emblem)

  // Light + phrase live behind the M mesh — only visible through the 3D openings.
  const portalInM = new THREE.Group()
  portalInM.visible = false
  root.add(portalInM)
  const portalFill = makePortalFill()
  portalFill.position.set(0, 0.02, -0.14)
  portalInM.add(portalFill)
  const portalPhrase = makePortalPhrase()
  portalPhrase.position.set(0, 0.02, -0.1)
  portalInM.add(portalPhrase)
  const portalLight = new THREE.PointLight(0xfff8fc, 0, 4, 1.4)
  portalLight.position.set(0, 0.05, -0.02)
  portalInM.add(portalLight)

  new GLTFLoader().load(
    mGlbUrl,
    (gltf) => {
      const model = mountM(gltf.scene, 1.85)
      emblem.clear()
      emblem.add(model)
    },
    undefined,
    () => {
      emblem.visible = false
    },
  )

  const dots = makeDots()
  dots.points.visible = false
  root.add(dots.points)

  // Bloom wipe clears alpha to black and hides the CSS backgrounds.
  // Keep a light bloom only on portal; otherwise render with transparent clear.
  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  renderPass.clearAlpha = 0
  composer.addPass(renderPass)
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.14, 0.35, 0.9)
  bloom.enabled = false
  composer.addPass(bloom)

  const loader = new THREE.TextureLoader()
  const loaded = new Map<string, THREE.Texture>()
  const waiting = new Map<string, Array<(texture: THREE.Texture) => void>>()
  const ready = (url: string, apply: (texture: THREE.Texture) => void) => {
    const hit = loaded.get(url)
    if (hit) {
      apply(hit)
      return
    }
    const queue = waiting.get(url)
    if (queue) {
      queue.push(apply)
      return
    }
    waiting.set(url, [apply])
    loader.load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.needsUpdate = true
      loaded.set(url, texture)
      waiting.get(url)?.forEach((fn) => fn(texture))
      waiting.delete(url)
    })
  }

  const stepUrls = [clienteCardUrl, onboardingUrl, sopsUrl, operacaoUrl, agendaDockUrl, kpiFinanceiroUrl]
  const mixUrls = [
    heroWidgetUrl,
    hojeUrl,
    tarefasUrl,
    agendaDockUrl,
    kpiClientesUrl,
    kpiFinanceiroUrl,
    emailsUrl,
    whatsappUrl,
    sopsUrl,
    clienteCardUrl,
    clienteFinanceiroUrl,
  ]

  stepUrls.forEach((url, index) => ready(url, (texture) => paintScreen(steps[index], texture)))
  chaos.forEach((tile, index) => ready(mixUrls[index % mixUrls.length], (texture) => paintScreen(tile, texture)))
  orbits.forEach((ring) => {
    ring.children.forEach((child, index) => {
      if (child instanceof THREE.Group) {
        ready(mixUrls[(index + 2) % mixUrls.length], (texture) => paintScreen(child, texture))
      }
    })
  })

  const look = new THREE.Vector3()
  let progress = 0
  let running = true

  const setProgress = (value: number) => {
    progress = clamp01(value)
  }

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    composer.setSize(width, height)
    camera.aspect = width / Math.max(height, 1)
    camera.fov = mobile ? 48 : 42
    camera.updateProjectionMatrix()
  }

  const tick = () => {
    if (!running) return
    const t = progress
    const appear = easeInOut(range(t, 0.05, 0.11))
    const explode = easeInOut(range(t, 0.06, 0.13))
    const wire = easeInOut(range(t, 0.09, 0.16))
    const converge = easeInOut(range(t, 0.19, 0.31))
    const approach = easeInOut(range(t, 0.28, 0.4))
    const enter = easeInOut(range(t, 0.42, 0.475))
    const through = easeInOut(range(t, 0.42, 0.49))
    const crossed = through > 0.78
    const live = windowed(t, 0.5, 0.54, 0.68, 0.73)
    const process = 0
    const scan = 0
    const architecture = easeInOut(range(t, 0.84, 0.92)) * (1 - easeInOut(range(t, 0.93, 0.97)))
    const collapse = range(t, 0.93, 1)

    shards.forEach((panel, index) => {
      const node = LAND_NODES[index]
      const ring = nodeRing3d(node.angle)
      const absorb = converge
      const shown = appear > 0.02 && absorb < 0.92 && t < 0.36
      panel.visible = false
      const cable = cables[index]
      cable.visible = shown && wire > 0.05
      if (!shown) return
      const x = mix(ring.x, 0, absorb)
      const y = mix(ring.y, 0.28, absorb)
      const z = mix(ring.z, 0, absorb)
      cableFrom.set(x, y, z)
      cableTo.set(mix(x, 0, wire), mix(y, 0.28, wire), mix(z, 0, wire))
      setCable(cable, cableFrom, cableTo)
      const cableMat = cable.material as THREE.MeshBasicMaterial
      cableMat.opacity = mix(0, 0.86, wire) * mix(1, 0.06, absorb)
    })

    // After crossing, M stays gone until later stations — no ghost / come-back.
    const portalOn = t > 0.06 && t < 0.5 && !crossed
    const nucleus = t > 0.84 && t < 0.94
    emblem.visible = portalOn || nucleus || t > 0.93
    const hub = mix(0.48, 0.78, explode)
    const formed = mix(hub, 1.12, converge)
    const portalHold = mix(formed, 1.28, approach)
    const flyPast = mix(portalHold, 2.2, through)
    const core = mix(0.82, 1.02, architecture)
    const end = mix(1.08, 1.48, collapse)
    emblem.scale.setScalar(t > 0.93 ? end : nucleus ? core : portalOn ? flyPast : 0)
    emblem.position.set(nucleus ? -0.55 : t > 0.93 ? 0.72 : 0, 0.22, 0)
    emblem.rotation.y = t > 0.84 ? 0.06 : mix(0.38, 0, easeInOut(range(t, 0.22, 0.34)))
    emblem.rotation.x = t > 0.84 ? 0 : mix(0.08, 0, approach)

    emblem.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return
        material.transparent = false
        material.opacity = 1
        material.depthWrite = true
        if (portalOn) {
          material.emissive.setHex(0xffb0d0)
          material.emissiveIntensity = mix(0, 0.45, easeInOut(range(t, 0.28, 0.42)))
        } else {
          material.emissiveIntensity = 0
        }
        material.needsUpdate = true
      })
    })

    const glowIn = easeInOut(range(t, 0.26, 0.38))
    const gateOn = portalOn && t > 0.24
    portalInM.visible = gateOn
    if (gateOn) {
      portalInM.position.copy(emblem.position)
      portalInM.rotation.copy(emblem.rotation)
      portalInM.scale.copy(emblem.scale)
      const fillMat = portalFill.material as THREE.MeshBasicMaterial
      const phraseMat = portalPhrase.material as THREE.MeshBasicMaterial
      fillMat.opacity = mix(0, 1, glowIn) * mix(1, 0.2, through)
      phraseMat.opacity = mix(0, 1, glowIn) * mix(1, 0, enter)
      portalPhrase.scale.setScalar(1)
      portalLight.intensity = mix(0, 6.5, glowIn) * mix(1, 0.35, through)
    } else {
      portalLight.intensity = 0
    }

    dots.points.visible = false

    const fog = scene.fog as THREE.Fog
    fog.near = 80
    fog.far = 140
    fog.color.setHex(SKY)
    renderer.setClearColor(0x000000, 0)
    renderer.setClearAlpha(0)

    orbs.forEach((orb) => {
      orb.visible = false
    })

    steps.forEach((node, index) => {
      node.visible = process > 0.08
      node.position.set(-3.4 + index * 1.35, 0.15, 0)
      node.scale.setScalar(mix(0.6, 1, process))
    })

    chaos.forEach((tile, index) => {
      tile.visible = scan > 0.08
      const crossed = scanner.position.x > tile.position.x
      tile.position.x = mix(((index % 4) - 1.5) * 1.05, mix(-2.4, 2.2, Number(crossed)), scan)
      tile.rotation.z = mix((index % 5) * 0.08 - 0.16, 0, Number(crossed) * scan)
    })
    scanner.visible = scan > 0.08
    scanner.position.set(mix(-4.8, 4.8, scan), 0.2, 0.5)

    orbits.forEach((ring) => {
      ring.visible = false
      ring.scale.setScalar(0)
    })

    bloom.enabled = false
    bloom.strength = 0
    camera.fov = mix(mobile ? 48 : 42, mobile ? 52 : 48, enter)
    camera.near = 0.05
    camera.updateProjectionMatrix()

    const cam = sampleCam(t)
    camera.position.set(cam.p[0], cam.p[1], cam.p[2])
    look.set(cam.l[0], cam.l[1], cam.l[2])
    camera.lookAt(look)
    camera.up.set(0, 1, 0)

    if (bloom.enabled) {
      composer.render()
    } else {
      renderer.setClearColor(0x000000, 0)
      renderer.clear()
      renderer.render(scene, camera)
    }
    requestAnimationFrame(tick)
  }

  resize()
  requestAnimationFrame(tick)

  return {
    setProgress,
    resize,
    dispose() {
      running = false
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
          child.geometry.dispose()
          const material = child.material
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
          else material.dispose()
        }
      })
      env.dispose()
      composer.dispose()
      renderer.dispose()
    },
  }
}
