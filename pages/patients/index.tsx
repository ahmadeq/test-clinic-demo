import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Filter,
  Plus,
  RefreshCcw,
  Search,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
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
  currency: "JOD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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

const getFollowUpStatus = (isoDate?: string) => {
  if (!isoDate) {
    return {
      label: "No date set",
      tone: "muted" as const,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);

  const msInDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((target.getTime() - today.getTime()) / msInDay);

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)} day${diffDays === -1 ? "" : "s"} overdue`,
      tone: "destructive" as const,
    };
  }

  if (diffDays === 0) {
    return {
      label: "Due today",
      tone: "warning" as const,
    };
  }

  if (diffDays <= 3) {
    return {
      label: "Due soon",
      tone: "warning" as const,
    };
  }

  if (diffDays <= 7) {
    return {
      label: "Next 7 days",
      tone: "accent" as const,
    };
  }

  return {
    label: `In ${diffDays} days`,
    tone: "muted" as const,
  };
};

const followUpToneClasses: Record<
  ReturnType<typeof getFollowUpStatus>["tone"],
  string
> = {
  accent:
    "bg-sky-500/15 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300 border border-sky-500/30",
  warning:
    "bg-amber-500/15 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/30",
  destructive:
    "bg-red-500/15 text-red-600 dark:bg-red-500/10 dark:text-red-300 border border-red-500/30",
  muted: "bg-muted text-muted-foreground border border-border/60",
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
      className="gap-2"
      onClick={() => {
        form.reset();
        setIsDialogOpen(true);
      }}
    >
      <Plus className="size-4" aria-hidden="true" />
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

  const outstandingBalanceTotal = useMemo(
    () =>
      filteredPatients.reduce(
        (acc, summary) => acc + summary.outstandingBalance,
        0
      ),
    [filteredPatients]
  );

  const averageAge = useMemo(() => {
    if (!patients.length) {
      return 0;
    }

    const totalAge = patients.reduce((acc, patient) => acc + patient.age, 0);
    return Math.round(totalAge / patients.length);
  }, [patients]);

  const conditionsTracked = useMemo(() => {
    const set = new Set<string>();
    patients.forEach((patient) => {
      patient.chronicConditions.forEach((condition) => set.add(condition));
    });
    return set.size;
  }, [patients]);

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

  const followUpsNextSevenDays = useMemo(
    () =>
      upcomingFollowUps.filter((entry) => {
        const status = getFollowUpStatus(entry.followUpDate);
        return status.tone === "warning" || status.tone === "accent";
      }).length,
    [upcomingFollowUps]
  );

  const overdueFollowUps = useMemo(
    () =>
      upcomingFollowUps.filter(
        (entry) => getFollowUpStatus(entry.followUpDate).tone === "destructive"
      ).length,
    [upcomingFollowUps]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) {
      count += 1;
    }
    if (genderFilter) {
      count += 1;
    }
    if (conditionFilter.length) {
      count += 1;
    }
    return count;
  }, [searchTerm, genderFilter, conditionFilter]);

  const hasPatientFilters = activeFiltersCount > 0;

  const overviewStats = useMemo(
    () => [
      {
        label: "Total patients",
        value: patients.length.toLocaleString(),
        description: "Active records in your registry.",
        icon: Users,
        accent:
          "bg-sky-500/15 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
      },
      {
        label: "Average age",
        value: `${averageAge}`,
        description: "Across all registered patients.",
        icon: Activity,
        accent:
          "bg-purple-500/15 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
      },
      {
        label: "Conditions tracked",
        value: conditionsTracked.toLocaleString(),
        description: "Unique chronic conditions recorded.",
        icon: Stethoscope,
        accent:
          "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
      },
      {
        label: "Upcoming follow-ups",
        value: upcomingFollowUps.length.toLocaleString(),
        description: `${followUpsNextSevenDays.toLocaleString()} due this week`,
        icon: CalendarCheck,
        accent:
          "bg-amber-500/15 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
      },
      {
        label: "Outstanding balance",
        value: formatCurrency(outstandingBalanceTotal),
        description: "Across filtered patients.",
        icon: Wallet,
        accent:
          "bg-rose-500/15 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
      },
    ],
    [
      averageAge,
      conditionsTracked,
      followUpsNextSevenDays,
      upcomingFollowUps.length,
      outstandingBalanceTotal,
      patients.length,
    ]
  );

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

  const clearPatientFilters = () => {
    setSearchTerm("");
    setGenderFilter("");
    setConditionFilter([]);
  };

  const hasFollowUpFilters = useMemo(
    () =>
      Boolean(followUpSearch.trim() || followUpStartDate || followUpEndDate),
    [followUpSearch, followUpStartDate, followUpEndDate]
  );

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
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
          {overviewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="group relative overflow-hidden border border-border/60 bg-gradient-to-br from-background via-background to-muted/60 p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="absolute inset-x-10 -top-24 h-32 rounded-full bg-muted/60 blur-3xl transition group-hover:scale-110" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border border-transparent",
                      stat.accent
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
              </Card>
            );
          })}
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
            <Card className="mt-6 border border-border/60 shadow-sm">
              <CardHeader className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">Patient directory</CardTitle>
                    <CardDescription>
                      Refine your view and jump into detailed records quickly.
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/60 bg-muted px-2.5 py-1 font-medium text-foreground/70">
                        {filteredPatients.length.toLocaleString()} shown
                      </span>
                      <span className="rounded-full border border-border/60 bg-muted px-2.5 py-1 font-medium text-foreground/60">
                        {patients.length.toLocaleString()} total
                      </span>
                      {hasPatientFilters ? (
                        <span className="flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                          <Filter className="size-3.5" aria-hidden="true" />
                          {activeFiltersCount} active filter
                          {activeFiltersCount === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {hasPatientFilters ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={clearPatientFilters}
                      >
                        <RefreshCcw className="size-4" aria-hidden="true" />
                        Clear filters
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,280px)_minmax(0,200px)_minmax(0,240px)]">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      className="h-11 rounded-xl border border-border/70 bg-background/90 pl-10 shadow-sm"
                      placeholder="Search by name, phone, or email"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Users
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Select
                      className="h-11 rounded-xl border border-border/70 bg-background/90 pl-9 shadow-sm"
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
                  </div>
                  <div className="relative">
                    <MultiSelect
                      value={conditionFilter}
                      onChange={setConditionFilter}
                      options={CHRONIC_CONDITIONS.map((condition) => ({
                        value: condition,
                        label: condition,
                      }))}
                      placeholder="Filter by conditions"
                      className="h-11 rounded-xl border border-border/70 bg-background/90 pl-9 shadow-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-hidden border-t border-border/60">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border/60 text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Patient</th>
                        <th className="px-4 py-3 text-left">Age</th>
                        <th className="px-4 py-3 text-left">Gender</th>
                        <th className="px-4 py-3 text-left">Phone</th>
                        <th className="px-4 py-3 text-left">
                          Chronic conditions
                        </th>
                        <th className="px-4 py-3 text-left">Last visit</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-background/60">
                      {filteredPatients.length ? (
                        filteredPatients.map(
                          ({
                            patient,
                            outstandingBalance,
                            lastVisitDate,
                            lastVisitReason,
                          }) => (
                            <tr
                              key={patient.id}
                              className="group align-top transition hover:bg-muted/40"
                            >
                              <td className="px-4 py-4">
                                <div className="font-medium">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {patient.contact.email ?? "No email"}
                                </div>
                              </td>
                              <td className="px-4 py-4">{patient.age}</td>
                              <td className="px-4 py-4 capitalize">
                                {patient.gender}
                              </td>
                              <td className="px-4 py-4">
                                <span className="font-medium text-foreground">
                                  {patient.contact.phone}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {patient.chronicConditions.length ? (
                                    patient.chronicConditions.map(
                                      (condition) => (
                                        <span
                                          key={condition}
                                          className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
                                        >
                                          {condition}
                                        </span>
                                      )
                                    )
                                  ) : (
                                    <span className="text-muted-foreground text-xs">
                                      None
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-muted-foreground">
                                {lastVisitDate ? (
                                  <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                      {new Date(
                                        lastVisitDate
                                      ).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs">{lastVisitReason}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs italic">
                                    No visits yet
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-right font-semibold">
                                {formatCurrency(outstandingBalance)}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  asChild
                                >
                                  <Link href={`/patients/${patient.id}`}>
                                    View profile
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
                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                          >
                            No patients match your filters yet.
                            <div className="mt-3 flex justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                                onClick={clearPatientFilters}
                              >
                                <RefreshCcw
                                  className="size-4"
                                  aria-hidden="true"
                                />
                                Reset filters
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6 border border-border/60 shadow-sm">
              <CardHeader className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">
                      Upcoming follow-ups
                    </CardTitle>
                    <CardDescription>
                      Track scheduled follow-up visits and reschedule when
                      needed.
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/60 bg-muted px-2.5 py-1 font-medium text-foreground/70">
                        {filteredFollowUps.length.toLocaleString()} scheduled
                      </span>
                      <span className="rounded-full border border-border/60 bg-muted px-2.5 py-1 font-medium text-foreground/60">
                        {overdueFollowUps.toLocaleString()} overdue
                      </span>
                      <span className="rounded-full border border-border/60 bg-muted px-2.5 py-1 font-medium text-foreground/60">
                        {followUpsNextSevenDays.toLocaleString()} due soon
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {hasFollowUpFilters ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={clearFollowUpFilters}
                      >
                        <RefreshCcw className="size-4" aria-hidden="true" />
                        Reset filters
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,280px)_minmax(0,200px)_minmax(0,200px)]">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      className="h-11 rounded-xl border border-border/70 bg-background/90 pl-10 shadow-sm"
                      placeholder="Search by patient, reason, or physician"
                      value={followUpSearch}
                      onChange={(event) =>
                        setFollowUpSearch(event.target.value)
                      }
                    />
                  </div>
                  <div className="relative">
                    <CalendarRange
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      type="date"
                      className="h-11 rounded-xl border border-border/70 bg-background/90 pl-9 shadow-sm"
                      value={followUpStartDate}
                      onChange={(event) =>
                        setFollowUpStartDate(event.target.value)
                      }
                    />
                  </div>
                  <div className="relative">
                    <CalendarDays
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      type="date"
                      className="h-11 rounded-xl border border-border/70 bg-background/90 pl-9 shadow-sm"
                      value={followUpEndDate}
                      onChange={(event) =>
                        setFollowUpEndDate(event.target.value)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-hidden border-t border-border/60">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border/60 text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Patient</th>
                        <th className="px-4 py-3 text-left">Follow-up date</th>
                        <th className="px-4 py-3 text-left">Visit reason</th>
                        <th className="px-4 py-3 text-left">Physician</th>
                        <th className="px-4 py-3 text-left">Last visit</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-background/60">
                      {filteredFollowUps.length ? (
                        filteredFollowUps.map(
                          ({ patient, visit, followUpDate }) => {
                            if (!patient) {
                              return null;
                            }
                            const isEditing = editingFollowUpId === visit.id;
                            const status = getFollowUpStatus(followUpDate);
                            return (
                              <tr
                                key={visit.id}
                                className="align-top transition hover:bg-muted/40"
                              >
                                <td className="px-4 py-4">
                                  <div className="font-medium">
                                    {patient.firstName} {patient.lastName}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {patient.contact.phone}
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  {isEditing ? (
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <Input
                                        type="date"
                                        className="h-10"
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
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-foreground">
                                          {formatDateLabel(followUpDate)}
                                        </span>
                                        <span
                                          className={cn(
                                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                            followUpToneClasses[status.tone]
                                          )}
                                        >
                                          {status.label}
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-fit px-3 text-xs"
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
                                <td className="px-4 py-4">
                                  <div className="font-medium">
                                    {visit.reason}
                                  </div>
                                  {visit.treatmentPlan ? (
                                    <p className="text-xs text-muted-foreground">
                                      {visit.treatmentPlan}
                                    </p>
                                  ) : null}
                                </td>
                                <td className="px-4 py-4">
                                  {visit.attendingPhysician ?? "Not assigned"}
                                </td>
                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                  {formatDateLabel(visit.visitDate)}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    asChild
                                  >
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
                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                          >
                            No upcoming follow-ups match your filters.
                            <div className="mt-3 flex justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                                onClick={clearFollowUpFilters}
                              >
                                <RefreshCcw
                                  className="size-4"
                                  aria-hidden="true"
                                />
                                Reset filters
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
            className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto pr-2"
            onSubmit={form.handleSubmit(handleCreatePatient)}
          >
            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Personal information
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Capture demographic details to populate the patient record.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Contact details
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Ensure we can reach the patient directly for follow-ups.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Emergency contact
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Provide someone to contact if the patient cannot respond.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact name</FormLabel>
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
                      <FormLabel>Contact phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Medical profile
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Highlight allergies, chronic conditions, and key notes.
                </p>
              </div>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="chronicConditions"
                  render={({ field }) => (
                    <FormItem>
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
                    <FormItem>
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
                    <FormItem>
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
              </div>
            </section>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
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
