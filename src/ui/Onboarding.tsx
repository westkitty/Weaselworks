interface Props {
  open: boolean
  onDone: () => void
}

export function Onboarding({ open, onDone }: Props) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal onboarding" role="dialog" aria-modal="true" aria-label="Welcome">
        <img src="/dexter/stinkweasel-dexter.png" alt="" width={96} height={96} />
        <h2>Welcome to Weaselworks</h2>
        <p>
          Stinkweasel Dexter says: your fleet Pages carts load by default. Flip <strong>Demo ON</strong>{' '}
          only if you want the synthetic demo library. Hit <kbd>?</kbd> for controls, <kbd>⌘K</kbd> for
          the command palette — Play opens safe https links only.
        </p>
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Insert cartridge
        </button>
      </div>
    </div>
  )
}
