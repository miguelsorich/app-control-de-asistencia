import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subjectName: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subjectName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-delete-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="modal-delete-container"
        className="bg-white rounded-2xl shadow-2xl border border-[#DCE3EC] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#172033]">
              ¿Eliminar asignatura?
            </h3>
            <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
              ¿Está seguro de que desea eliminar la asignatura{' '}
              <span className="font-bold text-[#172033]">"{subjectName}"</span>?
              Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            id="btn-close-delete-modal"
            onClick={onClose}
            className="text-[#667085] hover:text-[#172033] p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA] rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
