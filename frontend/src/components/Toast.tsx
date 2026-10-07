import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle, Zap, X } from "lucide-react";

export type ToastType = "info" | "success" | "warning" | "error" | "attack";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (title: string, message?: string, type?: ToastType) => void;
  showToast: (message: string, type?: ToastType | string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, message?: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, title, message, type };
    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const showToast = useCallback((message: string, type: ToastType | string = "info") => {
    const toastType = (type as ToastType) || "info";
    const title =
      toastType === "success"
        ? "Success"
        : toastType === "error"
        ? "Error"
        : toastType === "warning"
        ? "Warning"
        : toastType === "attack"
        ? "Threat Alert"
        : "Notification";
    addToast(title, message, toastType);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`
                pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 relative overflow-hidden
                ${
                  toast.type === "attack"
                    ? "bg-gradient-to-r from-rose-950/90 to-slate-900/90 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    : toast.type === "success"
                    ? "bg-gradient-to-r from-emerald-950/90 to-slate-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                    : toast.type === "warning"
                    ? "bg-gradient-to-r from-amber-950/90 to-slate-900/90 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                    : toast.type === "error"
                    ? "bg-gradient-to-r from-red-950/90 to-slate-900/90 border-red-500/60"
                    : "bg-gradient-to-r from-cyan-950/90 to-slate-900/90 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                }
              `}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {toast.type === "attack" && <Zap className="w-5 h-5 text-rose-400 animate-bounce" />}
                {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />}
                {toast.type === "error" && <XCircle className="w-5 h-5 text-red-400" />}
                {toast.type === "info" && <Info className="w-5 h-5 text-cyan-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <h4 className={`text-xs font-black uppercase tracking-wider ${
                  toast.type === "attack" ? "text-rose-200" : "text-slate-100"
                }`}>
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Close */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Progress line */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4.5, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-0.5 ${
                  toast.type === "attack"
                    ? "bg-rose-500"
                    : toast.type === "success"
                    ? "bg-emerald-400"
                    : toast.type === "warning"
                    ? "bg-amber-400"
                    : toast.type === "error"
                    ? "bg-red-500"
                    : "bg-cyan-400"
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
