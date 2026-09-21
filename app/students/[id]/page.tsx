"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthContext';
import { getRiskCategory } from '@/data/mockStudents';
import NudgeModal from '@/components/modals/NudgeModal';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Calendar, 
  BookOpen, 
  TrendingDown, 
  Activity, 
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { logout } = useAuth();

  const studentId = params?.id;
  const [student, setStudent] = useState(null);
  const [isNudgeOpen, setIsNudgeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [studentMessages, setStudentMessages] = useState([]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    if (!studentId) return;

    // Fetch real student profile from API
    fetch(`/api/students/${studentId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setStudent(data); })
      .catch((err) => console.error('Student profile fetch error:', err));

    // Fetch nudges (outreach history) for this student
    fetch(`/api/nudges?studentId=${studentId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStudentMessages(data))
      .catch((err) => console.error('Nudges fetch error:', err));
  }, [studentId]);

  if (!student) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <p className="text-sm text-slate-500">Loading student profile...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const isHighRisk = student.statusCategory === 'HIGH';
  const Q = student.quizCompletionRate;
  const inactiveDays = student.inactiveDays;
  const L = Math.min(100, inactiveDays * 25);
  const quizFactor = Math.round(0.6 * (100 - Q));
  const inactivityFactor = Math.round(0.4 * L);

  const handleNudgeSent = async (_id, message) => {
    try {
      await fetch('/api/nudges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          content: message,
          subject: 'Educator Nudge: Checking in on your progress',
          type: 'Check-in',
          requiresResponse: true,
        }),
      });
      // Re-fetch nudges to update history
      const res = await fetch(`/api/nudges?studentId=${student.id}`);
      if (res.ok) setStudentMessages(await res.json());
    } catch (err) {
      console.error('Failed to persist nudge:', err);
    }
    showToast(`Nudge sent successfully to ${student.name}.`);
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

        <Navbar
          activeTab="Students"
          onTabChange={(tab) => {
            if (tab === 'Overview') router.push('/dashboard');
            else if (tab === 'Messages') router.push('/messages');
            else if (tab === 'Students') router.push('/students');
          }}
          onLogout={logout}
        />

        {/* Back Link & Breadcrumb Header */}
        <div className="bg-white border-b border-slate-200/80 py-4 sm:py-6">
          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
            <button
              onClick={() => router.push('/students')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors mb-3 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Students Directory</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl font-bold text-base flex items-center justify-center shrink-0 shadow-xs ${
                  isHighRisk
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : student.statusCategory === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {student.avatar}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {student.name}
                    </h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isHighRisk 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {student.status} (Score: {student.riskScore})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {student.batch} • {student.email} • Last Active: <strong>{student.lastActive}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNudgeOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all w-full sm:w-auto"
              >
                <Send className="w-4 h-4" />
                <span>Reach Out / Send Nudge</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 sm:py-8 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Mathematical Model, Signals & History (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Formula Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    Retention Risk Formula Breakdown
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                    R(t) = min(100, 0.6 × (100 − Q) + 0.4 × L)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Quiz Deficit (60% weight)</span>
                    <p className="text-lg font-bold text-slate-900 mt-1">+{quizFactor} pts</p>
                    <p className="text-xs text-slate-500 mt-0.5">Quiz Completion rate: <strong>{Q}%</strong></p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Inactivity Factor (40% weight)</span>
                    <p className="text-lg font-bold text-rose-600 mt-1">+{inactivityFactor} pts</p>
                    <p className="text-xs text-slate-500 mt-0.5">Inactivity penalty: <strong>L = {L}</strong> ({inactiveDays} days)</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  <span>Current Calculated Retention Risk:</span>
                  <strong className={`text-base ${isHighRisk ? 'text-rose-700' : 'text-amber-700'}`}>
                    {student.riskScore} / 100
                  </strong>
                </div>
              </div>

              {/* Warning Signals */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Active Warning Signals ({student.signals?.length || 0})
                </h3>

                <div className="space-y-2">
                  {student.signals?.map((sig) => (
                    <div 
                      key={sig.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                        sig.severity === 'high'
                          ? 'bg-rose-50 text-rose-800 border-rose-100'
                          : 'bg-amber-50 text-amber-800 border-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{sig.text}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white rounded border">
                        {sig.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Week Trajectory */}
              {student.details?.riskHistory && (
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      5-Week Risk Trajectory
                    </h3>
                    <span className="text-xs text-rose-600 font-bold capitalize">
                      Trend: {student.details.trend}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-end justify-between h-24 gap-3 pt-2">
                      {student.details.riskHistory.map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700">{val}</span>
                          <div 
                            style={{ height: `${(val / 100) * 60}px` }} 
                            className={`w-full rounded-t-md ${
                              val >= 70 ? 'bg-rose-500' : val >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} 
                          />
                          <span className="text-[10px] text-slate-400 font-medium">W{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Academic Summary & Outreach History (Span 5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Academic Metrics */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Academic & Learning Summary
                </h3>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[11px]">Quizzes Attempted</span>
                    <p className="text-base font-bold text-slate-900 mt-1">
                      {student.details?.quizzesAttempted || 2} / {student.details?.totalQuizzes || 8}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[11px]">Average Score</span>
                    <p className="text-base font-bold text-slate-900 mt-1">
                      {student.details?.averageScore || 44}%
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[11px]">Missed Deadlines</span>
                    <p className="text-base font-bold text-rose-600 mt-1">
                      {student.details?.missedDeadlines || 3} items
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[11px]">Last Activity</span>
                    <p className="text-base font-bold text-slate-900 mt-1">
                      {student.lastActive}
                    </p>
                  </div>
                </div>

                {student.details?.notes && (
                  <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <strong className="block mb-0.5">Educator Observation:</strong>
                    {student.details.notes}
                  </div>
                )}
              </div>

              {/* Outreach History Feed */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Communication History ({studentMessages.length})
                  </h3>
                  <button
                    onClick={() => router.push('/messages')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                  >
                    View in console &rarr;
                  </button>
                </div>

                {studentMessages.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    No outreach records yet for this student.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {studentMessages.map((msg) => (
                      <div key={msg.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{msg.type}</span>
                          <span className="text-[10px] text-slate-400">{msg.sentAt}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 italic">
                          &quot;{msg.content}&quot;
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>Status: <strong className="text-emerald-600">{msg.status}</strong></span>
                          <span>•</span>
                          <span>Response: <strong className="text-slate-600">{msg.responseStatus}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </main>

        {/* Nudge Modal */}
        <NudgeModal
          isOpen={isNudgeOpen}
          onClose={() => setIsNudgeOpen(false)}
          student={student}
          onSendNudge={handleNudgeSent}
        />

      </div>
    </ProtectedRoute>
  );
}
