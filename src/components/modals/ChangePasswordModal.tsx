import React from 'react';
import { KeyRound, ShieldCheck, Lock, X } from 'lucide-react';
import { UserAccount } from '../../types/mediaAsset';

interface ChangePasswordModalProps {
  currentUser: UserAccount;
  onPasswordChanged?: (updatedUser: UserAccount) => void;
  onClose?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  currentUser,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden text-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>Admin-Controlled Password Security</span>
              </h2>
              <span className="text-[11px] text-amber-400 font-mono">
                Operations HQ Credential Governance
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-lg text-[11px] text-amber-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-100 block mb-1">Administrator Password Management:</strong>
              Client passwords for account <code className="text-white font-mono">{currentUser.email}</code> are managed
              exclusively by the Blaze Media Operations Administrator. Clients are not permitted to change or reset
              passwords directly.
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 text-[11px] leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              To request a password reset or update your access credentials, please contact your operations supervisor or
              email the Administrator at <span className="text-amber-400 font-mono">admin@blaze.com.pk</span>.
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
