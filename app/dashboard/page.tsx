"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import WelcomeHeader from "@/components/layout/WelcomeHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import StudentsNeedingAttention from "@/components/dashboard/StudentsNeedingAttention";
import RiskDistribution from "@/components/dashboard/RiskDistribution";
import EngagementTrend from "@/components/dashboard/EngagementTrend";
import EarlyWarningSignals from "@/components/dashboard/EarlyWarningSignals";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import InsightCard from "@/components/dashboard/InsightCard";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/dashboard/StateViews";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/components/auth/AuthContext";
import dynamic from "next/dynamic";
import { cachedFetch, invalidateCache } from "@/lib/cache";

const NudgeModal = dynamic(() => import("@/components/modals/NudgeModal"), {
  ssr: false,
});
const StudentDetailDrawer = dynamic(
  () => import("@/components/modals/StudentDetailDrawer"),
  { ssr: false },
);
const AddStudentModal = dynamic(
  () => import("@/components/modals/AddStudentModal"),
  { ssr: false },
);
const ReportModal = dynamic(() => import("@/components/modals/ReportModal"), {
  ssr: false,
});

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { logout } = useAuth();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [viewState, setViewState] = useState("normal"); // normal, loading, empty, error
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Student dataset state
  const [students, setStudents] = useState([]);
  const [signals, setSignals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fetch all data from the API
  const fetchAll = useCallback(async (force = false) => {
    setIsDataLoading(true);
    setViewState("loading");
    if (force) {
      invalidateCache("/api/students");
      invalidateCache("/api/dashboard");
    }
    try {
      const [studentsData, signalsData, activityData] = await Promise.all([
        cachedFetch("/api/students"),
        cachedFetch("/api/dashboard/signals"),
        cachedFetch("/api/dashboard/activity"),
      ]);
      if (studentsData) setStudents(studentsData);
      if (signalsData) setSignals(signalsData);
      if (activityData) setActivities(activityData);
      setViewState(studentsData.length === 0 ? "empty" : "normal");
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setViewState("error");
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Modal and Drawer states
  const [selectedStudentForNudge, setSelectedStudentForNudge] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] =
    useState(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Active risk filter triggered by metric cards
  const [riskFilterOverride, setRiskFilterOverride] = useState("ALL");

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "Messages" || tab === "Messages & Outreach") {
      router.push("/messages");
    } else if (tab === "Students") {
      router.push("/students");
    } else if (tab === "Reports") {
      router.push("/reports");
    } else if (tab === "Risk Signals") {
      router.push("/risk-signals");
    }
  };

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAll(true).finally(() => {
      setIsRefreshing(false);
      showToast("Learner signals and R(t) scores updated successfully.");
    });
  };

  const handleNudgeSent = async (studentId, message) => {
    const student = students.find((s) => s.id === studentId);
    try {
      await fetch("/api/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          content: message,
          subject: "Educator Nudge: Checking in on your progress",
          type: "Check-in",
          requiresResponse: true,
        }),
      });
      invalidateCache("/api/nudges");
      invalidateCache("/api/students");
    } catch (err) {
      console.error("Failed to persist nudge:", err);
    }
    showToast(
      `Nudge sent successfully to ${student ? student.name : "student"}.`,
    );
  };

  const handleAddStudent = async (newStudentLocal) => {
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudentLocal.name,
          email: newStudentLocal.email,
          batchName: newStudentLocal.batch,
          notes: newStudentLocal.notes ?? null,
        }),
      });
      invalidateCache("/api/students");
      invalidateCache("/api/dashboard");
      if (res.ok) {
        const saved = await res.json();
        setStudents((prev) => [saved, ...prev]);
      } else {
        setStudents((prev) => [newStudentLocal, ...prev]);
      }
    } catch {
      setStudents((prev) => [newStudentLocal, ...prev]);
    }
    showToast(
      `Enrolled ${newStudentLocal.name} into StudyShield retention monitor.`,
    );
  };

  const handleSelectMetricCard = (category) => {
    setRiskFilterOverride(category);
    // Smooth scroll to students table
    const el = document.getElementById("students-attention-heading");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignalClick = (signalType) => {
    setSearchQuery(signalType);
    const el = document.getElementById("students-attention-heading");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentMetrics = useMemo(() => {
    const batchStudents =
      selectedBatch === "All Batches"
        ? students
        : students.filter((s) => s.batch === selectedBatch);

    const total = batchStudents.length;
    const high = batchStudents.filter(
      (s) => s.statusCategory === "HIGH",
    ).length;
    const medium = batchStudents.filter(
      (s) => s.statusCategory === "MEDIUM",
    ).length;
    const healthy = batchStudents.filter(
      (s) => s.statusCategory === "HEALTHY",
    ).length;
    const atRisk = high + medium;

    return {
      totalStudents: total || 0,
      studentsAtRisk: atRisk || 0,
      highRisk: high || 0,
      healthyEngagement: healthy || 0,
    };
  }, [students, selectedBatch]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
        {/* Toast Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-medium">{toastMessage}</p>
          </div>
        )}

        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={logout}
        />

        {/* Welcome Header */}
        <WelcomeHeader
          selectedBatch={selectedBatch}
          onBatchChange={setSelectedBatch}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          viewState={viewState}
          onViewStateChange={setViewState}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* Render different UI states based on viewState selector */}
          {viewState === "loading" ? (
            <LoadingState />
          ) : viewState === "empty" ? (
            <EmptyState onRefresh={() => setViewState("normal")} />
          ) : viewState === "error" ? (
            <ErrorState onRetry={() => setViewState("normal")} />
          ) : (
            <>
              {/* 1. Key Overview Metrics Grid (4 Cards) */}
              <section aria-labelledby="key-metrics-heading">
                <h2 id="key-metrics-heading" className="sr-only">
                  Key Overview Metrics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Students */}
                  <MetricCard
                    type="totalStudents"
                    title="Total Students"
                    value={currentMetrics.totalStudents}
                    subtitle="Students currently being monitored"
                    trend="+12 this month"
                    trendType="neutral"
                    onClick={() => handleSelectMetricCard("ALL")}
                  />

                  {/* Students At Risk */}
                  <MetricCard
                    type="studentsAtRisk"
                    title="Students At Risk"
                    value={currentMetrics.studentsAtRisk}
                    subtitle="Showing elevated warning signals"
                    trend="+5 this week"
                    trendType="warning"
                    onClick={() => handleSelectMetricCard("AT_RISK")}
                  />

                  {/* High Risk */}
                  <MetricCard
                    type="highRisk"
                    title="High Risk"
                    value={currentMetrics.highRisk}
                    subtitle="Require immediate attention"
                    trend="Urgent Action"
                    trendType="danger"
                    onClick={() => handleSelectMetricCard("HIGH")}
                  />

                  {/* Healthy Engagement */}
                  <MetricCard
                    type="healthyEngagement"
                    title="Healthy Engagement"
                    value={currentMetrics.healthyEngagement}
                    subtitle={`${Math.round((currentMetrics.healthyEngagement / currentMetrics.totalStudents) * 100)}% of students`}
                    trend="Stable cohort pace"
                    trendType="positive"
                    onClick={() => handleSelectMetricCard("HEALTHY")}
                  />
                </div>
              </section>

              {/* 2. Main Dashboard Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Primary "Students Needing Attention" (Span 8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Students Table / Queue */}
                  <StudentsNeedingAttention
                    students={students}
                    pageSize={10}
                    selectedBatch={selectedBatch}
                    initialRiskFilter={riskFilterOverride}
                    onReachOut={(student) =>
                      setSelectedStudentForNudge(student)
                    }
                    onReviewStudent={(student) =>
                      setSelectedStudentForDetail(student)
                    }
                    onToggleMonitor={(student) =>
                      showToast(`Added ${student.name} to monitored watchlist.`)
                    }
                  />

                  {/* Engagement Trend Chart */}
                  <EngagementTrend
                    onViewActivityDetails={() => {
                      const el = document.getElementById(
                        "students-attention-heading",
                      );
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  />
                </div>

                {/* Right Column: Risk Overview, Insight Card, Quick Actions & Recent Activity (Span 4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Student Risk Overview (Segmented Bar) */}
                  <RiskDistribution
                    onSelectCategory={(cat) => handleSelectMetricCard(cat)}
                    students={students}
                  />

                  {/* StudyShield Intelligence Insight Card */}
                  <InsightCard
                    onExploreSignals={() => {
                      const el = document.getElementById(
                        "early-warning-heading",
                      );
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  />

                  {/* Quick Actions Card */}
                  <QuickActions
                    onAddStudent={() => setIsAddStudentOpen(true)}
                    onViewAtRisk={() => handleSelectMetricCard("HIGH")}
                    onGenerateReport={() => setIsReportModalOpen(true)}
                    onSendReminder={() => {
                      // Preselect highest risk student for reminder
                      const topHighRisk =
                        students.find((s) => s.statusCategory === "HIGH") ||
                        students[0];
                      setSelectedStudentForNudge(topHighRisk);
                    }}
                  />

                  {/* Recent Activity Feed */}
                  <RecentActivity
                    onViewAllActivity={() =>
                      showToast("Displaying real-time event feed for cohort.")
                    }
                    onSelectStudentActivity={(item) => {
                      const match = students.find(
                        (s) => s.name === item.student,
                      );
                      if (match) setSelectedStudentForDetail(match);
                    }}
                    activities={activities}
                  />
                </div>
              </div>

              {/* 3. Early Warning Signals Section (4 Cards Grid) */}
              <EarlyWarningSignals
                onSelectSignal={(filterKey) => handleSignalClick(filterKey)}
                signals={signals}
              />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold text-[10px]">
                S
              </div>
              <span className="font-semibold text-slate-800">StudyShield</span>
              <span>— Student Early-Warning & Retention Intelligence</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Formula R(t) v2.4</span>
              <span>•</span>
              <span>Educator Workspace</span>
              <span>•</span>
              <button
                onClick={logout}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Sign out
              </button>
            </div>
          </div>
        </footer>

        {/* Modals and Side Drawers */}
        <NudgeModal
          isOpen={!!selectedStudentForNudge}
          onClose={() => setSelectedStudentForNudge(null)}
          student={selectedStudentForNudge}
          onSendNudge={handleNudgeSent}
        />

        <StudentDetailDrawer
          isOpen={!!selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          student={selectedStudentForDetail}
          onOpenNudge={(student) => setSelectedStudentForNudge(student)}
        />

        <AddStudentModal
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          onAddStudent={handleAddStudent}
        />

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          batch={selectedBatch}
          metrics={currentMetrics}
        />
      </div>
    </ProtectedRoute>
  );
}
