import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Activity, CalendarCheck, Stethoscope, Users } from "lucide-react";
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
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-JO", {
    style: "currency",
    currency: "JOD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

const formatDate = (date?: string) => {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface StatCardProps {
  title: string;
  value: string;
  helper?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accentClass?: string;
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  accentClass,
}: StatCardProps) {
  return (
    <Card className="gap-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="mt-3 text-2xl font-semibold">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary",
            accentClass
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      {helper ? (
        <p className="text-muted-foreground text-sm">{helper}</p>
      ) : null}
    </Card>
  );
}

export default function HomePage() {
  const { patients, visits, payments } = useClinic();

  const totalPatients = patients.length;
  const totalVisits = visits.length;
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const visitsThisMonth = visits.filter((visit) => {
    const visitDate = new Date(visit.visitDate);
    return (
      visitDate.getMonth() === thisMonth && visitDate.getFullYear() === thisYear
    );
  }).length;

  const paymentSummary = payments.reduce(
    (acc, payment) => {
      const paid = Math.min(payment.amountPaid, payment.amountDue);
      const outstanding = Math.max(payment.amountDue - payment.amountPaid, 0);

      return {
        billed: acc.billed + payment.amountDue,
        collected: acc.collected + paid,
        outstanding: acc.outstanding + outstanding,
      };
    },
    { billed: 0, collected: 0, outstanding: 0 }
  );

  const collectionRate = paymentSummary.billed
    ? Math.round((paymentSummary.collected / paymentSummary.billed) * 100)
    : 0;

  const upcomingFollowUps = visits
    .filter(
      (visit) =>
        visit.followUpDate && new Date(visit.followUpDate) >= new Date()
    )
    .sort((a, b) => {
      const aDate = a.followUpDate
        ? new Date(a.followUpDate).getTime()
        : Infinity;
      const bDate = b.followUpDate
        ? new Date(b.followUpDate).getTime()
        : Infinity;
      return aDate - bDate;
    })
    .slice(0, 4);

  const recentPatients = [...patients]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const diagnosisFrequency = visits.reduce<Record<string, number>>(
    (acc, visit) => {
      visit.diagnoses.forEach((diagnosis) => {
        acc[diagnosis] = (acc[diagnosis] ?? 0) + 1;
      });
      return acc;
    },
    {}
  );

  const topDiagnoses = Object.entries(diagnosisFrequency)
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, 5);

  const chronicConditionFrequency = patients.reduce<Record<string, number>>(
    (acc, patient) => {
      patient.chronicConditions.forEach((condition) => {
        acc[condition] = (acc[condition] ?? 0) + 1;
      });
      return acc;
    },
    {}
  );

  const topChronicConditions = Object.entries(chronicConditionFrequency)
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, 4);

  const pageTitle = "ARISE Dashboard";
  const pageDescription =
    "Monitor patient activity, visit workload, and revenue health across your clinic.";

  const actionButtons = (
    <Button asChild>
      <Link href="/patients">Manage patients</Link>
    </Button>
  );

  return (
    <>
      <PageSeo
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/"
      />
      <DashboardLayout
        title="Clinic Overview"
        description={pageDescription}
        actions={actionButtons}
      >
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total patients"
            value={totalPatients.toString()}
            helper="Includes all active records in the system"
            icon={Users}
          />
          <StatCard
            title="Visits this month"
            value={visitsThisMonth.toString()}
            helper="Scheduled and completed visits for the current month"
            icon={Stethoscope}
            accentClass="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Outstanding balance"
            value={formatCurrency(paymentSummary.outstanding)}
            helper="Balance remaining after applied patient payments"
            icon={Activity}
            accentClass="bg-amber-100 text-amber-700"
          />
          <StatCard
            title="Collection rate"
            value={`${collectionRate}%`}
            helper="Percentage of billed revenue that has been collected"
            icon={CalendarCheck}
            accentClass="bg-sky-100 text-sky-700"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent patient updates</CardTitle>
              <CardDescription>
                Track the latest activity across patient records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {recentPatients.length ? (
                  recentPatients.map((patient) => (
                    <li
                      key={patient.id}
                      className="flex items-center justify-between rounded-md border border-dashed border-border/60 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Chronic conditions:{" "}
                          {patient.chronicConditions.join(", ") || "None"}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Updated {formatDate(patient.updatedAt)}</p>
                        <p className="font-medium text-foreground">
                          Age {patient.age}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground text-sm">
                    No patients found.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming follow-ups</CardTitle>
              <CardDescription>
                Prepare for patient return visits and post-care reviews.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {upcomingFollowUps.length ? (
                  upcomingFollowUps.map((visit) => {
                    const patient = patients.find(
                      (p) => p.id === visit.patientId
                    );
                    const remainingBalance = payments
                      .filter(
                        (payment) => payment.patientId === visit.patientId
                      )
                      .reduce(
                        (acc, payment) =>
                          acc +
                          Math.max(payment.amountDue - payment.amountPaid, 0),
                        0
                      );

                    return (
                      <li
                        key={visit.id}
                        className="flex items-start justify-between gap-4 rounded-md border border-dashed border-border/60 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">
                            {patient
                              ? `${patient.firstName} ${patient.lastName}`
                              : "Patient removed"}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {visit.reason}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Follow-up {formatDate(visit.followUpDate)} with{" "}
                            {visit.attendingPhysician ?? "Assigned physician"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatDate(visit.visitDate)}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Balance {formatCurrency(remainingBalance)}
                          </p>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-muted-foreground text-sm">
                    No upcoming follow-ups scheduled.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top diagnoses</CardTitle>
              <CardDescription>
                Most frequent diagnoses recorded across patient visits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {topDiagnoses.length ? (
                  topDiagnoses.map(([diagnosis, count]) => {
                    const percentage = totalVisits
                      ? Math.round((count / totalVisits) * 100)
                      : 0;
                    return (
                      <li key={diagnosis}>
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>{diagnosis}</span>
                          <span>{count} visits</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(8, percentage)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-muted-foreground text-sm">
                    No visit data available.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chronic condition spotlight</CardTitle>
              <CardDescription>
                Identify conditions requiring the most ongoing management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {topChronicConditions.length ? (
                  topChronicConditions.map(([condition, count]) => {
                    const percentage = totalPatients
                      ? Math.round((count / totalPatients) * 100)
                      : 0;
                    return (
                      <li
                        key={condition}
                        className="flex items-center justify-between text-sm font-medium"
                      >
                        <div>
                          <p>{condition}</p>
                          <p className="text-muted-foreground text-xs">
                            {percentage}% of active patients
                          </p>
                        </div>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                          {count}
                        </span>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-muted-foreground text-sm">
                    No chronic conditions tracked yet.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </section>
      </DashboardLayout>
    </>
  );
}
