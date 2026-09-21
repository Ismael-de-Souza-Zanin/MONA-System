export const LAND_NODES = [
  { key: 'tarefas', label: 'Tarefas', angle: 0, hx: 8, hy: -50, rot: 4, tone: 'orange', hero: true },
  { key: 'onboarding', label: 'Onboarding', angle: 45, hx: 36, hy: -38, rot: 6, tone: 'purple', hero: false },
  { key: 'financeiro', label: 'Financeiro', angle: 88, hx: 48, hy: 36, rot: -6, tone: 'rose', hero: true },
  { key: 'contratos', label: 'Contratos', angle: 130, hx: 52, hy: 12, rot: 3, tone: 'orange', hero: false },
  { key: 'agenda', label: 'Agenda', angle: 168, hx: -46, hy: -40, rot: -8, tone: 'purple', hero: true },
  { key: 'emails', label: 'E-mails', angle: 205, hx: 50, hy: -26, rot: 7, tone: 'lilac', hero: true },
  { key: 'whatsapp', label: 'WhatsApp', angle: 242, hx: 2, hy: 50, rot: -4, tone: 'rose', hero: true },
  { key: 'clientes', label: 'Clientes', angle: 302, hx: -44, hy: 38, rot: 6, tone: 'lilac', hero: true },
] as const

export function nodeRing2d(angle: number, radius = 40) {
  const rad = (angle * Math.PI) / 180
  return {
    x: Math.sin(rad) * radius,
    y: -Math.cos(rad) * radius * 0.82,
  }
}

export function nodeRing3d(angle: number, radius = 2.55) {
  const rad = (angle * Math.PI) / 180
  return {
    x: Math.sin(rad) * radius,
    y: Math.cos(rad) * 1.72,
    z: 0.18,
  }
}
