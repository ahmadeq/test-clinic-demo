"use client";

import { useContext } from "react";
import { ClinicContext } from "@/components/context/ClinicContext";

export default function useClinic() {
  const context = useContext(ClinicContext);

  if (!context) {
    throw new Error("useClinic must be used within a ClinicProvider");
  }

  return context;
}
