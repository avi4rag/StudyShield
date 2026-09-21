"use client";

import React from 'react';
import { 
  Clock, 
  HelpCircle, 
  LogIn, 
  ChevronRight, 
  AlertTriangle
} from 'lucide-react';
import { EARLY_WARNING_SIGNALS } from '@/data/dashboardMetrics';

export default function EarlyWarningSignals({ onSelectSignal, signals = EARLY_WARNING_SIGNALS }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Clock':
        return <Clock className="w-5 h-5 text-rose-600" />;
      case 'HelpCircle':
        return <HelpCircle className="w-5 h-5 text-amber-600" />;
      case 'LogIn':   
        return <LogIn className="w-5 h-5 text-slate-700" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  const getBgStyle = (severity) => {
    if (severity === 'high') {
      return {
        cardBg: 'bg-white hover:border-rose-300',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/60',
        iconBg: 'bg-rose-50 border-rose-100'
      };
    }
    return {
      cardBg: 'bg-white hover:border-amber-300',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/60',
      iconBg: 'bg-amber-50 border-amber-100'
    };
  };

  return (
    <section className="mt-8" aria-labelledby="early-warning-heading">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
        <div>
          <h2 id="early-warning-heading" className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Risk Signals
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Intervention queue
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Behavior changes that can raise R(t) before a student becomes high risk.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {signals.map((signal) => {
          const style = getBgStyle(signal.severity);

          return (
            <div
              key={signal.id}
              onClick={() => onSelectSignal && onSelectSignal(signal.filterKey)}
              className={`rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between ${style.cardBg} group`}
            >
              <div>
                {/* Top row: Icon & Trend */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${style.iconBg} group-hover:scale-105 transition-transform`}>
                    {getIcon(signal.icon)}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${style.badgeBg}`}>
                    {signal.trend}
                  </span>
                </div>

                {/* Trigger and its intervention context */}
                <h3 className="mt-3.5 text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {signal.title}
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 min-h-9">
                  {signal.description}
                </p>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-900 font-sans">
                    {signal.count}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {signal.unit}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Recommended next step
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {signal.action}
                  </p>
                </div>
              </div>

              {/* Bottom Action */}
              {/* <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                <span>Review flagged students</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div> */}
            </div>
          );
        })}
      </div>

    </section>
  );
}
