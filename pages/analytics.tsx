import { useMemo, useState } from "react";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { CHRONIC_CONDITIONS, DISEASES } from "@/components/constants/clinic";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-JO", {
    style: "currency",
    currency: "JOD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

type PaymentStatus = "paid" | "partial" | "pending";

const getPaymentStatus = (
  amountDue: number,
  amountPaid: number
): PaymentStatus => {
  const balance = amountDue - amountPaid;
  if (balance <= 0) {
    return "paid";
  }
  if (amountPaid === 0) {
    return "pending";
  }
  return "partial";
};

const DistributionRow = ({
  label,
  count,
  total,
  accent,
}: {
  label: string;
  count: number;
  total: number;
  accent: string;
}) => {
  const percentage = total ? Math.round((count / total) * 100) : 0;
  const width = total ? Math.max(6, Math.round((count / total) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        <span>
          {count} ({percentage}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${accent}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const { patients, visits, payments } = useClinic();
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(0);
  const [ageMax, setAgeMax] = useState(100);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [selectedChronicConditions, setSelectedChronicConditions] = useState<
    string[]
  >([]);

  const visitsGroupedByPatient = useMemo(() => {
    const grouped = new Map<string, typeof visits>();
    visits.forEach((visit) => {
      if (!grouped.has(visit.patientId)) {
        grouped.set(visit.patientId, []);
      }
      grouped.get(visit.patientId)!.push(visit);
    });
    return grouped;
  }, [visits]);

  const filteredPatients = useMemo(() => {
    const safeMin = Math.max(0, ageMin);
    const safeMax = Math.max(safeMin, ageMax);

    return patients.filter((patient) => {
      if (selectedGenders.length && !selectedGenders.includes(patient.gender)) {
        return false;
      }

      if (patient.age < safeMin || patient.age > safeMax) {
        return false;
      }

      if (
        selectedChronicConditions.length &&
        !selectedChronicConditions.every((condition) =>
          patient.chronicConditions.includes(condition)
        )
      ) {
        return false;
      }

      if (selectedDiseases.length) {
        const patientVisits = visitsGroupedByPatient.get(patient.id) ?? [];
        const hasDiseaseMatch = patientVisits.some((visit) =>
          visit.diagnoses.some((diagnosis) =>
            selectedDiseases.includes(diagnosis)
          )
        );
        if (!hasDiseaseMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    patients,
    selectedGenders,
    ageMin,
    ageMax,
    selectedChronicConditions,
    selectedDiseases,
    visitsGroupedByPatient,
  ]);

  const filteredPatientIds = useMemo(
    () => new Set(filteredPatients.map((patient) => patient.id)),
    [filteredPatients]
  );

  const filteredVisits = useMemo(
    () =>
      visits.filter(
        (visit) =>
          filteredPatientIds.has(visit.patientId) &&
          (selectedDiseases.length
            ? visit.diagnoses.some((diagnosis) =>
                selectedDiseases.includes(diagnosis)
              )
            : true)
      ),
    [visits, filteredPatientIds, selectedDiseases]
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => filteredPatientIds.has(payment.patientId)),
    [payments, filteredPatientIds]
  );

  const totalPatientCount = filteredPatients.length || 1;
  const totalVisitCount = filteredVisits.length || 1;
  const totalPaymentCount = filteredPayments.length || 1;

  const outstandingBalance = filteredPayments.reduce(
    (acc, payment) => acc + Math.max(payment.amountDue - payment.amountPaid, 0),
    0
  );

  const collectedRevenue = filteredPayments.reduce(
    (acc, payment) => acc + Math.min(payment.amountPaid, payment.amountDue),
    0
  );

  const averageAge = filteredPatients.length
    ? Math.round(
        filteredPatients.reduce((acc, patient) => acc + patient.age, 0) /
          filteredPatients.length
      )
    : 0;

  const genderDistribution = filteredPatients.reduce<Record<string, number>>(
    (acc, patient) => {
      acc[patient.gender] = (acc[patient.gender] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const diagnosisFrequency = filteredVisits.reduce<Record<string, number>>(
    (acc, visit) => {
      visit.diagnoses.forEach((diagnosis) => {
        acc[diagnosis] = (acc[diagnosis] ?? 0) + 1;
      });
      return acc;
    },
    {}
  );

  const chronicDistribution = filteredPatients.reduce<Record<string, number>>(
    (acc, patient) => {
      patient.chronicConditions.forEach((condition) => {
        acc[condition] = (acc[condition] ?? 0) + 1;
      });
      return acc;
    },
    {}
  );

  const complaintFrequency = filteredVisits.reduce<Record<string, number>>(
    (acc, visit) => {
      visit.complaints.forEach((complaint) => {
        acc[complaint] = (acc[complaint] ?? 0) + 1;
      });
      return acc;
    },
    {}
  );

  const paymentStatusCounts = filteredPayments.reduce<
    Record<PaymentStatus, number>
  >(
    (acc, payment) => {
      const status = getPaymentStatus(payment.amountDue, payment.amountPaid);
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    { paid: 0, partial: 0, pending: 0 }
  );

  const visitsByMonth = useMemo(() => {
    const counts = filteredVisits.reduce<Record<string, number>>(
      (acc, visit) => {
        const date = new Date(visit.visitDate);
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, count]) => {
        const humanLabel = new Date(`${key}-01T00:00:00`).toLocaleDateString(
          undefined,
          {
            month: "short",
            year: "numeric",
          }
        );
        return { key, label: humanLabel, count };
      });
  }, [filteredVisits]);

  const topDiagnoses = Object.entries(diagnosisFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topChronicConditions = Object.entries(chronicDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topComplaints = Object.entries(complaintFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const resetFilters = () => {
    setSelectedGenders([]);
    setAgeMin(0);
    setAgeMax(100);
    setSelectedDiseases([]);
    setSelectedChronicConditions([]);
  };

  const pageTitle = "Analytics";
  const pageDescription =
    "Explore patient demographics, visit trends, and revenue performance.";

  return (
    <>
      <PageSeo
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/analytics"
      />
      <DashboardLayout title="Analytics" description={pageDescription}>
        <section>
          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                  Adjust the parameters to tailor the analytics view.
                </CardDescription>
              </div>
              <Button variant="outline" type="button" onClick={resetFilters}>
                Reset filters
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Gender
                </p>
                <div className="flex flex-wrap gap-2">
                  {genderOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        selectedGenders.includes(option.value)
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setSelectedGenders((prev) =>
                          prev.includes(option.value)
                            ? prev.filter((value) => value !== option.value)
                            : [...prev, option.value]
                        )
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Minimum age
                  </p>
                  <Input
                    type="number"
                    min={0}
                    max={ageMax}
                    value={ageMin}
                    onChange={(event) =>
                      setAgeMin(Number(event.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Maximum age
                  </p>
                  <Input
                    type="number"
                    min={ageMin}
                    max={120}
                    value={ageMax}
                    onChange={(event) =>
                      setAgeMax(Number(event.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Target diagnoses
                  </p>
                  <MultiSelect
                    value={selectedDiseases}
                    onChange={setSelectedDiseases}
                    options={DISEASES.map((disease) => ({
                      value: disease,
                      label: disease,
                    }))}
                    placeholder="Select diagnoses"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Chronic conditions
                </p>
                <MultiSelect
                  value={selectedChronicConditions}
                  onChange={setSelectedChronicConditions}
                  options={CHRONIC_CONDITIONS.map((condition) => ({
                    value: condition,
                    label: condition,
                  }))}
                  placeholder="Select chronic conditions"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filtered patients
            </p>
            <p className="text-2xl font-semibold">{filteredPatients.length}</p>
            <p className="text-muted-foreground text-sm">
              Patients that match the current filters.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total visits
            </p>
            <p className="text-2xl font-semibold">{filteredVisits.length}</p>
            <p className="text-muted-foreground text-sm">
              Clinical encounters for filtered patients.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Average age
            </p>
            <p className="text-2xl font-semibold">{averageAge}</p>
            <p className="text-muted-foreground text-sm">
              Mean age for the current cohort.
            </p>
          </Card>
          <Card className="gap-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Outstanding balance
            </p>
            <p className="text-2xl font-semibold text-amber-600">
              {formatCurrency(outstandingBalance)}
            </p>
            <p className="text-muted-foreground text-sm">
              Balances for filtered patient accounts.
            </p>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gender distribution</CardTitle>
              <CardDescription>
                Breakdown of the selected patient cohort by gender.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {genderOptions.map((option) => (
                <DistributionRow
                  key={option.value}
                  label={option.label}
                  count={genderDistribution[option.value] ?? 0}
                  total={totalPatientCount}
                  accent="bg-primary"
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment health</CardTitle>
              <CardDescription>
                Status of invoices raised for filtered patients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DistributionRow
                label="Paid"
                count={paymentStatusCounts.paid}
                total={totalPaymentCount}
                accent="bg-emerald-500"
              />
              <DistributionRow
                label="Partial"
                count={paymentStatusCounts.partial}
                total={totalPaymentCount}
                accent="bg-amber-500"
              />
              <DistributionRow
                label="Pending"
                count={paymentStatusCounts.pending}
                total={totalPaymentCount}
                accent="bg-slate-400"
              />
              <p className="text-xs text-muted-foreground">
                Collected revenue: {formatCurrency(collectedRevenue)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top diagnoses</CardTitle>
              <CardDescription>
                Most common diagnoses among the filtered visits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topDiagnoses.length ? (
                topDiagnoses.map(([diagnosis, count]) => (
                  <DistributionRow
                    key={diagnosis}
                    label={diagnosis}
                    count={count}
                    total={totalVisitCount}
                    accent="bg-primary/80"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No diagnoses available for the current filters.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chronic condition spread</CardTitle>
              <CardDescription>
                Conditions requiring ongoing management in the cohort.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topChronicConditions.length ? (
                topChronicConditions.map(([condition, count]) => (
                  <DistributionRow
                    key={condition}
                    label={condition}
                    count={count}
                    total={totalPatientCount}
                    accent="bg-emerald-500"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No chronic conditions match the selected filters.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Visit timeline</CardTitle>
              <CardDescription>
                Monthly visit volume across the last six months.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {visitsByMonth.length ? (
                visitsByMonth.map((entry) => (
                  <DistributionRow
                    key={entry.key}
                    label={entry.label}
                    count={entry.count}
                    total={totalVisitCount}
                    accent="bg-primary/70"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not enough visit data to display a timeline.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequent complaints</CardTitle>
              <CardDescription>
                Common presenting complaints across filtered visits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topComplaints.length ? (
                topComplaints.map(([complaint, count]) => (
                  <DistributionRow
                    key={complaint}
                    label={complaint}
                    count={count}
                    total={totalVisitCount}
                    accent="bg-amber-500"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No complaints recorded for the selected filters.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </DashboardLayout>
    </>
  );
}
