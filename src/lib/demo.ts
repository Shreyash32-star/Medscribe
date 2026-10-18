import type { Segment } from "@/lib/notes-schema";

/** Sample mixed Hindi / English / Marathi consultation (fictional). */
export const DEMO_SEGMENTS: Segment[] = [
  { speaker: "Doctor", start_seconds: 2, text: "Namaskar, basa. Aaj kya problem hai?" },
  { speaker: "Patient", start_seconds: 6, text: "Doctor, mujhe paanch din se khansi aur halka bukhaar hai." },
  { speaker: "Doctor", start_seconds: 12, text: "Khansi sukhi hai ya balgam ke saath?" },
  { speaker: "Patient", start_seconds: 16, text: "Thoda balgam aata hai, aur raat ko thakan bhi zyada hoti hai." },
  { speaker: "Doctor", start_seconds: 23, text: "Saans lene mein takleef ya chest pain?" },
  { speaker: "Patient", start_seconds: 27, text: "Nahi, chest pain nahi hai, saans theek hai." },
  { speaker: "Doctor", start_seconds: 32, text: "Pehle koi diabetes ya BP ki history?" },
  { speaker: "Patient", start_seconds: 36, text: "Haan, sugar hai do saal se. Metformin 500 tablet roz leta hoon." },
  { speaker: "Doctor", start_seconds: 43, text: "Kisi dawai se allergy?" },
  { speaker: "Patient", start_seconds: 46, text: "Penicillin se allergy hai, rash aaya tha." },
  { speaker: "Doctor", start_seconds: 51, text: "Gharat konala asa tras aahe ka? Family mein?" },
  { speaker: "Patient", start_seconds: 55, text: "Majhya baba na pan sugar hota, aani BP." },
  { speaker: "Doctor", start_seconds: 61, text: "Smoking ya alcohol?" },
  { speaker: "Patient", start_seconds: 64, text: "Smoking nahi, kabhi kabhi alcohol. Office job hai." },
  { speaker: "Patient", start_seconds: 70, text: "Last week ka CBC report bhi laya hoon." },
  { speaker: "Doctor", start_seconds: 76, text: "Theek hai, report dekhta hoon. Teen din baad follow up ke liye wapas aana." },
];

export const SAMPLE_PATIENTS = [
  { full_name: "Anjali Deshmukh", age: 34, gender: "Female", phone: "+91 98220 11223", blood_group: "B+", allergies: "None known", conditions: "Hypothyroidism", medications: "Levothyroxine 50 mcg" },
  { full_name: "Rajesh Kumar", age: 56, gender: "Male", phone: "+91 98111 44556", blood_group: "O+", allergies: "Sulfa drugs", conditions: "Type 2 diabetes, Hypertension", medications: "Metformin, Amlodipine" },
  { full_name: "Fatima Shaikh", age: 27, gender: "Female", phone: "+91 90040 77889", blood_group: "A-", allergies: "", conditions: "", medications: "" },
];
