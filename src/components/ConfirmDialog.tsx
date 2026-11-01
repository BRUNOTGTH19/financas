import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Excluir',
  tone = 'danger',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
