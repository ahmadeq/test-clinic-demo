import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import PageSeo from "@/components/utils/PageSeo";
import useClinic from "@/components/hooks/useClinic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CHRONIC_CONDITIONS, ALLERGIES } from "@/components/constants/clinic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { PopupModal } from "@/components/ui/popup-modal";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/text-area";
import { cn } from "@/lib/utils";
import type { Patient, Visit } from "@/components/types/clinic";

const genderOptions = [
  { label: "Female", value: "female" },
  { label: "Male", value: "male" },
] as const;

type GenderOptionValue = (typeof genderOptions)[number]["value"];

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatDateLabel = (isoDate?: string) => {
  if (!isoDate) {
    return "Not scheduled";
  }

  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const patientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["female", "male"]),
  birthDate: z.string().min(1, "Date of birth is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Enter a valid email address").optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  chronicConditions: z.array(z.string()),
  allergies: z.array(z.string()),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

type PatientSummary = {
  patient: Patient;
  outstandingBalance: number;
  lastVisitDate?: string;
  lastVisitReason?: string;
};

type UpcomingFollowUp = {
  visit: Visit;
  patient?: Patient;
  followUpDate: string;
};

export default function PatientsPage() {
  const { patients, visits, payments, addPatient, updateVisit } = useClinic();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"patients" | "follow-ups">(
    "patients"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [followUpSearch, setFollowUpSearch] = useState("");
  const [followUpStartDate, setFollowUpStartDate] = useState("");
  const [followUpEndDate, setFollowUpEndDate] = useState("");
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(
    null
  );
  const [editingFollowUpDate, setEditingFollowUpDate] = useState("");

  const defaultGender: GenderOptionValue = "female";

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: defaultGender,
      birthDate: "",
      phone: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      chronicConditions: [],
      allergies: [],
      notes: "",
    },
  });

  const closeModal = () => {
    setIsDialogOpen(false);
    form.reset();
  };

  const handleCreatePatient = (values: PatientFormValues) => {
    const result = addPatient({
      firstName: values.firstName,
      lastName: values.lastName,
      gender: values.gender,
      birthDate: values.birthDate,
      contact: {
        phone: values.phone,
        email: values.email?.trim() ? values.email : undefined,
        address: values.address?.trim() ? values.address : undefined,
        emergencyContactName: values.emergencyContactName?.trim()
          ? values.emergencyContactName
          : undefined,
        emergencyContactPhone: values.emergencyContactPhone?.trim()
          ? values.emergencyContactPhone
          : undefined,
      },
      chronicConditions: values.chronicConditions,
      allergies: values.allergies,
      notes: values.notes?.trim() ? values.notes : undefined,
    });

    toast.success(`Patient ${result.firstName} ${result.lastName} created.`);
    closeModal();
  };

  const pageTitle = "Patients";
  const pageDescription =
    "Review patient profiles, capture new registrations, and keep health history up to date.";

  const actions = (
    <Button
      type="button"
      onClick={() => {
        form.reset();
        setIsDialogOpen(true);
      }}
    >
      Add patient
    </Button>
  );

  const patientSummaries = useMemo<PatientSummary[]>(() => {
    return patients.map((patient) => {
      const patientVisits = visits
        .filter((visit) => visit.patientId === patient.id)
        .sort(
          (a, b) =>
            new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
        );
      const lastVisit = patientVisits[0];

      const patientPayments = payments.filter(
        (payment) => payment.patientId === patient.id
      );
      const outstandingBalance = patientPayments.reduce(
        (total, payment) => total + (payment.amountDue - payment.amountPaid),
        0
      );

      return {
        patient,
        outstandingBalance,
        lastVisitDate: lastVisit?.visitDate,
        lastVisitReason: lastVisit?.reason,
      };
    });
  }, [patients, visits, payments]);

  const filteredPatients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return patientSummaries.filter(({ patient }) => {
      const matchesSearch = normalizedSearch
        ? [
            `${patient.firstName} ${patient.lastName}`,
            patient.contact.phone,
            patient.contact.email ?? "",
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;

      const matchesGender = genderFilter
        ? patient.gender === genderFilter
        : true;

      const matchesConditions = conditionFilter.length
        ? conditionFilter.every((condition) =>
            patient.chronicConditions.includes(condition)
          )
        : true;

      return matchesSearch && matchesGender && matchesConditions;
    });
  }, [patientSummaries, searchTerm, genderFilter, conditionFilter]);

  const upcomingFollowUps = useMemo<UpcomingFollowUp[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return visits
      .filter((visit) => visit.followUpDate)
      .map((visit) => {
        const patient = patients.find((entry) => entry.id === visit.patientId);
        return {
          visit,
          patient,
          followUpDate: visit.followUpDate!,
        };
      })
      .filter((item) => {
        if (!item.patient) {
          return false;
        }
        const followUpDate = new Date(item.followUpDate);
        followUpDate.setHours(0, 0, 0, 0);
        return followUpDate >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.followUpDate).getTime() -
          new Date(b.followUpDate).getTime()
      );
  }, [patients, visits]);

  const filteredFollowUps = useMemo(() => {
    const normalizedSearch = followUpSearch.trim().toLowerCase();
    const start = followUpStartDate ? new Date(followUpStartDate) : null;
    const end = followUpEndDate ? new Date(followUpEndDate) : null;
    if (start) {
      start.setHours(0, 0, 0, 0);
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return upcomingFollowUps.filter(({ patient, visit, followUpDate }) => {
      if (!patient) {
        return false;
      }

      const matchesSearch = normalizedSearch
        ? [
            `${patient.firstName} ${patient.lastName}`,
            visit.reason,
            visit.attendingPhysician ?? "",
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;

      const followUpDateObj = new Date(followUpDate);

      const matchesStart = start ? followUpDateObj >= start : true;
      const matchesEnd = end ? followUpDateObj <= end : true;

      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [followUpSearch, followUpStartDate, followUpEndDate, upcomingFollowUps]);

  const startEditingFollowUp = (visitId: string, currentDate?: string) => {
    setEditingFollowUpId(visitId);
    setEditingFollowUpDate(currentDate ?? "");
  };

  const cancelEditingFollowUp = () => {
    setEditingFollowUpId(null);
    setEditingFollowUpDate("");
  };

  const saveFollowUpDate = async () => {
    if (!editingFollowUpId) {
      return;
    }

    const trimmedDate = editingFollowUpDate.trim();
    if (!trimmedDate) {
      toast.error("Select a follow-up date before saving.");
      return;
    }

    const updated = updateVisit(editingFollowUpId, {
      followUpDate: trimmedDate,
    });

    if (updated) {
      toast.success("Follow-up date updated.");
    } else {
      toast.error("Unable to update follow-up date.");
    }

    cancelEditingFollowUp();
  };

  const clearFollowUpFilters = () => {
    setFollowUpSearch("");
    setFollowUpStartDate("");
    setFollowUpEndDate("");
  };

  return (
    <>
      <PageSeo
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/patients"
      />
      <DashboardLayout
        title="Patient Registry"
        description={pageDescription}
        actions={actions}
      >
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total patients
            </p>
            <p className="text-2xl font-semibold">{patients.length}</p>
            <p className="text-muted-foreground text-sm">
              Active records stored in the clinic system.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Average age
            </p>
            <p className="text-2xl font-semibold">
              {patients.length
                ? Math.round(
                    patients.reduce((acc, patient) => acc + patient.age, 0) /
                      patients.length
                  )
                : 0}
            </p>
            <p className="text-muted-foreground text-sm">
              Calculated across all registered patients.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Chronic conditions tracked
            </p>
            <p className="text-2xl font-semibold">
              {patients.reduce(
                (total, patient) => total + patient.chronicConditions.length,
                0
              )}
            </p>
            <p className="text-muted-foreground text-sm">
              Total number of condition entries recorded.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Outstanding balance
            </p>
            <p className="text-2xl font-semibold">
              {formatCurrency(
                filteredPatients.reduce(
                  (acc, summary) => acc + summary.outstandingBalance,
                  0
                )
              )}
            </p>
            <p className="text-muted-foreground text-sm">
              Aggregate of patient balances after payments.
            </p>
          </Card>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-border/60 bg-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab("patients")}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition",
                  activeTab === "patients"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Patient directory
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("follow-ups")}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition",
                  activeTab === "follow-ups"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Upcoming follow-ups
              </button>
            </div>
          </div>

          {activeTab === "patients" ? (
            <Card className="mt-6">
              <CardHeader className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Patient list</CardTitle>
                  <CardDescription>
                    Search, filter, and navigate to individual patient records.
                  </CardDescription>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    placeholder="Search by name, phone, or email"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <Select
                    value={genderFilter}
                    onChange={(event) => setGenderFilter(event.target.value)}
                  >
                    <option value="">All genders</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <MultiSelect
                    value={conditionFilter}
                    onChange={setConditionFilter}
                    options={CHRONIC_CONDITIONS.map((condition) => ({
                      value: condition,
                      label: condition,
                    }))}
                    placeholder="Filter by conditions"
                  />
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 pr-4">Patient</th>
                      <th className="pb-3 pr-4">Age</th>
                      <th className="pb-3 pr-4">Gender</th>
                      <th className="pb-3 pr-4">Phone</th>
                      <th className="pb-3 pr-4">Chronic conditions</th>
                      <th className="pb-3 pr-4">Last visit</th>
                      <th className="pb-3 pr-4 text-right">Balance</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPatients.length ? (
                      filteredPatients.map(
                        ({
                          patient,
                          outstandingBalance,
                          lastVisitDate,
                          lastVisitReason,
                        }) => (
                          <tr key={patient.id} className="align-top text-sm">
                            <td className="py-3 pr-4">
                              <div className="font-medium">
                                {patient.firstName} {patient.lastName}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {patient.contact.email ?? "No email"}
                              </div>
                            </td>
                            <td className="py-3 pr-4">{patient.age}</td>
                            <td className="py-3 pr-4 capitalize">
                              {patient.gender}
                            </td>
                            <td className="py-3 pr-4">
                              {patient.contact.phone}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-wrap gap-1">
                                {patient.chronicConditions.length ? (
                                  patient.chronicConditions.map((condition) => (
                                    <span
                                      key={condition}
                                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground"
                                    >
                                      {condition}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    None
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-sm text-muted-foreground">
                              {lastVisitDate ? (
                                <div>
                                  <p>
                                    {new Date(
                                      lastVisitDate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs">{lastVisitReason}</p>
                                </div>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-right font-medium">
                              {formatCurrency(outstandingBalance)}
                            </td>
                            <td className="py-3 text-right">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/patients/${patient.id}`}>
                                  View
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-6 text-center text-sm text-muted-foreground"
                        >
                          No patients found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6">
              <CardHeader className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Upcoming follow-ups</CardTitle>
                  <CardDescription>
                    Track scheduled follow-up visits and reschedule when needed.
                  </CardDescription>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,240px)_minmax(0,160px)_minmax(0,160px)_auto]">
                  <Input
                    placeholder="Search by patient, reason, or physician"
                    value={followUpSearch}
                    onChange={(event) => setFollowUpSearch(event.target.value)}
                  />
                  <Input
                    type="date"
                    value={followUpStartDate}
                    onChange={(event) =>
                      setFollowUpStartDate(event.target.value)
                    }
                  />
                  <Input
                    type="date"
                    value={followUpEndDate}
                    onChange={(event) => setFollowUpEndDate(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-self-start"
                    onClick={clearFollowUpFilters}
                  >
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 pr-4">Patient</th>
                      <th className="pb-3 pr-4">Follow-up date</th>
                      <th className="pb-3 pr-4">Visit reason</th>
                      <th className="pb-3 pr-4">Physician</th>
                      <th className="pb-3 pr-4">Last visit</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredFollowUps.length ? (
                      filteredFollowUps.map(
                        ({ patient, visit, followUpDate }) => {
                          if (!patient) {
                            return null;
                          }
                          const isEditing = editingFollowUpId === visit.id;
                          return (
                            <tr key={visit.id} className="align-top text-sm">
                              <td className="py-3 pr-4">
                                <div className="font-medium">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {patient.contact.phone}
                                </p>
                              </td>
                              <td className="py-3 pr-4">
                                {isEditing ? (
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Input
                                      type="date"
                                      value={editingFollowUpDate}
                                      onChange={(event) =>
                                        setEditingFollowUpDate(
                                          event.target.value
                                        )
                                      }
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={saveFollowUpDate}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelEditingFollowUp}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {formatDateLabel(followUpDate)}
                                    </span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-3 text-xs"
                                      onClick={() =>
                                        startEditingFollowUp(
                                          visit.id,
                                          visit.followUpDate
                                        )
                                      }
                                    >
                                      Reschedule
                                    </Button>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 pr-4">
                                <div className="font-medium">
                                  {visit.reason}
                                </div>
                                {visit.treatmentPlan ? (
                                  <p className="text-xs text-muted-foreground">
                                    {visit.treatmentPlan}
                                  </p>
                                ) : null}
                              </td>
                              <td className="py-3 pr-4">
                                {visit.attendingPhysician ?? "Not assigned"}
                              </td>
                              <td className="py-3 pr-4 text-sm text-muted-foreground">
                                {formatDateLabel(visit.visitDate)}
                              </td>
                              <td className="py-3 pr-0 text-right">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/patients/${patient.id}`}>
                                    View patient
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-center text-sm text-muted-foreground"
                        >
                          No upcoming follow-ups match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </section>
      </DashboardLayout>

      <PopupModal
        open={isDialogOpen}
        onClose={closeModal}
        title="Register new patient"
        description="Capture demographic, medical, and contact details for the new patient record."
      >
        <Form {...form}>
          <form
            className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto pr-2 md:grid-cols-2"
            onSubmit={form.handleSubmit(handleCreatePatient)}
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Select value={field.value} onChange={field.onChange}>
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input placeholder="Primary phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Home address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency contact name</FormLabel>
                  <FormControl>
                    <Input placeholder="Contact person" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency contact phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Contact number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chronicConditions"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Chronic conditions</FormLabel>
                  <FormDescription>
                    Select one or more conditions that apply to the patient.
                  </FormDescription>
                  <FormControl>
                    <MultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={CHRONIC_CONDITIONS.map((condition) => ({
                        value: condition,
                        label: condition,
                      }))}
                      placeholder="Select chronic conditions"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Allergies</FormLabel>
                  <FormDescription>
                    Choose relevant allergies to highlight during care.
                  </FormDescription>
                  <FormControl>
                    <MultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={ALLERGIES.map((allergy) => ({
                        value: allergy,
                        label: allergy,
                      }))}
                      placeholder="Select allergies"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Care notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Important notes about the patient"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end md:col-span-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">Create patient</Button>
            </div>
          </form>
        </Form>
      </PopupModal>
    </>
  );
}
