"use client";

import {
  createContext,
  useReducer,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  ClinicState,
  NewPatientInput,
  NewPaymentInput,
  NewVisitInput,
  Patient,
  Payment,
  UpdatePatientInput,
  UpdatePaymentInput,
  UpdateVisitInput,
  Visit,
} from "@/components/types/clinic";
import { INITIAL_CLINIC_STATE } from "@/components/constants/clinic";

const STORAGE_KEY = "clinic-state-v1";

type ClinicAction =
  | { type: "ADD_PATIENT"; payload: Patient }
  | { type: "UPDATE_PATIENT"; payload: Patient }
  | { type: "ADD_VISIT"; payload: Visit }
  | { type: "UPDATE_VISIT"; payload: Visit }
  | { type: "ADD_PAYMENT"; payload: Payment }
  | { type: "UPDATE_PAYMENT"; payload: Payment };

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

const sanitizeContact = (contact: Patient["contact"]): Patient["contact"] => ({
  phone: contact.phone,
  email: contact.email?.trim() ? contact.email : undefined,
  address: contact.address?.trim() ? contact.address : undefined,
  emergencyContactName: contact.emergencyContactName?.trim()
    ? contact.emergencyContactName
    : undefined,
  emergencyContactPhone: contact.emergencyContactPhone?.trim()
    ? contact.emergencyContactPhone
    : undefined,
});

const createId = (prefix: string) => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

const clinicReducer = (
  state: ClinicState,
  action: ClinicAction
): ClinicState => {
  switch (action.type) {
    case "ADD_PATIENT":
      return { ...state, patients: [...state.patients, action.payload] };
    case "UPDATE_PATIENT":
      return {
        ...state,
        patients: state.patients.map((patient) =>
          patient.id === action.payload.id ? action.payload : patient
        ),
      };
    case "ADD_VISIT":
      return { ...state, visits: [...state.visits, action.payload] };
    case "UPDATE_VISIT":
      return {
        ...state,
        visits: state.visits.map((visit) =>
          visit.id === action.payload.id ? action.payload : visit
        ),
      };
    case "ADD_PAYMENT":
      return { ...state, payments: [...state.payments, action.payload] };
    case "UPDATE_PAYMENT":
      return {
        ...state,
        payments: state.payments.map((payment) =>
          payment.id === action.payload.id ? action.payload : payment
        ),
      };
    default:
      return state;
  }
};

const loadInitialState = (): ClinicState => {
  if (typeof window === "undefined") {
    return INITIAL_CLINIC_STATE;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return INITIAL_CLINIC_STATE;
    }

    const parsed = JSON.parse(stored) as ClinicState;
    return {
      ...parsed,
      patients: parsed.patients.map((patient) => ({
        ...patient,
        age: calculateAge(patient.birthDate),
        contact: sanitizeContact(patient.contact),
      })),
      visits: parsed.visits,
      payments: parsed.payments,
    };
  } catch (error) {
    console.error("Failed to load clinic state from localStorage", error);
    return INITIAL_CLINIC_STATE;
  }
};

export interface ClinicContextValue extends ClinicState {
  addPatient: (data: NewPatientInput) => Patient;
  updatePatient: (id: string, data: UpdatePatientInput) => Patient | undefined;
  addVisit: (data: NewVisitInput) => Visit;
  updateVisit: (id: string, data: UpdateVisitInput) => Visit | undefined;
  addPayment: (data: NewPaymentInput) => Payment;
  updatePayment: (id: string, data: UpdatePaymentInput) => Payment | undefined;
}

