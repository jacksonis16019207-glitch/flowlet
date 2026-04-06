import type { ReactNode } from 'react'

type FormModalProps = {
  open: boolean
  title: string
  description: string
  onClose: () => void
  eyebrow?: string
  panelClassName?: string
  children: ReactNode
}

export function FormModal({
  open,
  title,
  description,
  onClose,
  eyebrow = 'Entry Form',
  panelClassName,
  children,
}: FormModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className={panelClassName ? `modal-panel ${panelClassName}` : 'modal-panel'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        aria-describedby="form-modal-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="form-modal-title">{title}</h2>
            <p id="form-modal-description" className="modal-description">
              {description}
            </p>
          </div>
          <button
            type="button"
            className="action-button"
            aria-label="Close"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  )
}
