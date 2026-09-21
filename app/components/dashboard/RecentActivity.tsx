"use client";

import React from "react";
import {
  AlertTriangle,
  FileX,
  TrendingDown,
  FileText,
  Clock,
  ChevronRight,
  Activity,
} from "lucide-react";
import { RECENT_ACTIVITY_FEED } from "@/data/dashboardMetrics";

export default function RecentActivity({
  onViewAllActivity,
  onSelectStudentActivity,
  activities = RECENT_ACTIVITY_FEED,
}) {
  const getIcon = (type) => {
    switch (type) {
      case "risk_change":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case "missed_quiz":
        return <FileX className="w-4 h-4 text-amber-600" />;
      case "batch_trend":
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      case "report":
        return <FileText className="w-4 h-4 text-emerald-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "risk_change":
        return "bg-rose-50 border-rose-100";
      case "missed_quiz":
        return "bg-amber-50 border-amber-100";
      case "batch_trend":
        return "bg-rose-50 border-rose-100";
      case "report":
        return "bg-emerald-50 border-emerald-100";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Activity
              </h3>
              <p className="text-xs text-slate-500">
                Latest risk updates & learner events
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Realtime
          </span>
        </div>

        {/* Activity Feed List */}
        <div className="divide-y divide-slate-100">
          {activities.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                onSelectStudentActivity && onSelectStudentActivity(item)
              }
              className="py-3 first:pt-0 last:pb-0 hover:bg-slate-50/70 p-2 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${getIconBg(item.type)}`}
                >
                  {getIcon(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      <strong className="text-slate-900 font-bold">
                        {item.student}
                      </strong>{" "}
                      {item.action}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {item.details}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
        <button
          onClick={() => onViewAllActivity && onViewAllActivity()}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          <span>View complete history</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
