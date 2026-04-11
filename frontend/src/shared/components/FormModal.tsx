import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

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
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className={panelClassName} showCloseButton={false}>
        <DialogHeader className="modal-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="modal-description">
              {description}
            </DialogDescription>
          </div>
          <button
            type="button"
            className="action-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </DialogHeader>
        <div className="modal-body">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
