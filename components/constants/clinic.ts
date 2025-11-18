import {
  ClinicState,
  Patient,
  Visit,
  Payment,
  PaymentMethod,
} from "@/components/types/clinic";

const nowIso = () => new Date().toISOString();

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

export const DISEASES = [
  "Babesiosis",
  "Bronchitis",
  "Chickenpox",
  "Cholera",
  "Chronic Kidney Disease",
  "COVID-19",
  "Diabetes Mellitus",
  "Gastroenteritis",
  "Heart Failure",
  "Hypertension",
  "Influenza",
  "Malaria",
  "Migraine",
  "Pneumonia",
  "Tuberculosis",
  "Upper Respiratory Infection",
  "Urinary Tract Infection",
];

export const COMMON_COMPLAINTS = [
  "Fever",
  "Headache",
  "Shortness of Breath",
  "Chest Pain",
  "Cough",
  "General Fatigue",
  "Abdominal Pain",
  "Joint Pain",
  "Skin Rash",
  "Nausea",
  "Dizziness",
  "Back Pain",
  "Sore Throat",
  "Loss of Appetite",
];

export const CHRONIC_CONDITIONS = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Heart Disease",
  "Chronic Kidney Disease",
  "Arthritis",
  "Chronic Obstructive Pulmonary Disease",
  "Thyroid Disorders",
  "Cancer History",
  "Obesity",
  "Depression",
];

export const ALLERGIES = [
  "Penicillin",
  "Sulfa Drugs",
  "Latex",
  "Peanuts",
  "Shellfish",
  "Pollen",
  "Dust Mites",
  "Eggs",
];

export const ATTENDING_PHYSICIANS = [
  "Dr. Karim Awad",
  "Dr. Hala Ibrahim",
  "Dr. Rami Farouk",
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] =
  [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Credit / Debit Card" },
    { value: "insurance", label: "Insurance" },
    { value: "transfer", label: "Bank Transfer" },
  ];

const patientsSeed: Patient[] = [
  {
    id: "pat-amani-youssef",
    firstName: "Amani",
    lastName: "Youssef",
    gender: "female",
    birthDate: "1988-02-14",
    age: calculateAge("1988-02-14"),
    contact: {
      phone: "0771234567",
      email: "amani.youssef@example.com",
      address: "Khalda, Amman",
      emergencyContactName: "Karim Youssef",
      emergencyContactPhone: "0771234567",
    },
    chronicConditions: ["Hypertension", "Asthma"],
    allergies: ["Penicillin"],
    notes: "Prefers evening appointments and follows DASH diet.",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "pat-omar-salem",
    firstName: "Omar",
    lastName: "Salem",
    gender: "male",
    birthDate: "1975-07-03",
    age: calculateAge("1975-07-03"),
    contact: {
      phone: "0798765432",
      email: "omar.salem@example.com",
      address: "8th circle, Amman",
      emergencyContactName: "Mona Salem",
      emergencyContactPhone: "0798765432",
    },
    chronicConditions: ["Diabetes", "Heart Disease"],
    allergies: ["Sulfa Drugs"],
    notes: "Uses insulin pump and monitors glucose twice daily.",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "pat-laila-hassan",
    firstName: "Laila",
    lastName: "Hassan",
    gender: "female",
    birthDate: "1994-11-22",
    age: calculateAge("1994-11-22"),
    contact: {
      phone: "0798765432",
      email: "laila.hassan@example.com",
      address: "Marj al hmam, Amman",
      emergencyContactName: "Hassan Abdelrahman",
      emergencyContactPhone: "0798765432",
    },
    chronicConditions: ["Thyroid Disorders"],
    allergies: [],
    notes: "On thyroid hormone replacement therapy.",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const visitsSeed: Visit[] = [
  {
    id: "visit-amani-1",
    patientId: "pat-amani-youssef",
    visitDate: "2025-10-12",
    reason: "Routine follow-up",
    complaints: ["Headache", "Shortness of Breath"],
    diagnoses: ["Hypertension"],
    notes: "Blood pressure elevated, adjust medication.",
    treatmentPlan:
      "Increase beta blocker dosage and schedule pulmonary function test.",
    followUpDate: "2025-11-10",
    vitals: {
      bloodPressure: "150/95",
      heartRate: "92 bpm",
      oxygenSaturation: "96%",
    },
    attendingPhysician: "Dr. Nour El Din",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "visit-omar-1",
    patientId: "pat-omar-salem",
    visitDate: "2025-09-28",
    reason: "Post surgery review",
    complaints: ["General Fatigue"],
    diagnoses: ["Heart Failure"],
    notes: "Recovery progressing, monitor cardiac rehab adherence.",
    treatmentPlan:
      "Continue medication, start light exercise with supervision.",
    followUpDate: "2025-12-01",
    vitals: {
      bloodPressure: "130/85",
      heartRate: "78 bpm",
    },
    attendingPhysician: "Dr. Karim Awad",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "visit-laila-1",
    patientId: "pat-laila-hassan",
    visitDate: "2025-11-05",
    reason: "New symptoms",
    complaints: ["Dizziness", "Fatigue"],
    diagnoses: ["Thyroid Disorders"],
    notes: "Adjust hormone replacement dosage.",
    treatmentPlan: "Update lab tests in 6 weeks and adjust medication.",
    followUpDate: "2025-12-20",
    vitals: {
      bloodPressure: "118/76",
      heartRate: "72 bpm",
    },
    attendingPhysician: "Dr. Hala Ibrahim",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const paymentsSeed: Payment[] = [
  {
    id: "pay-amani-1",
    patientId: "pat-amani-youssef",
    visitId: "visit-amani-1",
    amountDue: 1200,
    amountPaid: 800,
    method: "card",
    invoiceNumber: "INV-2025-1001",
    recordedAt: "2025-10-12T14:10:00.000Z",
    updatedAt: "2025-10-30T09:00:00.000Z",
    notes: "Insurance pending for remaining balance.",
  },
  {
    id: "pay-omar-1",
    patientId: "pat-omar-salem",
    visitId: "visit-omar-1",
    amountDue: 3500,
    amountPaid: 3500,
    method: "insurance",
    invoiceNumber: "INV-2025-1022",
    recordedAt: "2025-09-28T11:20:00.000Z",
    updatedAt: "2025-09-28T11:20:00.000Z",
    notes: "Covered under premium plan.",
  },
  {
    id: "pay-laila-1",
    patientId: "pat-laila-hassan",
    visitId: "visit-laila-1",
    amountDue: 650,
    amountPaid: 400,
    method: "cash",
    invoiceNumber: "INV-2025-1102",
    recordedAt: "2025-11-05T16:45:00.000Z",
    updatedAt: "2025-11-05T16:45:00.000Z",
    notes: "Patient will settle the rest next visit.",
  },
];

export const INITIAL_CLINIC_STATE: ClinicState = {
  patients: patientsSeed,
  visits: visitsSeed,
  payments: paymentsSeed,
};
