export type Gender = "male" | "female";

export type PaymentMethod = "cash" | "card" | "insurance" | "transfer";

export interface PatientContact {
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  age: number;
  contact: PatientContact;
  chronicConditions: string[];
  allergies: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitVitals {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  visitDate: string;
  reason: string;
  complaints: string[];
  diagnoses: string[];
  notes?: string;
  treatmentPlan?: string;
  followUpDate?: string;
  vitals: VisitVitals;
  attendingPhysician?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  patientId: string;
  visitId?: string;
  amountDue: number;
  amountPaid: number;
  method: PaymentMethod;
  invoiceNumber?: string;
  recordedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ClinicState {
  patients: Patient[];
  visits: Visit[];
  payments: Payment[];
}

export type NewPatientInput = Omit<
  Patient,
  "id" | "createdAt" | "updatedAt" | "age"
>;

export type UpdatePatientInput = Partial<NewPatientInput>;

export type NewVisitInput = Omit<Visit, "id" | "createdAt" | "updatedAt">;

export type UpdateVisitInput = Partial<
  Omit<Visit, "id" | "patientId" | "createdAt" | "updatedAt">
>;

export type NewPaymentInput = Omit<Payment, "id" | "recordedAt" | "updatedAt">;

export type UpdatePaymentInput = Partial<
  Omit<Payment, "id" | "patientId" | "recordedAt">
>;
