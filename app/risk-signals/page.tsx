"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, HelpCircle, LogIn, RefreshCw, ShieldAlert, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/components/auth/AuthContext";
import StudentsNeedingAttention from "@/components/dashboard/StudentsNeedingAttention";
import { LoadingState } from "@/components/dashboard/StateViews";
import { cachedFetch, invalidateCache } from "@/lib/cache";

const NudgeModal = dynamic(() => import("@/components/modals/NudgeModal"), { ssr: false });
const StudentDetailDrawer = dynamic(() => import("@/components/modals/StudentDetailDrawer"), { ssr: false });

const signalMeta = {
  inactivity: {
    icon: Clock,
    label: "Inactive for 7+ days",
    threshold: "7+ days without a login",
    impact: "Adds the maximum inactivity penalty to R(t).",
    action: "Send a reconnect nudge",
  },
  quiz: {
    icon: HelpCircle,
    label: "Missed or incomplete quizzes",
    threshold: "Quiz completion below 50%",
    impact: "Reduces the completion component of R(t).",
    action: "Remind about pending quizzes",
  },
  login: {
    icon: LogIn,
    label: "No login in 3+ days",
    threshold: "No recent login for 3+ days",
    impact: "An early engagement gap to monitor before escalation.",
    action: "Check in before the gap grows",
  },
};

export default function RiskSignalsPage() {
  const { logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [signals, setSignals] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStudentForNudge, setSelectedStudentForNudge] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = useCallback(async (force = false) => {
    setIsLoading(true);
    if (force) {
      invalidateCache("/api/students");
      invalidateCache("/api/dashboard/signals");
    }
    try {
      const [studentsData, signalsData] = await Promise.all([
        cachedFetch("/api/students"),
        cachedFetch("/api/dashboard/signals"),
      ]);
      if (studentsData) setStudents(studentsData);
      if (signalsData) setSignals(signalsData);
    } catch (error) {
      console.error("Risk signals fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTabChange = (tab) => {
    if (tab === "Overview") window.location.href = "/dashboard";
    if (tab === "Students") window.location.href = "/students";
    if (tab === "Messages" || tab === "Messages & Outreach") window.location.href = "/messages";
    if (tab === "Reports") window.location.href = "/reports";

  };

  const filteredStudents = useMemo(() => {
    if (selectedSignal === "ALL") return students;
    return students.filter((student) => student.signals?.some((signal) => signal.type === selectedSignal));
  }, [selectedSignal, students]);

  const highRiskCount = students.filter((student) => student.statusCategory === "HIGH").length;
  const signalCaseCount = signals.reduce((total, signal) => total + signal.count, 0);
  const selectedSignalMeta = selectedSignal === "ALL" ? null : signalMeta[selectedSignal];

  const handleNudgeSent = async (studentId, message) => {
    const student = students.find((item) => item.id === studentId);
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
    showToast(`Nudge sent successfully to ${student?.name || "student"}.`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <Navbar activeTab="Risk Signals" onTabChange={handleTabChange} onLogout={logout} />
        <main className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-8">
          <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
                <ShieldAlert className="w-4 h-4" /> Early intervention workspace
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Risk Signals</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Review the behaviors driving risk scores, then act before a learner reaches high risk.
              </p>
            </div>
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchData(true).finally(() => {
                  setIsRefreshing(false);
                  showToast("Risk signals rescanned successfully.");
                });
              }}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Rescan signals
            </button>
          </header>

          {isLoading ? <LoadingState /> : (
            <>
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8" aria-label="Signal workspace summary">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Users className="w-4 h-4" /> Active signal cases</div>
                  <p className="mt-2 text-2xl font-extrabold">{signalCaseCount}</p>
                  <p className="mt-1 text-xs text-slate-500">Across the three PRD activity checks</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-700"><ShieldAlert className="w-4 h-4" /> High-risk students</div>
                  <p className="mt-2 text-2xl font-extrabold text-rose-900">{highRiskCount}</p>
                  <p className="mt-1 text-xs text-rose-700/80">Prioritize these cases for immediate outreach</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Recommended workflow</div>
                  <p className="mt-2 text-sm font-extrabold text-emerald-950">Detect, nudge, recheck</p>
                  <p className="mt-1 text-xs text-emerald-700/80">Refresh activity after student action</p>
                </div>
              </section>

              <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white" aria-labelledby="risk-model-heading">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">PRD risk model</p>
                    <h2 id="risk-model-heading" className="mt-1 text-lg font-bold">Signals explain what is moving R(t)</h2>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300">Use the trigger queue to intervene before a student reaches high risk. Quiz completion contributes 60%; inactivity contributes 40%.</p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-center font-mono text-sm text-emerald-200">R(t) = 0.60(100 - Q) + 0.40L</div>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" aria-label="Risk signal triggers">
                {signals.map((signal) => {
                  const meta = signalMeta[signal.filterKey] || { icon: AlertTriangle, label: signal.title, threshold: "Detected activity change", impact: "May increase the current risk score.", action: "Review student activity" };
                  const Icon = meta.icon;
                  const isSelected = selectedSignal === signal.filterKey;
                  return (
                    <button
                      key={signal.id}
                      onClick={() => setSelectedSignal(isSelected ? "ALL" : signal.filterKey)}
                      className={`text-left p-5 rounded-2xl border transition-all ${isSelected ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-slate-700" />
                        </span>
                        <span className="text-3xl font-extrabold">{signal.count}</span>
                      </div>
                      <h2 className="mt-4 font-bold">{meta.label}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{signal.description}</p>
                      <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
                        <p className="text-[11px] font-semibold text-slate-700">Trigger: {meta.threshold}</p>
                        <p className="text-[11px] text-slate-500">{meta.impact}</p>
                      </div>
                      <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">{isSelected ? "Showing this queue" : "View affected students"} <ArrowRight className="w-3 h-3" /></p>
                    </button>
                  );
                })}
              </section>

              <section className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedSignal === "ALL" ? "Intervention queue" : selectedSignalMeta?.label}</h2>
                  <p className="mt-1 text-sm text-slate-500">{filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"} need review based on current activity{selectedSignalMeta ? `. Recommended: ${selectedSignalMeta.action}.` : "."}</p>
                </div>
                {selectedSignal !== "ALL" && <button onClick={() => setSelectedSignal("ALL")} className="text-xs font-bold text-emerald-700 hover:underline">Clear filter</button>}
              </section>

              <StudentsNeedingAttention
                students={filteredStudents}
                pageSize={10}
                selectedBatch="All Batches"
                onReachOut={setSelectedStudentForNudge}
                onReviewStudent={setSelectedStudentForDetail}
                onToggleMonitor={(student) => showToast(`${student.name} added to the monitored watchlist.`)}
              />
            </>
          )}
        </main>

        {toastMessage && <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">{toastMessage}</div>}
        <NudgeModal isOpen={!!selectedStudentForNudge} onClose={() => setSelectedStudentForNudge(null)} student={selectedStudentForNudge} onSendNudge={handleNudgeSent} />
        <StudentDetailDrawer isOpen={!!selectedStudentForDetail} onClose={() => setSelectedStudentForDetail(null)} student={selectedStudentForDetail} onOpenNudge={setSelectedStudentForNudge} />
      </div>
    </ProtectedRoute>
  );
}
