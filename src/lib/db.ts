import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { SAMPLE_PATIENTS } from "@/lib/demo";

export type Patient = Tables<"patients">;
export type Consultation = Tables<"consultations">;
export type DoctorProfile = Tables<"doctor_profiles">;
export type ConsultationWithPatient = Consultation & { patients: Pick<Patient, "full_name" | "age" | "gender"> | null };

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("doctor_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePatients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useConsultations(patientId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consultations", user?.id, patientId ?? "all"],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("consultations").select("*, patients(full_name, age, gender)").order("created_at", { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ConsultationWithPatient[];
    },
  });
}

export async function createConsultation(doctorId: string, patientId: string, isDemo = false) {
  const { data, error } = await supabase
    .from("consultations")
    .insert({ doctor_id: doctorId, patient_id: patientId, is_demo: isDemo })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function ensureDemoPatient(doctorId: string) {
  const name = "Demo — Suresh Patil";
  const { data } = await supabase.from("patients").select("*").eq("full_name", name).maybeSingle();
  if (data) return data;
  const { data: created, error } = await supabase
    .from("patients")
    .insert({ doctor_id: doctorId, full_name: name, age: 48, gender: "Male", phone: "+91 90000 00000", external_id: "DEMO-001" })
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function insertSamplePatients(doctorId: string) {
  const { error } = await supabase.from("patients").insert(SAMPLE_PATIENTS.map((p) => ({ ...p, doctor_id: doctorId })));
  if (error) throw error;
}

export const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
