import type { Cartridge } from '../types/cartridge'
import { getDemoCartridges } from './cartridges'

export function loadDemoLibrary(): Cartridge[] {
  return getDemoCartridges()
}
