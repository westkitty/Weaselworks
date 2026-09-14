import type { CartridgeStatus } from '../types/cartridge'

export function StatusBadge({ status }: { status: CartridgeStatus }) {
  return (
    <span className="status-badge" title={status}>
      <span className={`status-light status-${status}`} aria-hidden="true" />
      {status}
    </span>
  )
}
