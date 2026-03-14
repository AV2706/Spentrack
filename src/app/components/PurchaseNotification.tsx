import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { X, AlertTriangle, Sparkles } from "lucide-react";
import { useCurrency } from "../hooks/useCurrency";

interface PurchaseNotificationProps {
  isOpen: boolean;
  appName: string;
  appIcon: string;
  avgSpend: number;
  onClose: () => void;
  onSave: () => void;
  onContinue: () => void;
}

export function PurchaseNotification({
  isOpen,
  appName,
  appIcon,
  avgSpend,
  onClose,
  onSave,
  onContinue,
}: PurchaseNotificationProps) {
  const currency = useCurrency();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
          />

          {/* Notification Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[201]"
          >
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg">
                    {appIcon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Hold On!</h3>
                    <p className="text-amber-100 text-sm">Think before you spend</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 font-medium mb-2">
                      You're about to open <span className="font-bold text-amber-700">{appName}</span>
                    </p>
                    <p className="text-slate-600 text-sm">
                      You typically spend <span className="font-bold text-amber-700">{currency}{avgSpend.toFixed(2)}</span> when using this app. Is this purchase really necessary?
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={onSave}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-6 shadow-lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    I'll Save My Money!
                  </Button>
                  <Button
                    onClick={onContinue}
                    variant="outline"
                    className="w-full border-2 border-slate-300 hover:bg-slate-100 py-6 font-medium"
                  >
                    I Really Need This
                  </Button>
                </div>

                <p className="text-xs text-center text-slate-500 pt-2">
                  💡 Remember: Every dollar saved is a step toward your financial goals
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg">
                {appIcon}
              </div>
              <div>
                <h3 className="font-bold text-xl">Hold On!</h3>
                <p className="text-amber-100 text-sm">Think before you spend</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-slate-900 font-medium mb-2">
                  You're about to open <span className="font-bold text-amber-700">{appName}</span>
                </p>
                <p className="text-slate-600 text-sm">
                  You typically spend <span className="font-bold text-amber-700">{currency}{avgSpend.toFixed(2)}</span> when using this app. Is this purchase really necessary?
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={onSave}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-6 shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                I'll Save My Money!
              </Button>
              <Button
                onClick={onContinue}
                variant="outline"
                className="w-full border-2 border-slate-300 hover:bg-slate-100 py-6 font-medium"
              >
                I Really Need This
              </Button>
            </div>

            <p className="text-xs text-center text-slate-500 pt-2">
              💡 Remember: Every dollar saved is a step toward your financial goals
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}