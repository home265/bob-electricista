"use client";

export default function ConfirmDialog({
  onConfirm,
  children,
  message = "¿Confirmar?",
  // La única diferencia es esta línea:
  className, 
}: {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  message?: string;
  // Y esta: le decimos que podemos recibir clases de estilo
  className?: string; 
}) {
  async function handleClick() {
    const ok = window.confirm(message);
    if (ok) await onConfirm();
  }

  // Ahora, el botón usará las clases que le pases.
  // Si no le pasas ninguna, no tendrá estilos por defecto,
  // lo cual es perfecto para forzarnos a usar nuestras clases .btn
  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}