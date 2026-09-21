"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import StudentsNeedingAttention from "@/components/dashboard/StudentsNeedingAttention";
import dynamic from "next/dynamic";
import { cachedFetch, invalidateCache } from "@/lib/cache";

const StudentDetailDrawer = dynamic(() => import("@/components/modals/StudentDetailDrawer"), { ssr: false });
const NudgeModal = dynamic(() => import("@/components/modals/NudgeModal"), { ssr: false });
const AddStudentModal = dynamic(() => import("@/components/modals/AddStudentModal"), { ssr: false });

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/components/auth/AuthContext";
import { CheckCircle2, UserPlus, Users, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentForDetail, setSelectedStudentForDetail] =
    useState(null);
  const [selectedStudentForNudge, setSelectedStudentForNudge] = useState(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchStudents = useCallback(async (force = false) => {
    if (force) {
      invalidateCache('/api/students');
    }
    try {
      const data = await cachedFetch('/api/students');
      if (data) setStudents(data);
    } catch (err) {
      console.error("Students page fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleTabChange = (tab) => {
    if (
      tab === "Overview" ||
      tab === "Reports"
    ) {
      router.push("/dashboard");
    } else if (tab === "Risk Signals") {
      router.push("/risk-signals");
    } else if (tab === "Messages" || tab === "Messages & Outreach") {
      router.push("/messages");
    }
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
      invalidateCache('/api/nudges');
      invalidateCache('/api/students');
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
      invalidateCache('/api/students');
      invalidateCache('/api/dashboard');
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
          activeTab="Students"
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={logout}
        />

        {/* Header */}
        <div className="bg-white border-b border-slate-200/80 py-6 sm:py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Student Directory & Cohort Monitor
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Live R(t) Model
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Comprehensive directory of all enrolled learners, real-time risk
                scores, and academic momentum.
              </p>
            </div>

            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Student</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 sm:py-8 space-y-6">
          <StudentsNeedingAttention
            students={students}
            pageSize={10}
            selectedBatch={selectedBatch}
            initialRiskFilter="ALL"
            onReachOut={(student) => setSelectedStudentForNudge(student)}
            onReviewStudent={(student) => setSelectedStudentForDetail(student)}
            onToggleMonitor={(student) =>
              showToast(`Added ${student.name} to monitored watchlist.`)
            }
          />
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 bg-white py-6">
          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
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
              <span>Student Directory</span>
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

        {/* Modals & Drawers */}
        <StudentDetailDrawer
          isOpen={!!selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          student={selectedStudentForDetail}
          onOpenNudge={(student) => setSelectedStudentForNudge(student)}
        />

        <NudgeModal
          isOpen={!!selectedStudentForNudge}
          onClose={() => setSelectedStudentForNudge(null)}
          student={selectedStudentForNudge}
          onSendNudge={handleNudgeSent}
        />

        <AddStudentModal
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          onAddStudent={handleAddStudent}
        />
      </div>
    </ProtectedRoute>
  );
}
