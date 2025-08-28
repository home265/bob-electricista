"use client";

export default function ConfirmDialog({
  onConfirm,
  children,
  message = "¿Confirmar?",
}: {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  message?: string;
}) {
  async function handleClick() {
    const ok = window.confirm(message);
    if (ok) await onConfirm();
  }
  return (
    <button onClick={handleClick} className="px-3 py-2 rounded-lg border">
      {children}
    </button>
  );
}
