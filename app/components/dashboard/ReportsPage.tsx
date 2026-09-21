"use client";

import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Activity, BookOpen, Clock, Award,
  Calendar, Filter, Download
} from 'lucide-react';

interface BatchMetric {
  name: string;
  total: number;
  avgRisk: number;
  quizComp: string;
  highRisk: number;
  status: 'Critical' | 'Moderate' | 'Stable' | 'Healthy';
}

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

interface ReportsPageProps {
  students: Student[];
  selectedBatch: string;
  reportRange: string;
  onReportRangeChange: (range: string) => void;
  onBatchChange: (batch: string) => void;
  onExportReport: () => void;
}

export default function ReportsPage({
  students,
  selectedBatch,
  reportRange,
  onReportRangeChange,
  onBatchChange,
  onExportReport,
}: ReportsPageProps) {
  
  // Calculate metrics based on selected batch
  const batchStudents = useMemo(() => {
    return selectedBatch === 'All Batches'
      ? students
      : students.filter(s => s.batch.includes(selectedBatch.replace(' Batch', '')));
  }, [students, selectedBatch]);

  const metrics = useMemo(() => {
    const total = batchStudents.length;
    const highRisk = batchStudents.filter(s => s.riskScore >= 70).length;
    const mediumRisk = batchStudents.filter(s => s.riskScore >= 40 && s.riskScore < 70).length;
    const lowRisk = batchStudents.filter(s => s.riskScore < 40).length;

    // Calculate percentages for health metrics
    const quizCompletionRate = total > 0
      ? Math.round(batchStudents.reduce((sum, s) => sum + (Number.isFinite(s.quizCompletionRate) ? s.quizCompletionRate : 0), 0) / total)
      : 0;

    const avgInactiveDays = total > 0
      ? (batchStudents.reduce((sum, s) => sum + s.inactiveDays, 0) / total).toFixed(1)
      : 0;

    return {
      totalStudents: total,
      highRisk,
      mediumRisk,
      lowRisk,
      cohortHealthScore: total > 0
        ? Math.round((lowRisk / total) * 100 + (mediumRisk / total) * 50)
        : 0,
      quizCompletionRate,
      avgInactiveDays,
      interventionSuccess: 84.6, // Based on attachment
      nudgesSent: 48, // Based on attachment
    };
  }, [batchStudents]);

  // Batch-wise metrics
  const batchMetrics: BatchMetric[] = [
    { name: 'Batch 03 - 2026', total: 22, avgRisk: 82, quizComp: '24%', highRisk: 12, status: 'Critical' },
    { name: 'Batch 06 - 2026', total: 18, avgRisk: 68, quizComp: '52%', highRisk: 7, status: 'Moderate' },
    { name: 'Batch 09 - 2026', total: 20, avgRisk: 45, quizComp: '78%', highRisk: 4, status: 'Stable' },
    { name: 'Batch 12 - 2026', total: 20, avgRisk: 55, quizComp: '61%', highRisk: 6, status: 'Moderate' },
    { name: 'Batch 15 - 2026', total: 20, avgRisk: 26, quizComp: '89%', highRisk: 4, status: 'Healthy' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-rose-100 text-rose-700 bg-rose-600';
      case 'Moderate':
        return 'bg-amber-100 text-amber-700 bg-amber-600';
      case 'Stable':
        return 'bg-emerald-100 text-emerald-700 bg-emerald-600';
      case 'Healthy':
        return 'bg-emerald-100 text-emerald-700 bg-emerald-600';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Sub-header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Comprehensive analytics, cohort trajectories, and engagement metrics.</h2>
          {/* <p className="text-xs text-slate-500 mt-0.5">Comprehensive analytics, cohort trajectories, and engagement metrics.</p> */}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={reportRange}
              onChange={(e) => onReportRangeChange(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold cursor-pointer"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Quarterly (Q1 2026)</option>
              <option>Year-to-Date</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBatch}
              onChange={(e) => onBatchChange(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold cursor-pointer"
            >
              <option>All Batches</option>
              <option>Batch 03</option>
              <option>Batch 06</option>
              <option>Batch 09</option>
              <option>Batch 12</option>
              <option>Batch 15</option>
            </select>
          </div>

          {/* <button
            onClick={onExportReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button> */}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cohort Health Score</span>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.cohortHealthScore}%</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>+4.2% vs previous period</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quiz Completion Rate</span>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.quizCompletionRate}%</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>+6.8% engagement</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Inactive Days</span>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.avgInactiveDays} Days</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
            <TrendingDown className="w-4 h-4" />
            <span>-1.5 days turnaround</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Retention Intervention Success</span>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.interventionSuccess}%</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>Based on {metrics.nudgesSent} nudges sent</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div>
        {/* Risk Distribution Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Risk Tier Distribution</h3>
                <p className="text-xs text-slate-500">Breakdown of student cohort health across risk thresholds</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                {batchStudents.length} Active Students
              </span>
            </div>

            {/* Visual Bar Distribution */}
            <div className="space-y-4 my-6">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Healthy (Score &lt; 40)
                  </span>
                  <span className="text-slate-700">{metrics.lowRisk} Students ({batchStudents.length > 0 ? Math.round((metrics.lowRisk / batchStudents.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: batchStudents.length > 0 ? `${(metrics.lowRisk / batchStudents.length) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium Risk (Score 40 - 69)
                  </span>
                  <span className="text-slate-700">{metrics.mediumRisk} Students ({batchStudents.length > 0 ? Math.round((metrics.mediumRisk / batchStudents.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: batchStudents.length > 0 ? `${(metrics.mediumRisk / batchStudents.length) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High Risk (Score 70 - 100)
                  </span>
                  <span className="text-slate-700">{metrics.highRisk} Students ({batchStudents.length > 0 ? Math.round((metrics.highRisk / batchStudents.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: batchStudents.length > 0 ? `${(metrics.highRisk / batchStudents.length) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Detailed Batch Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Batch-wise Retention & Risk Summary</h3>
            <p className="text-xs text-slate-500">Comparative performance metrics across all active Unacademy batches</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Showing {batchMetrics.length} Batches</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">BATCH NAME</th>
                <th className="py-3 px-4">TOTAL STUDENTS</th>
                <th className="py-3 px-4">AVG RISK SCORE</th>
                <th className="py-3 px-4">QUIZ COMPLETION</th>
                <th className="py-3 px-4">HIGH RISK COUNT</th>
                <th className="py-3 px-4">HEALTH STATUS</th>
                {/* <th className="py-3 px-4 text-right">ACTION</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batchMetrics.map((batch, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{batch.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{batch.total}</td>
                  <td className="py-3.5 px-4 font-bold">
                    <span className={`px-2 py-0.5 rounded-md ${
                      batch.avgRisk > 75 ? 'bg-rose-50 text-rose-700' :
                      batch.avgRisk >= 45 ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {batch.avgRisk} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{batch.quizComp}</td>
                  <td className="py-3.5 px-4 text-rose-600 font-bold">{batch.highRisk} Students</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      batch.status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                      batch.status === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        batch.status === 'Critical' ? 'bg-rose-600' :
                        batch.status === 'Moderate' ? 'bg-amber-600' :
                        'bg-emerald-600'
                      }`}></span>
                      {batch.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {/* <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"> */}
                      {/* Inspect Batch */}
                    {/* </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
