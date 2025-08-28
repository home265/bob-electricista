"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Redirige temporalmente al cálculo eléctrico actual.
 * Mantiene la lógica de Electricidad intacta mientras unificamos estética/guardado.
 * Más adelante migramos aquí el formulario definitivo y podremos eliminar la ruta vieja.
 */
export default function CalculoRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) router.replace(`/proyecto/${params.id}/electrica`);
  }, [params?.id, router]);

  return (
    <div className="p-6">
      <p>Redirigiendo al cálculo eléctrico…</p>
    </div>
  );
}
