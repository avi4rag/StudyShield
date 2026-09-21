"use client";

import React from "react";
import { ShieldAlert, FileText, Send, Zap, ChevronRight } from "lucide-react";

export default function QuickActions({
  onViewAtRisk,
  onGenerateReport,
  onSendReminder,
}) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Quick Actions
            </h3>
            <p className="text-xs text-slate-500">
              Immediate educator workflows
            </p>
          </div>
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* View At-Risk Students */}
        <button
          onClick={onViewAtRisk}
          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-rose-300 hover:bg-rose-50/40 text-left transition-all duration-150 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                View At-Risk Students
              </p>
              <p className="text-[11px] text-slate-500">
                Filter to 31 priority learners
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Generate Report */}
        <button
          onClick={onGenerateReport}
          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all duration-150 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Generate Report
              </p>
              <p className="text-[11px] text-slate-500">
                Export 30-day cohort metrics
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Send Reminder */}
        <button
          onClick={onSendReminder}
          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all duration-150 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Send Reminder
              </p>
              <p className="text-[11px] text-slate-500">
                Nudge pending quizzes
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    </div>
  );
}
