"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentProject } from "@/lib/storage";


export default function NuevoElectricaRedirect() {
  const router = useRouter();

  useEffect(() => {
    const p = getCurrentProject();
    if (p) router.replace(`/proyecto/${p.id}/electrica`);
    else router.replace("/"); // abre el ProjectGate
  }, [router]);

  return null;
}
