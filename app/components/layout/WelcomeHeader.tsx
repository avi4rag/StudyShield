"use client";

import React, { useState } from 'react';
import { RotateCw, Filter, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { BATCHES } from '@/data/mockStudents';
import { useAuth } from '@/components/auth/AuthContext';

export default function WelcomeHeader({ 
  selectedBatch = 'All Batches', 
  onBatchChange, 
  onRefresh, 
  isRefreshing,
  viewState = 'normal',
  onViewStateChange
}) {
  const [lastUpdated, setLastUpdated] = useState('2 minutes ago');
  const auth = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh();
      setLastUpdated('just now');
    }
  };

  const displayName = auth.user?.name || 'Anurag';

  return (
    <div className="bg-white border-b border-slate-200/80 py-5 transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Welcome Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {getGreeting()}, {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Here&apos;s what needs your attention today across your student cohorts.
            </p>
          </div>

          {/* Controls: Batch Filter, State Switcher & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Batch Selector */}
            <div className="relative inline-flex items-center">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedBatch}
                onChange={(e) => onBatchChange && onBatchChange(e.target.value)}
                className="pl-8 pr-8 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-colors appearance-none"
                aria-label="Filter by Batch"
              >
                {BATCHES.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* UI State Preview Selector (Normal / Loading / Empty / Error) */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium text-slate-600 border border-slate-200/60">
              <span className="px-2 py-0.5 text-slate-400 flex items-center gap-1 font-semibold">
                <Eye className="w-3 h-3" /> State:
              </span>
              {['normal', 'loading', 'empty', 'error'].map((state) => (
                <button
                  key={state}
                  onClick={() => onViewStateChange && onViewStateChange(state)}
                  className={`px-2 py-0.5 rounded capitalize transition-all ${
                    viewState === state
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'hover:text-slate-900 text-slate-500'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>

            {/* Refresh Timestamp & Button */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-400 hidden sm:inline-block">
                Last updated {lastUpdated}
              </span>
              <button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                title="Sync student risk signals"
                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all disabled:opacity-50"
                aria-label="Refresh student data"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
