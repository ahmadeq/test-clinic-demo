"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageSeo from "@/components/utils/PageSeo";
import useClinic from "@/components/hooks/useClinic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/text-area";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
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
import {
  COMMON_COMPLAINTS,
  DISEASES,
  PAYMENT_METHOD_OPTIONS,
  ATTENDING_PHYSICIANS,
} from "@/components/constants/clinic";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-JO", {
    style: "currency",
    currency: "JOD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

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
    "border border-sky-500/30 bg-sky-500/15 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
  warning:
    "border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
  destructive:
    "border border-red-500/30 bg-red-500/15 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  muted: "border border-border/60 bg-muted text-muted-foreground",
};

const visitFormSchema = z.object({
  visitDate: z.string().min(1, "Visit date is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  complaints: z.array(z.string()).min(1, "Select at least one complaint"),
  diagnoses: z.array(z.string()).min(1, "Select at least one diagnosis"),
  treatmentPlan: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  followUpDate: z.string().optional().or(z.literal("")),
  attendingPhysician: z.string().optional().or(z.literal("")),
  bloodPressure: z.string().optional().or(z.literal("")),
  heartRate: z.string().optional().or(z.literal("")),
  temperature: z.string().optional().or(z.literal("")),
  oxygenSaturation: z.string().optional().or(z.literal("")),
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

const paymentFormSchema = z
  .object({
    visitId: z.string().optional().or(z.literal("")),
    amountDue: z.coerce
      .number()
      .positive("Amount due must be greater than zero"),
    amountPaid: z.coerce.number().min(0, "Amount paid cannot be negative"),
    method: z.enum(["cash", "card", "insurance", "transfer"]),
    invoiceNumber: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.amountPaid <= data.amountDue, {
    path: ["amountPaid"],
    message: "Paid amount cannot exceed amount due",
  });

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function PatientDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const patientId = Array.isArray(id) ? id[0] : id;

  const { patients, visits, payments, addVisit, addPayment, updateVisit } =
    useClinic();

  const patient = patients.find((entry) => entry.id === patientId);

  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingFollowUpVisitId, setEditingFollowUpVisitId] = useState<
    string | null
  >(null);
  const [editingFollowUpDate, setEditingFollowUpDate] = useState("");

  const createVisitFormDefaults = (): VisitFormValues => ({
    visitDate: "",
    reason: "",
    complaints: [],
    diagnoses: [],
    treatmentPlan: "",
    notes: "",
    followUpDate: "",
    attendingPhysician: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    oxygenSaturation: "",
  });

  const createPaymentFormDefaults = (): PaymentFormValues => ({
    visitId: "",
    amountDue: 0,
    amountPaid: 0,
    method: "cash",
    invoiceNumber: "",
    notes: "",
  });

  const visitForm = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema) as Resolver<VisitFormValues>,
    defaultValues: createVisitFormDefaults(),
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema) as Resolver<PaymentFormValues>,
    defaultValues: createPaymentFormDefaults(),
  });

  const closeVisitModal = () => {
    setIsVisitDialogOpen(false);
    visitForm.reset(createVisitFormDefaults());
  };

  const closePaymentModal = () => {
    setIsPaymentDialogOpen(false);
    paymentForm.reset(createPaymentFormDefaults());
  };

  const patientVisits = useMemo(
    () =>
      visits
        .filter((visit) => visit.patientId === patientId)
        .sort(
          (a, b) =>
            new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
        ),
    [visits, patientId]
  );

  const upcomingFollowUp = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entries = patientVisits
      .filter((visit) => visit.followUpDate)
      .map((visit) => ({
        visit,
        followUpDate: visit.followUpDate!,
      }))
      .filter(({ followUpDate }) => {
        const date = new Date(followUpDate);
        date.setHours(0, 0, 0, 0);
        return date >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.followUpDate).getTime() -
          new Date(b.followUpDate).getTime()
      );

    return entries[0];
  }, [patientVisits]);

  const upcomingFollowUpStatus = upcomingFollowUp
    ? getFollowUpStatus(upcomingFollowUp.followUpDate)
    : null;

  const patientPayments = useMemo(
    () =>
      payments
        .filter((payment) => payment.patientId === patientId)
        .sort(
          (a, b) =>
            new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        ),
    [payments, patientId]
  );

  const totalBilled = patientPayments.reduce(
    (acc, payment) => acc + payment.amountDue,
    0
  );
  const totalPaid = patientPayments.reduce(
    (acc, payment) => acc + Math.min(payment.amountPaid, payment.amountDue),
    0
  );
  const outstandingBalance = patientPayments.reduce(
    (acc, payment) => acc + Math.max(payment.amountDue - payment.amountPaid, 0),
    0
  );

  const actions = patient ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        type="button"
        onClick={() => setIsVisitDialogOpen(true)}
      >
        Add visit
      </Button>
      <Button type="button" onClick={() => setIsPaymentDialogOpen(true)}>
        Record payment
      </Button>
    </div>
  ) : undefined;

  if (!patientId) {
    return null;
  }

  if (!patient) {
    return (
      <>
        <PageSeo
          title="Patient not found"
          description="The patient you are looking for does not exist."
          canonicalPath={`/patients/${patientId}`}
        />
        <DashboardLayout title="Patient details">
          <Card>
            <CardHeader>
              <CardTitle>Patient not found</CardTitle>
              <CardDescription>
                We could not locate a patient record with the provided
                identifier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/patients">Back to patients</Link>
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      </>
    );
  }

  const pageTitle = `${patient.firstName} ${patient.lastName}`;
  const pageDescription = `Manage clinical records, visits, and payment history for ${patient.firstName}.`;

  const handleCreateVisit = (values: VisitFormValues) => {
    const visit = addVisit({
      patientId: patient.id,
      visitDate: values.visitDate,
      reason: values.reason,
      complaints: values.complaints,
      diagnoses: values.diagnoses,
      treatmentPlan: values.treatmentPlan?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      followUpDate: values.followUpDate?.trim() || undefined,
      attendingPhysician: values.attendingPhysician?.trim() || undefined,
      vitals: {
        bloodPressure: values.bloodPressure?.trim() || undefined,
        heartRate: values.heartRate?.trim() || undefined,
        temperature: values.temperature?.trim() || undefined,
        oxygenSaturation: values.oxygenSaturation?.trim() || undefined,
      },
    });

    toast.success(
      `Visit on ${visit.visitDate} added for ${patient.firstName}.`
    );
    closeVisitModal();
  };

  const handleRecordPayment = (values: PaymentFormValues) => {
    const payment = addPayment({
      patientId: patient.id,
      visitId: values.visitId?.trim() ? values.visitId : undefined,
      amountDue: values.amountDue,
      amountPaid: values.amountPaid,
      method: values.method,
      invoiceNumber: values.invoiceNumber?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });

    toast.success(`Payment ${payment.invoiceNumber ?? payment.id} recorded.`);
    closePaymentModal();
  };

  const startRescheduleFollowUp = (visitId: string, currentDate?: string) => {
    setEditingFollowUpVisitId(visitId);
    setEditingFollowUpDate(currentDate ?? "");
  };

  const cancelRescheduleFollowUp = () => {
    setEditingFollowUpVisitId(null);
    setEditingFollowUpDate("");
  };

  const saveRescheduledFollowUp = () => {
    if (!editingFollowUpVisitId) {
      return;
    }

    const trimmedDate = editingFollowUpDate.trim();
    if (!trimmedDate) {
      toast.error("Select a follow-up date before saving.");
      return;
    }

    const updated = updateVisit(editingFollowUpVisitId, {
      followUpDate: trimmedDate,
    });

    if (updated) {
      toast.success("Follow-up date updated.");
    } else {
      toast.error("Unable to update follow-up date.");
    }

    cancelRescheduleFollowUp();
  };

  return (
    <>
      <PageSeo
        title={pageTitle}
        description={pageDescription}
        canonicalPath={`/patients/${patient.id}`}
      />
      <DashboardLayout
        title={pageTitle}
        description={pageDescription}
        actions={actions}
      >
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Patient overview</CardTitle>
              <CardDescription>
                Demographics and essential health information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <section className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
                <header className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Identity & contact
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Core profile details for quick reference.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Age {patient.age}
                  </span>
                </header>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gender
                    </p>
                    <p className="text-base font-medium capitalize">
                      {patient.gender}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Phone
                    </p>
                    <p className="text-base font-medium">
                      {patient.contact.phone}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>
                    <p className="text-base font-medium">
                      {patient.contact.email ?? "No email on file"}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Address
                    </p>
                    <p className="text-base font-medium">
                      {patient.contact.address ?? "No address provided"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
                  <header>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Emergency contact
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Reach out when the patient cannot respond.
                    </p>
                  </header>
                  <div>
                    <p className="text-base font-medium">
                      {patient.contact.emergencyContactName ?? "Not provided"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {patient.contact.emergencyContactPhone ?? ""}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
                  <header>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Care notes
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Quick reminders for the care team.
                    </p>
                  </header>
                  <p className="text-sm text-muted-foreground">
                    {patient.notes ?? "No additional notes provided."}
                  </p>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
                  <header>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Chronic conditions
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Long-term diagnoses noted in the record.
                    </p>
                  </header>
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
                      <span className="text-sm text-muted-foreground">
                        None reported
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
                  <header>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Allergies
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Reactions to keep top of mind during treatment.
                    </p>
                  </header>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.length ? (
                      patient.allergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                        >
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No allergies recorded
                      </span>
                    )}
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Upcoming follow-up</CardTitle>
                <CardDescription>
                  Keep track of the next scheduled visit and adjust the date as
                  needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingFollowUp ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {formatDate(upcomingFollowUp.followUpDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {upcomingFollowUp.visit.attendingPhysician
                            ? `With ${upcomingFollowUp.visit.attendingPhysician}`
                            : "Physician not assigned"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          upcomingFollowUpStatus
                            ? followUpToneClasses[upcomingFollowUpStatus.tone]
                            : ""
                        }`}
                      >
                        {upcomingFollowUpStatus?.label}
                      </span>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Visit reason
                      </p>
                      <p className="text-sm text-foreground">
                        {upcomingFollowUp.visit.reason}
                      </p>
                      {upcomingFollowUp.visit.treatmentPlan ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {upcomingFollowUp.visit.treatmentPlan}
                        </p>
                      ) : null}
                    </div>

                    {editingFollowUpVisitId === upcomingFollowUp.visit.id ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Input
                          type="date"
                          value={editingFollowUpDate}
                          onChange={(event) =>
                            setEditingFollowUpDate(event.target.value)
                          }
                          className="sm:max-w-xs"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveRescheduledFollowUp}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={cancelRescheduleFollowUp}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            startRescheduleFollowUp(
                              upcomingFollowUp.visit.id,
                              upcomingFollowUp.visit.followUpDate
                            )
                          }
                        >
                          Reschedule
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Last updated{" "}
                          {formatDateTime(upcomingFollowUp.visit.updatedAt)}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                    No upcoming follow-ups scheduled yet. Add a new visit or
                    update an existing one to set the next touchpoint.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 shadow-sm">
              <CardHeader>
                <CardTitle>Financial summary</CardTitle>
                <CardDescription>
                  Charges and payments associated with this patient.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/80 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Total billed
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Lifetime invoices raised
                      </p>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatCurrency(totalBilled)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                        Total collected
                      </p>
                      <p className="text-sm text-emerald-700/80">
                        Payments received to date
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-emerald-600">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                        Outstanding balance
                      </p>
                      <p className="text-sm text-amber-700/80">
                        Remaining amount to collect
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-amber-600">
                      {formatCurrency(outstandingBalance)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Figures include every recorded payment and invoice linked to
                  this patient.
                </p>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="mt-8">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Visit history</CardTitle>
                <CardDescription>
                  Clinical encounters and treatment notes associated with this
                  patient.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsVisitDialogOpen(true)}
              >
                Add visit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientVisits.length ? (
                patientVisits.map((visit) => (
                  <article
                    key={visit.id}
                    className="rounded-lg border bg-card p-4 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">
                          {formatDate(visit.visitDate)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {visit.reason}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Recorded {formatDateTime(visit.createdAt)}</p>
                        {visit.followUpDate ? (
                          <p className="font-medium text-foreground">
                            Follow-up {formatDate(visit.followUpDate)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Diagnoses
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {visit.diagnoses.map((diagnosis) => (
                            <span
                              key={diagnosis}
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                            >
                              {diagnosis}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Chief complaints
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {visit.complaints.map((complaint) => (
                            <span
                              key={complaint}
                              className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground"
                            >
                              {complaint}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Treatment plan
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {visit.treatmentPlan ??
                            "No treatment plan documented."}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Visit notes
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {visit.notes ?? "No additional notes recorded."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Blood pressure
                        </p>
                        <p className="text-sm font-medium">
                          {visit.vitals.bloodPressure ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Heart rate
                        </p>
                        <p className="text-sm font-medium">
                          {visit.vitals.heartRate ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Temperature
                        </p>
                        <p className="text-sm font-medium">
                          {visit.vitals.temperature ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Oxygen saturation
                        </p>
                        <p className="text-sm font-medium">
                          {visit.vitals.oxygenSaturation ?? "-"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No visits recorded yet. Start by adding the first visit for
                  this patient.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Payment history</CardTitle>
                <CardDescription>
                  Invoice records and payment activity for this patient.
                </CardDescription>
              </div>
              <Button
                size="sm"
                type="button"
                onClick={() => setIsPaymentDialogOpen(true)}
              >
                Record payment
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Invoice</th>
                    <th className="pb-3 pr-4">Visit</th>
                    <th className="pb-3 pr-4">Amount due</th>
                    <th className="pb-3 pr-4">Amount paid</th>
                    <th className="pb-3 pr-4">Method</th>
                    <th className="pb-3 pr-4">Recorded</th>
                    <th className="pb-3">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patientPayments.length ? (
                    patientPayments.map((payment) => {
                      const balance = Math.max(
                        payment.amountDue - payment.amountPaid,
                        0
                      );
                      const linkedVisit = patientVisits.find(
                        (visit) => visit.id === payment.visitId
                      );
                      return (
                        <tr key={payment.id}>
                          <td className="py-3 pr-4 font-medium">
                            {payment.invoiceNumber ?? payment.id}
                          </td>
                          <td className="py-3 pr-4">
                            {linkedVisit
                              ? formatDate(linkedVisit.visitDate)
                              : "-"}
                          </td>
                          <td className="py-3 pr-4">
                            {formatCurrency(payment.amountDue)}
                          </td>
                          <td className="py-3 pr-4 text-emerald-600">
                            {formatCurrency(payment.amountPaid)}
                          </td>
                          <td className="py-3 pr-4 capitalize">
                            {payment.method}
                          </td>
                          <td className="py-3 pr-4">
                            {formatDateTime(payment.recordedAt)}
                          </td>
                          <td className="py-3 font-medium text-amber-600">
                            {formatCurrency(balance)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        No payment records found for this patient yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      </DashboardLayout>

      <PopupModal
        open={isVisitDialogOpen}
        onClose={closeVisitModal}
        title="Log patient visit"
        description="Document complaints, diagnoses, and treatment plans for this clinical encounter."
        className="max-w-3xl"
      >
        <Form {...visitForm}>
          <form
            className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto pr-2"
            onSubmit={visitForm.handleSubmit(handleCreateVisit)}
          >
            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Scheduling details
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Set the appointment timing and attending provider.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={visitForm.control}
                  name="visitDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={visitForm.control}
                  name="attendingPhysician"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attending physician</FormLabel>
                      <FormControl>
                        <Select value={field.value} onChange={field.onChange}>
                          <option value="">Assign physician</option>
                          {ATTENDING_PHYSICIANS.map((physician) => (
                            <option key={physician} value={physician}>
                              {physician}
                            </option>
                          ))}
                        </Select>
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
                  Vitals
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Log key measurements captured during the visit.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={visitForm.control}
                  name="bloodPressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood pressure</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 120/80" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={visitForm.control}
                  name="heartRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heart rate</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 76 bpm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={visitForm.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 37.2°C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={visitForm.control}
                  name="oxygenSaturation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oxygen saturation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 98%" {...field} />
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
                  Visit context
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Document the primary reason and presenting complaints.
                </p>
              </div>
              <div className="grid gap-4">
                <FormField
                  control={visitForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit reason</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Chief reason for visit"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={visitForm.control}
                  name="complaints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaints</FormLabel>
                      <FormDescription>
                        Select all presenting complaints for this visit.
                      </FormDescription>
                      <FormControl>
                        <MultiSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={COMMON_COMPLAINTS.map((complaint) => ({
                            value: complaint,
                            label: complaint,
                          }))}
                          placeholder="Select complaints"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={visitForm.control}
                  name="diagnoses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnoses</FormLabel>
                      <FormDescription>
                        Select the conditions identified during the visit.
                      </FormDescription>
                      <FormControl>
                        <MultiSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={DISEASES.map((disease) => ({
                            value: disease,
                            label: disease,
                          }))}
                          placeholder="Select diagnoses"
                        />
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
                  Care plan & notes
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Capture treatment guidance and supporting notes.
                </p>
              </div>
              <div className="grid gap-4">
                <FormField
                  control={visitForm.control}
                  name="treatmentPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment plan</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Prescribed treatment and follow-up instructions"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={visitForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical notes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Additional remarks about the visit"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={visitForm.control}
                  name="followUpDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeVisitModal}>
                Cancel
              </Button>
              <Button type="submit">Save visit</Button>
            </div>
          </form>
        </Form>
      </PopupModal>

      <PopupModal
        open={isPaymentDialogOpen}
        onClose={closePaymentModal}
        title="Record payment"
        description="Log incoming payments and optionally connect them to a visit invoice."
        className="max-w-xl"
      >
        <Form {...paymentForm}>
          <form
            className="flex flex-col gap-6"
            onSubmit={paymentForm.handleSubmit(handleRecordPayment)}
          >
            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Invoice association
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Optionally connect this payment to a specific visit.
                </p>
              </div>
              <FormField
                control={paymentForm.control}
                name="visitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related visit</FormLabel>
                    <FormControl>
                      <Select value={field.value} onChange={field.onChange}>
                        <option value="">Not linked</option>
                        {patientVisits.map((visit) => (
                          <option key={visit.id} value={visit.id}>
                            {`${formatDate(visit.visitDate)} · ${visit.reason}`}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Payment amounts
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Record what was billed and what was collected.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={paymentForm.control}
                  name="amountDue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount due (JOD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={field.value ?? 0}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number(event.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount paid (JOD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={field.value ?? 0}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number(event.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={paymentForm.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment method</FormLabel>
                    <FormControl>
                      <Select value={field.value} onChange={field.onChange}>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
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
            </section>

            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Documentation
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Add invoice references or supporting notes.
                </p>
              </div>
              <FormField
                control={paymentForm.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional invoice reference"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Add clarifying payment notes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closePaymentModal}
              >
                Cancel
              </Button>
              <Button type="submit">Save payment</Button>
            </div>
          </form>
        </Form>
      </PopupModal>
    </>
  );
}
