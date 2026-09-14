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
          Stinkweasel Dexter says: flip <strong>Demo OFF</strong> to see your fleet Pages carts, hit{' '}
          <kbd>?</kbd> for controls, <kbd>⌘K</kbd> for the command palette, and Play opens safe https
          links only.
        </p>
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Insert cartridge
        </button>
      </div>
    </div>
  )
}