export const ClinicContext = createContext<ClinicContextValue | null>(null);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    clinicReducer,
    INITIAL_CLINIC_STATE,
    loadInitialState
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addPatient = useCallback((data: NewPatientInput) => {
    const timestamp = new Date().toISOString();
    const patient: Patient = {
      ...data,
      id: createId("pat"),
      age: calculateAge(data.birthDate),
      contact: sanitizeContact(data.contact),
      chronicConditions: [...data.chronicConditions],
      allergies: [...data.allergies],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    dispatch({ type: "ADD_PATIENT", payload: patient });
    return patient;
  }, []);

  const updatePatient = useCallback(
    (id: string, data: UpdatePatientInput) => {
      const existing = state.patients.find((patient) => patient.id === id);
      if (!existing) {
        return undefined;
      }

      const timestamp = new Date().toISOString();
      const mergedContact = data.contact
        ? sanitizeContact({ ...existing.contact, ...data.contact })
        : existing.contact;

      const updatedPatient: Patient = {
        ...existing,
        ...data,
        contact: mergedContact,
        chronicConditions:
          data.chronicConditions !== undefined
            ? [...data.chronicConditions]
            : existing.chronicConditions,
        allergies:
          data.allergies !== undefined
            ? [...data.allergies]
            : existing.allergies,
        birthDate: data.birthDate ?? existing.birthDate,
        age: data.birthDate ? calculateAge(data.birthDate) : existing.age,
        updatedAt: timestamp,
      };

      dispatch({ type: "UPDATE_PATIENT", payload: updatedPatient });
      return updatedPatient;
    },
    [state.patients]
  );

  const addVisit = useCallback((data: NewVisitInput) => {
    const timestamp = new Date().toISOString();
    const visit: Visit = {
      ...data,
      id: createId("visit"),
      vitals: data.vitals ?? {},
      complaints: [...data.complaints],
      diagnoses: [...data.diagnoses],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    dispatch({ type: "ADD_VISIT", payload: visit });
    return visit;
  }, []);

  const updateVisit = useCallback(
    (id: string, data: UpdateVisitInput) => {
      const existing = state.visits.find((visit) => visit.id === id);
      if (!existing) {
        return undefined;
      }

      const timestamp = new Date().toISOString();
      const updatedVisit: Visit = {
        ...existing,
        ...data,
        complaints: data.complaints
          ? [...data.complaints]
          : existing.complaints,
        diagnoses: data.diagnoses ? [...data.diagnoses] : existing.diagnoses,
        vitals: data.vitals
          ? { ...existing.vitals, ...data.vitals }
          : existing.vitals,
        updatedAt: timestamp,
      };

      dispatch({ type: "UPDATE_VISIT", payload: updatedVisit });
      return updatedVisit;
    },
    [state.visits]
  );

  const addPayment = useCallback((data: NewPaymentInput) => {
    const timestamp = new Date().toISOString();
    const payment: Payment = {
      ...data,
      id: createId("pay"),
      recordedAt: timestamp,
      updatedAt: timestamp,
    };

    dispatch({ type: "ADD_PAYMENT", payload: payment });
    return payment;
  }, []);

  const updatePayment = useCallback(
    (id: string, data: UpdatePaymentInput) => {
      const existing = state.payments.find((payment) => payment.id === id);
      if (!existing) {
        return undefined;
      }

      const timestamp = new Date().toISOString();
      const updatedPayment: Payment = {
        ...existing,
        ...data,
        amountPaid: data.amountPaid ?? existing.amountPaid,
        amountDue: data.amountDue ?? existing.amountDue,
        method: data.method ?? existing.method,
        notes: data.notes ?? existing.notes,
        invoiceNumber: data.invoiceNumber ?? existing.invoiceNumber,
        updatedAt: timestamp,
      };

      dispatch({ type: "UPDATE_PAYMENT", payload: updatedPayment });
      return updatedPayment;
    },
    [state.payments]
  );

  const value = useMemo(
    () => ({
      ...state,
      addPatient,
      updatePatient,
      addVisit,
      updateVisit,
      addPayment,
      updatePayment,
    }),
    [
      state,
      addPatient,
      updatePatient,
      addVisit,
      updateVisit,
      addPayment,
      updatePayment,
    ]
  );

  return (
    <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
  );
}
