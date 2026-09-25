const fs = require('fs')
const w = 59
const s = 19
const r = 32
const top = s
const bot = s + 64
const h = bot + s
const k = s * 0.55
const d = [
  `M 0 0`,
  `C ${k} 0 ${top} ${s - k} ${top} ${s}`,
  `L ${top} ${w - r}`,
  `A ${r} ${r} 0 0 0 ${top + r} ${w}`,
  `A ${r} ${r} 0 0 0 ${bot} ${w - r}`,
  `L ${bot} ${s}`,
  `C ${bot} ${s - k} ${h - k} 0 ${h} 0`,
  `L 0 0`,
  'Z',
].join(' ')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 118 80" width="560" height="380">
  <rect x="-8" y="-8" width="118" height="80" fill="#f7cfe0"/>
  <path fill="#fff" stroke="#111" stroke-width="1.2" d="${d}"/>
</svg>`
fs.writeFileSync('u-preview.svg', svg)
console.log(d)
