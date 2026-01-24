import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  loading: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
};

export function showToast(type: ToastType, options: ToastOptions) {
  const { title, description, duration = 4000, action } = options;

  return sonnerToast.custom(
    (id) => (
      <div className="flex items-start gap-3 w-full max-w-sm p-4 rounded-xl bg-card border border-border shadow-lg">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                sonnerToast.dismiss(id);
              }}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    ),
    {
      duration: type === "loading" ? Infinity : duration,
    }
  );
}

// Convenience methods
export const feedbackToast = {
  success: (title: string, description?: string) =>
    showToast("success", { title, description }),
  error: (title: string, description?: string) =>
    showToast("error", { title, description, duration: 6000 }),
  warning: (title: string, description?: string) =>
    showToast("warning", { title, description }),
  info: (title: string, description?: string) =>
    showToast("info", { title, description }),
  loading: (title: string, description?: string) =>
    showToast("loading", { title, description }),
  dismiss: () => sonnerToast.dismiss(),
};
