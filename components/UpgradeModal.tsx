import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm p-8 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        
        <div className="relative text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 scale-110">
            <span className="material-icons-round text-primary text-3xl">workspace_premium</span>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upgrade to Pro</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 px-2 leading-relaxed">
            Unlock the power to customize your messages and take full control of your communication.
          </p>

          <div className="space-y-4 mb-8 text-left">
            <div className="flex items-start space-x-3">
              <span className="material-icons-round text-primary text-lg">check_circle</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Custom Message Editing</p>
                <p className="text-[11px] text-slate-500">Edit any part of the auto-generated preview.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="material-icons-round text-primary text-lg">check_circle</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Premium Templates</p>
                <p className="text-[11px] text-slate-500">Coming soon: Multiple message styles.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="material-icons-round text-primary text-lg">check_circle</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Priority Support</p>
                <p className="text-[11px] text-slate-500">Get help faster from our team.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-8 border border-slate-100 dark:border-white/5">
            <div className="flex justify-between items-center">
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual Plan</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">$4.99 <span className="text-xs font-normal text-slate-500">/ year</span></p>
              </div>
              <div className="px-3 py-1 bg-primary/10 rounded-full">
                <span className="text-[10px] font-bold text-primary">BEST VALUE</span>
              </div>
            </div>
          </div>

          <button
            onClick={onUpgrade}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg neon-glow hover:brightness-110 active:scale-[0.98] transition-all mb-4"
          >
            Unlock Now
          </button>
          
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
