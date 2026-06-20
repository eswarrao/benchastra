import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-secondary rounded-lg transition-all cursor-pointer"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 h-11 px-4 border-2 border-border cursor-pointer text-foreground font-medium rounded-xl hover:bg-secondary transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 px-4 cursor-pointer bg-destructive hover:bg-red-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/25"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
