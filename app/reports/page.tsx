"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ReportsPage from "@/components/dashboard/ReportsPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/components/auth/AuthContext";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { CheckCircle2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  batch: string;
  quizCompletionRate: number;
  inactiveDays: number;
  riskScore: number;
  riskLevel: string;
  lastActive: string;
  statusCategory?: string;
}

export default function ReportsDashboardPage() {
  const { logout } = useAuth();
  const router = useRouter();

  // State management
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [reportRange, setReportRange] = useState("Last 30 Days");
  const [students, setStudents] = useState<Student[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch all data from the API
  const fetchStudents = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const studentsData = await cachedFetch("/api/students");
      if (studentsData) {
        setStudents(studentsData);
      }
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRefresh = () => {
    invalidateCache("/api/students");
    fetchStudents().then(() => {
      showToast("Report data refreshed successfully.");
    });
  };

  const handleExportReport = () => {
    showToast("Generating comprehensive PDF export report...");
    // In a real application, this would trigger a download
    setTimeout(() => {
      showToast("Report export completed successfully!");
    }, 2000);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "Messages" || tab === "Messages & Outreach") {
      router.push("/messages");
    } else if (tab === "Students") {
      router.push("/students");
    } else if (tab === "Overview") {
      router.push("/dashboard");
    }
    else if(tab==="Risk Signals"){
     router.push("/risk-signals");
    }
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
          activeTab="Reports"
          onTabChange={handleTabChange}
          onLogout={logout}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          Page Header
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Reports & Analytics
                </h1>
                <p className="text-slate-600">
                  Monitor student engagement, track risk signals, and generate
                  comprehensive reports.
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
          {isDataLoading ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32"></div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"
                  ></div>
                ))}
              </div>
            </div>
          ) : (
            <ReportsPage
              students={students}
              selectedBatch={selectedBatch}
              reportRange={reportRange}
              onReportRangeChange={setReportRange}
              onBatchChange={setSelectedBatch}
              onExportReport={handleExportReport}
            />
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
              <span>Reports & Analytics</span>
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
      </div>
    </ProtectedRoute>
  );
}
