import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const LANGUAGES = ["English", "Hindi", "Marathi", "Hinglish"];

export type ProfileDraft = {
  full_name: string; specialty: string; clinic_name: string; phone: string; email: string; city: string; languages: string[];
};

export function ProfileFields({ value, onChange }: { value: ProfileDraft; onChange: (v: ProfileDraft) => void }) {
  const set = (k: keyof ProfileDraft) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5"><Label>Full name</Label><Input required value={value.full_name} onChange={set("full_name")} placeholder="Dr. Priya Sharma" /></div>
      <div className="space-y-1.5"><Label>Specialty</Label><Input value={value.specialty} onChange={set("specialty")} placeholder="General Medicine" /></div>
      <div className="space-y-1.5"><Label>Clinic / hospital</Label><Input value={value.clinic_name} onChange={set("clinic_name")} placeholder="Sharma Family Clinic" /></div>
      <div className="space-y-1.5"><Label>City</Label><Input value={value.city} onChange={set("city")} placeholder="Pune" /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input value={value.phone} onChange={set("phone")} placeholder="+91 98xxx xxxxx" /></div>
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={value.email} onChange={set("email")} /></div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Consultation languages</Label>
        <div className="flex flex-wrap gap-3">
          {LANGUAGES.map((l) => (
            <label key={l} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent">
              <Checkbox
                checked={value.languages.includes(l)}
                onCheckedChange={(c) => onChange({ ...value, languages: c ? [...value.languages, l] : value.languages.filter((x) => x !== l) })}
              />
              {l}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
