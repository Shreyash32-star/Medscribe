import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { createConsultation, ensureDemoPatient } from "@/lib/db";

export function useStartConsultation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const start = async (patientId: string) => {
    setBusy(true);
    try {
      const c = await createConsultation(user!.id, patientId);
      navigate({ to: "/consultation/$consultationId", params: { consultationId: c.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const startDemo = async () => {
    setBusy(true);
    try {
      const p = await ensureDemoPatient(user!.id);
      const c = await createConsultation(user!.id, p.id, true);
      navigate({ to: "/consultation/$consultationId", params: { consultationId: c.id }, search: { demo: true } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return { start, startDemo, busy };
}
