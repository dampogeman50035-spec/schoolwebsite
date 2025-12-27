// src/components/Toast.js
import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function useToasts() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div style={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{ ...styles.toast, ...styles[toast.type] }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Inline styles
const styles = {
  toastContainer: {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    marginBottom: "10px",
    padding: "12px 16px",
    borderRadius: "6px",
    color: "white",
    fontSize: "14px",
    minWidth: "180px",
    textAlign: "left",
  },
  success: { backgroundColor: "green" },
  error: { backgroundColor: "red" },
  info: { backgroundColor: "gray" },
};

export default ToastProvider;
