import bg01 from './bgs/01-hero.jpg'
import bg02 from './bgs/02-chaos.jpg'
import bg03 from './bgs/03-stage.jpg'
import bg04 from './bgs/04-portal.jpg'
import bg05 from './bgs/05-tour.jpg'
import bg06 from './bgs/06-client.jpg'
import bg07 from './bgs/07-process.jpg'
import bg08 from './bgs/08-scan.jpg'
import bg09 from './bgs/09-arch.jpg'
import bg10 from './bgs/10-cta.jpg'

export const LAND_BACKGROUNDS = [
  bg01,
  bg02,
  bg03,
  bg04,
  bg05,
  bg06,
  bg07,
  bg08,
  bg09,
  bg10,
] as const

export function bgFade(progress: number, index: number, count = LAND_BACKGROUNDS.length) {
  const p = progress * (count - 1)
  const d = Math.abs(p - index)
  return Math.max(0, 1 - d)
}
