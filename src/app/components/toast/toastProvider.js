"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
} from "react";

import {
    CheckCircle2,
    CircleAlert,
    CircleX,
    Info,
    X
} from "lucide-react";

import "./toast.css";

const ToastContext = createContext(null);

const TOAST_DURATION = 4200;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((currentToasts) =>
            currentToasts.filter((toast) => toast.id !== id)
        );
    }, []);

    const showToast = useCallback(
        ({
            title,
            message,
            type = "success",
            duration = TOAST_DURATION
        }) => {
            const id =
                typeof crypto !== "undefined" &&
                typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`;

            const newToast = {
                id,
                title,
                message,
                type
            };

            setToasts((currentToasts) => [
                ...currentToasts,
                newToast
            ]);

            window.setTimeout(() => {
                removeToast(id);
            }, duration);

            return id;
        },
        [removeToast]
    );

    const toast = useMemo(
        () => ({
            success(message, title = "Succes") {
                return showToast({
                    type: "success",
                    title,
                    message
                });
            },

            error(message, title = "A apărut o problemă") {
                return showToast({
                    type: "error",
                    title,
                    message
                });
            },

            warning(message, title = "Atenție") {
                return showToast({
                    type: "warning",
                    title,
                    message
                });
            },

            info(message, title = "Informație") {
                return showToast({
                    type: "info",
                    title,
                    message
                });
            },

            show: showToast,
            remove: removeToast
        }),
        [removeToast, showToast]
    );

    return (
        <ToastContext.Provider value={toast}>
            {children}

            <div
                className="toast-container"
                aria-live="polite"
                aria-atomic="false"
            >
                {toasts.map((toastItem) => (
                    <ToastItem
                        key={toastItem.id}
                        toast={toastItem}
                        onClose={() => removeToast(toastItem.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }) {
    const Icon = getToastIcon(toast.type);

    return (
        <div
            className={`toast toast-${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
        >
            <div className="toast-icon">
                <Icon size={21} strokeWidth={2.2} />
            </div>

            <div className="toast-content">
                <strong>{toast.title}</strong>

                {toast.message && (
                    <p>{toast.message}</p>
                )}
            </div>

            <button
                type="button"
                className="toast-close"
                onClick={onClose}
                aria-label="Închide notificarea"
            >
                <X size={18} strokeWidth={2} />
            </button>

            <span className="toast-progress" />
        </div>
    );
}

function getToastIcon(type) {
    switch (type) {
        case "error":
            return CircleX;

        case "warning":
            return CircleAlert;

        case "info":
            return Info;

        case "success":
        default:
            return CheckCircle2;
    }
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error(
            "useToast trebuie folosit în interiorul ToastProvider."
        );
    }

    return context;
}