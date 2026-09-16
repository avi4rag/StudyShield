"use client";

import React from 'react';
import { CheckCircle2, AlertOctagon, RotateCw, Sparkles, ShieldCheck } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      {/* 4 Skeleton Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-200 rounded w-24" />
              <div className="w-8 h-8 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-8 bg-slate-200 rounded w-16" />
            <div className="h-3 bg-slate-100 rounded w-36" />
          </div>
        ))}
      </div>

      {/* Main Skeleton Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="space-y-2">
            <div className="h-5 bg-slate-200 rounded w-48" />
            <div className="h-3 bg-slate-100 rounded w-72" />
          </div>
          <div className="h-8 bg-slate-100 rounded-lg w-40" />
        </div>

        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
            </div>
            <div className="h-6 bg-slate-200 rounded-full w-16" />
            <div className="h-6 bg-slate-100 rounded w-48 hidden md:block" />
            <div className="h-8 bg-slate-200 rounded-lg w-24" />
          </div>
        ))}
      </div>

      {/* Two Column Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-white rounded-2xl border border-slate-200/80 p-6" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200/80 p-6" />
      </div>
    </div>
  );
}

export function EmptyState({ onRefresh, noStudents = false }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center my-6 max-w-2xl mx-auto shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
        {noStudents ? 'No students found' : "You're all caught up"}
      </h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
        {noStudents
          ? 'There are no student records available for this educator yet.'
          : 'No students currently require urgent attention. All learners in this cohort are active, submitting quizzes on schedule, and maintaining healthy retention momentum.'}
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Re-scan cohort signals</span>
        </button>
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <div className="bg-white rounded-2xl border border-rose-200 p-12 text-center my-6 max-w-xl mx-auto shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-4">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
        Couldn&apos;t load student insights
      </h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
        An error occurred while calculating the retention score model R(t). Your local settings and learner records are safe.
      </p>
      <div className="mt-6">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}
