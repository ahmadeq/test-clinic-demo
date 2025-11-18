import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/text-area";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PAYMENT_METHOD_OPTIONS } from "@/components/constants/clinic";
import type { Payment } from "@/components/types/clinic";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "JOD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type PaymentStatus = "paid" | "partial" | "pending";

const statusStyles: Record<PaymentStatus, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  pending: "bg-slate-200 text-slate-700",
};

const paymentFormSchema = z
  .object({
    patientId: z.string().trim().min(1, "Select a patient"),
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

const defaultFormValues: PaymentFormValues = {
  patientId: "",
  visitId: "",
  amountDue: 0,
  amountPaid: 0,
  method: "cash",
  invoiceNumber: "",
  notes: "",
};

const getPaymentStatus = (payment: Payment): PaymentStatus => {
  const balance = payment.amountDue - payment.amountPaid;
  if (balance <= 0) {
    return "paid";
  }
  if (payment.amountPaid === 0) {
    return "pending";
  }
  return "partial";
};

export default function PaymentsPage() {
  const { patients, visits, payments, addPayment, updatePayment } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema) as Resolver<PaymentFormValues>,
    defaultValues: defaultFormValues,
  });

  const watchedPatientId = form.watch("patientId");

  const paymentRows = useMemo(
    () =>
      payments
        .map((payment) => {
          const patient = patients.find(
            (entry) => entry.id === payment.patientId
          );
          const visit = visits.find((entry) => entry.id === payment.visitId);
          const balance = Math.max(payment.amountDue - payment.amountPaid, 0);
          const status = getPaymentStatus(payment);

          return {
            payment,
            patient,
            visit,
            balance,
            status,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.payment.recordedAt).getTime() -
            new Date(a.payment.recordedAt).getTime()
        ),
    [payments, patients, visits]
  );

  const filteredPayments = paymentRows.filter(
    ({ payment, patient, status }) => {
      const normalized = searchTerm.trim().toLowerCase();
      const matchesSearch = normalized
        ? [
            payment.invoiceNumber ?? "",
            payment.method,
            payment.notes ?? "",
            patient ? `${patient.firstName} ${patient.lastName}` : "",
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalized))
        : true;

      const matchesMethod = methodFilter
        ? payment.method === methodFilter
        : true;
      const matchesStatus = statusFilter ? status === statusFilter : true;

      const paymentDate = new Date(payment.recordedAt).setHours(0, 0, 0, 0);
      const isAfterStart = startDate
        ? paymentDate >= new Date(startDate).setHours(0, 0, 0, 0)
        : true;
      const isBeforeEnd = endDate
        ? paymentDate <= new Date(endDate).setHours(0, 0, 0, 0)
        : true;

      return (
        matchesSearch &&
        matchesMethod &&
        matchesStatus &&
        isAfterStart &&
        isBeforeEnd
      );
    }
  );

  const totals = filteredPayments.reduce(
    (acc, { payment, balance }) => {
      const collected = Math.min(payment.amountPaid, payment.amountDue);
      return {
        billed: acc.billed + payment.amountDue,
        collected: acc.collected + collected,
        outstanding: acc.outstanding + balance,
      };
    },
    { billed: 0, collected: 0, outstanding: 0 }
  );

  const collectionRate = totals.billed
    ? Math.round((totals.collected / totals.billed) * 100)
    : 0;

  const openDialogForCreate = () => {
    setEditingPaymentId(null);
    form.reset(defaultFormValues);
    setIsDialogOpen(true);
  };

  const openDialogForEdit = (entry: Payment) => {
    setEditingPaymentId(entry.id);
    form.reset({
      patientId: entry.patientId,
      visitId: entry.visitId ?? "",
      amountDue: entry.amountDue,
      amountPaid: entry.amountPaid,
      method: entry.method,
      invoiceNumber: entry.invoiceNumber ?? "",
      notes: entry.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPaymentId(null);
    form.reset(defaultFormValues);
  };

  const handleSubmit = (values: PaymentFormValues) => {
    if (editingPaymentId) {
      updatePayment(editingPaymentId, {
        amountDue: values.amountDue,
        amountPaid: values.amountPaid,
        method: values.method,
        invoiceNumber: values.invoiceNumber?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        visitId: values.visitId?.trim() ? values.visitId : undefined,
      });
      toast.success("Payment updated successfully.");
    } else {
      addPayment({
        patientId: values.patientId,
        visitId: values.visitId?.trim() ? values.visitId : undefined,
        amountDue: values.amountDue,
        amountPaid: values.amountPaid,
        method: values.method,
        invoiceNumber: values.invoiceNumber?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
      toast.success("Payment recorded successfully.");
    }
    closeDialog();
  };

  const dialogTitle = editingPaymentId ? "Update payment" : "Record payment";
  const dialogDescription = editingPaymentId
    ? "Adjust payment amounts, methods, or invoice details."
    : "Log a new payment and optionally associate it with a visit.";

  const availableVisits = visits.filter(
    (visit) => visit.patientId === watchedPatientId
  );

  const pageTitle = "Payments";
  const pageDescription =
    "Track invoices, monitor payment statuses, and keep revenue up to date.";

  const actions = (
    <Button type="button" onClick={openDialogForCreate}>
      Record payment
    </Button>
  );

  return (
    <>
      <PageSeo
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/payments"
      />
      <DashboardLayout
        title="Payments"
        description={pageDescription}
        actions={actions}
      >
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total billed
            </p>
            <p className="text-2xl font-semibold">
              {formatCurrency(totals.billed)}
            </p>
            <p className="text-muted-foreground text-sm">
              Cumulative charges for filtered payments.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Collected
            </p>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatCurrency(totals.collected)}
            </p>
            <p className="text-muted-foreground text-sm">
              Payments received from patients and insurers.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Outstanding
            </p>
            <p className="text-2xl font-semibold text-amber-600">
              {formatCurrency(totals.outstanding)}
            </p>
            <p className="text-muted-foreground text-sm">
              Balances awaiting settlement.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Collection rate
            </p>
            <p className="text-2xl font-semibold">{collectionRate}%</p>
            <p className="text-muted-foreground text-sm">
              Collected vs billed amounts across results.
            </p>
          </Card>
        </section>

        <section className="mt-8">
          <Card>
            <CardHeader className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Payment records</CardTitle>
                <CardDescription>
                  Search and filter all recorded payments.
                </CardDescription>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Input
                  placeholder="Search invoices, patients, or notes"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Select
                  value={methodFilter}
                  onChange={(event) => setMethodFilter(event.target.value)}
                >
                  <option value="">All methods</option>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Invoice</th>
                    <th className="pb-3 pr-4">Patient</th>
                    <th className="pb-3 pr-4">Visit</th>
                    <th className="pb-3 pr-4">Method</th>
                    <th className="pb-3 pr-4 text-right">Amount due</th>
                    <th className="pb-3 pr-4 text-right">Amount paid</th>
                    <th className="pb-3 pr-4 text-right">Balance</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Recorded</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPayments.length ? (
                    filteredPayments.map(
                      ({ payment, patient, visit, balance, status }) => (
                        <tr key={payment.id}>
                          <td className="py-3 pr-4 font-medium">
                            {payment.invoiceNumber ?? payment.id}
                          </td>
                          <td className="py-3 pr-4">
                            {patient ? (
                              <div>
                                <p className="font-medium">
                                  {patient.firstName} {patient.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {patient.contact.phone}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Patient removed
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {visit ? formatDate(visit.visitDate) : "-"}
                          </td>
                          <td className="py-3 pr-4 capitalize">
                            {payment.method}
                          </td>
                          <td className="py-3 pr-4 text-right font-medium">
                            {formatCurrency(payment.amountDue)}
                          </td>
                          <td className="py-3 pr-4 text-right text-emerald-600">
                            {formatCurrency(payment.amountPaid)}
                          </td>
                          <td className="py-3 pr-4 text-right text-amber-600">
                            {formatCurrency(balance)}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatDateTime(payment.recordedAt)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDialogForEdit(payment)}
                              >
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/patients/${payment.patientId}`}>
                                  Open patient
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        No payments match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      </DashboardLayout>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          } else {
            setIsDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              className="grid gap-4"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <FormDescription>
                      Select a patient to associate with this payment.
                    </FormDescription>
                    <FormControl>
                      <Select
                        value={field.value}
                        onChange={(event) => {
                          field.onChange(event.target.value);
                          form.setValue("visitId", "");
                        }}
                        disabled={Boolean(editingPaymentId)}
                      >
                        <option value="" disabled>
                          {editingPaymentId
                            ? "Patient locked"
                            : "Select patient"}
                        </option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName}
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
                name="visitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related visit (optional)</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!watchedPatientId}
                      >
                        <option value="">Not linked</option>
                        {availableVisits.map((visit) => (
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
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                control={form.control}
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
              <FormField
                control={form.control}
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
                control={form.control}
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">Save payment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
