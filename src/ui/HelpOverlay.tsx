interface Props {
  open: boolean
  onClose: () => void
}

export function HelpOverlay({ open, onClose }: Props) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal help-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard help"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Controls</h2>
        <ul className="help-list">
          <li><kbd>↑↓←→</kbd> / <kbd>WASD</kbd> — move grid focus</li>
          <li><kbd>Enter</kbd> / <kbd>Space</kbd> — select cartridge</li>
          <li><kbd>?</kbd> — toggle this help</li>
          <li><kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> — command palette</li>
          <li><kbd>⌘/Ctrl+click</kbd> — multi-select carts</li>
          <li><kbd>Esc</kbd> — close panels</li>
        </ul>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
