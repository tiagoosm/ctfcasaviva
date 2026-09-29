import { useRef } from 'react';
import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  // O foco inicial vai para "Cancelar": a ação segura quando a confirmação é destrutiva
  const cancelRef = useRef(null);

  return (
    <Modal open={open} onClose={onCancel} title={title} initialFocusRef={cancelRef}>
      <div className="space-y-5 px-5 py-5">
        <p className="text-fg-muted">{description}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
