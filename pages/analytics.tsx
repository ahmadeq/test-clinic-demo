import { useMemo, useState } from "react";
import {
  Activity,
  CalendarRange,
  Filter,
  HeartPulse,
  PieChart,
  Users,
  type LucideIcon,
} from "lucide-react";
import PageSeo from "@/components/utils/PageSeo";
import useClinic from "@/components/hooks/useClinic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { CHRONIC_CONDITIONS, DISEASES } from "@/components/constants/clinic";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "JOD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const genderLabelMap = genderOptions.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {}
);

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

  const totalPatientCount = filteredPatients.length;
  const totalVisitCount = filteredVisits.length;
  const totalPaymentCount = filteredPayments.length;

  const ageBounds = filteredPatients.reduce(
    (acc, patient) => ({
      min: Math.min(acc.min, patient.age),
      max: Math.max(acc.max, patient.age),
    }),
    {
      min: filteredPatients[0]?.age ?? 0,
      max: filteredPatients[0]?.age ?? 0,
    }
  );
  const minAge = filteredPatients.length ? ageBounds.min : 0;
  const maxAge = filteredPatients.length ? ageBounds.max : 0;

  const outstandingBalance = filteredPayments.reduce(
    (acc, payment) => acc + Math.max(payment.amountDue - payment.amountPaid, 0),
    0
  );

  const collectedRevenue = filteredPayments.reduce(
    (acc, payment) => acc + Math.min(payment.amountPaid, payment.amountDue),
    0
  );

  const revenueCoverage = collectedRevenue + outstandingBalance;
  const collectionRate = revenueCoverage
    ? Math.round((collectedRevenue / revenueCoverage) * 100)
    : 0;

  const visitsPerPatient = filteredPatients.length
    ? Number((filteredVisits.length / filteredPatients.length).toFixed(1))
    : 0;

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

  const topGenderEntry = Object.entries(genderDistribution).sort(
    ([, a], [, b]) => b - a
  )[0];
  const topGenderLabel =
    topGenderEntry && totalPatientCount
      ? `${Math.round((topGenderEntry[1] / totalPatientCount) * 100)}% ${
          genderLabelMap[topGenderEntry[0]] ?? topGenderEntry[0]
        }`
      : undefined;

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

  const latestVisitPeriod =
    visitsByMonth.length > 0
      ? visitsByMonth[visitsByMonth.length - 1]
      : undefined;
  const previousVisitPeriod =
    visitsByMonth.length > 1
      ? visitsByMonth[visitsByMonth.length - 2]
      : undefined;
  const visitTrend =
    previousVisitPeriod && previousVisitPeriod.count
      ? Math.round(
          ((latestVisitPeriod?.count ?? 0 - previousVisitPeriod.count) /
            previousVisitPeriod.count) *
            100
        )
      : undefined;

  const topDiagnoses = Object.entries(diagnosisFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topChronicConditions = Object.entries(chronicDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topComplaints = Object.entries(complaintFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const ageRangeChanged = ageMin > 0 || ageMax < 100;
  const hasActiveFilters = Boolean(
    selectedGenders.length ||
      ageRangeChanged ||
      selectedDiseases.length ||
      selectedChronicConditions.length
  );
  const activeFiltersCount = [
    selectedGenders.length > 0,
    ageRangeChanged,
    selectedDiseases.length > 0,
    selectedChronicConditions.length > 0,
  ].filter(Boolean).length;

  const totalPatientsOverall = patients.length;
  const totalVisitsOverall = visits.length;
  const totalPaymentsOverall = payments.length;

  const cohortHelperBase = hasActiveFilters
    ? `${filteredPatients.length} of ${totalPatientsOverall} patients match filters`
    : `All ${totalPatientsOverall} patients included`;
  const cohortHelper = topGenderLabel
    ? `${cohortHelperBase} · ${topGenderLabel}`
    : cohortHelperBase;

  const visitHelperSegments: string[] = [];
  if (filteredVisits.length && visitsPerPatient) {
    visitHelperSegments.push(`Avg ${visitsPerPatient} visits/patient`);
  }
  if (latestVisitPeriod) {
    visitHelperSegments.push(
      `${latestVisitPeriod.label}: ${latestVisitPeriod.count} visits`
    );
  }
  if (visitTrend !== undefined) {
    visitHelperSegments.push(
      `${visitTrend >= 0 ? "▲" : "▼"} ${Math.abs(visitTrend)}% vs prior month`
    );
  }
  const visitHelper = visitHelperSegments.length
    ? visitHelperSegments.join(" · ")
    : totalVisitsOverall
    ? "No visit data for current filters"
    : "No visits recorded yet";

  const ageHelper = filteredPatients.length
    ? `Range ${minAge}-${maxAge}`
    : "Adjust filters to include patients";

  const outstandingHelper = revenueCoverage
    ? `Collection rate ${collectionRate}% · Collected ${formatCurrency(
        collectedRevenue
      )}`
    : totalPaymentsOverall
    ? "No payment data matches the filters"
    : "No payments recorded yet";

  const statCards: Array<{
    eyebrow: string;
    value: string;
    helper: string;
    icon: LucideIcon;
    cardClass: string;
    iconClass: string;
  }> = [
    {
      eyebrow: "Filtered patients",
      value: filteredPatients.length.toString(),
      helper: cohortHelper,
      icon: Users,
      cardClass: "from-sky-500/15 via-sky-500/5 to-transparent",
      iconClass: "text-sky-600 dark:text-sky-300",
    },
    {
      eyebrow: "Visit volume",
      value: filteredVisits.length.toString(),
      helper: visitHelper,
      icon: Activity,
      cardClass: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      iconClass: "text-emerald-600 dark:text-emerald-300",
    },
    {
      eyebrow: "Average age",
      value: averageAge ? `${averageAge}` : "-",
      helper: ageHelper,
      icon: CalendarRange,
      cardClass: "from-indigo-500/15 via-indigo-500/5 to-transparent",
      iconClass: "text-indigo-600 dark:text-indigo-300",
    },
    {
      eyebrow: "Outstanding balance",
      value: formatCurrency(outstandingBalance),
      helper: outstandingHelper,
      icon: PieChart,
      cardClass: "from-amber-500/15 via-amber-500/5 to-transparent",
      iconClass: "text-amber-600 dark:text-amber-300",
    },
  ];

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
            <CardHeader className="gap-2">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                  Adjust demographic and clinical levers to focus the analytics
                  view.
                </CardDescription>
              </div>
              <CardAction>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  {hasActiveFilters
                    ? `${activeFiltersCount} active`
                    : "No active filters"}
                </span>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-6">
              <section className="grid gap-4 rounded-xl border border-border/60 bg-muted/40 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Demographics
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Focus the cohort by gender and age bands.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gender
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {genderOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          size="sm"
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
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                </div>
              </section>

              <section className="grid gap-4 rounded-xl border border-border/60 bg-background p-4 shadow-inner">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Clinical focus
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Highlight diagnoses and chronic conditions to tighten
                    results.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
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
                </div>
              </section>
            </CardContent>
            <CardFooter className="border-t border-border/60 bg-muted/30">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Every chart updates instantly as you tweak these filters.
                </p>
                <Button
                  variant="outline"
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                >
                  Reset filters
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.eyebrow}
                className={`bg-gradient-to-br ${card.cardClass} relative overflow-hidden border-border/50`}
              >
                <CardContent className="flex min-h-full flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {card.eyebrow}
                    </p>
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-sm shadow-inner shadow-black/5 ${card.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold">{card.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {card.helper}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="gap-2">
              <div>
                <CardTitle>Gender distribution</CardTitle>
                <CardDescription>
                  Breakdown of the selected patient cohort by gender.
                </CardDescription>
              </div>
              {topGenderLabel ? (
                <CardAction>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {topGenderLabel}
                  </span>
                </CardAction>
              ) : null}
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
            <CardHeader className="gap-2">
              <div>
                <CardTitle>Payment health</CardTitle>
                <CardDescription>
                  Status of invoices raised for filtered patients.
                </CardDescription>
              </div>
              <CardAction>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600">
                  <PieChart className="h-3.5 w-3.5" />
                  {collectionRate}% collected
                </span>
              </CardAction>
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
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/30 text-xs sm:text-sm text-muted-foreground">
              <span>Collected {formatCurrency(collectedRevenue)}</span>
              <span>Outstanding {formatCurrency(outstandingBalance)}</span>
              <span>
                {totalPaymentCount
                  ? `${totalPaymentCount} record${
                      totalPaymentCount === 1 ? "" : "s"
                    }`
                  : totalPaymentsOverall
                  ? "No payments match the filters"
                  : "No payments recorded"}
              </span>
            </CardFooter>
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
            <CardHeader className="gap-2">
              <div>
                <CardTitle>Chronic condition spread</CardTitle>
                <CardDescription>
                  Conditions requiring ongoing management in the cohort.
                </CardDescription>
              </div>
              <CardAction>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
                  <HeartPulse className="h-4 w-4" />
                </span>
              </CardAction>
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
