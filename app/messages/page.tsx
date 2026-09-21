"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import MessagesHeader from '@/components/messages/MessagesHeader';
import MessagesFilterBar from '@/components/messages/MessagesFilterBar';
import MessagesTable from '@/components/messages/MessagesTable';
import MessagesCardList from '@/components/messages/MessagesCardList';
import MessagesEmptyState from '@/components/messages/MessagesEmptyState';
import dynamic from 'next/dynamic';
import { cachedFetch, invalidateCache } from '@/lib/cache';

const MessageDetailModal = dynamic(() => import('@/components/messages/MessageDetailModal'), { ssr: false });
const MessageComposerModal = dynamic(() => import('@/components/messages/MessageComposerModal'), { ssr: false });
const StudentDetailDrawer = dynamic(() => import('@/components/modals/StudentDetailDrawer'), { ssr: false });
const NudgeModal = dynamic(() => import('@/components/modals/NudgeModal'), { ssr: false });

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthContext';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { MOCK_STUDENTS } from '@/data/mockStudents';

export default function MessagesPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [allMessages, setAllMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedResponse, setSelectedResponse] = useState('All Responses');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('All Risk Levels');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');
  const [activeQuickFilter, setActiveQuickFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMessages = useCallback(async (force = false) => {
    if (force) invalidateCache('/api/nudges');
    try {
      const data = await cachedFetch('/api/nudges');
      if (data) setAllMessages(data);
    } catch (err) {
      console.error('Messages fetch error:', err);
    }
  }, []);

  const fetchStudents = useCallback(async (force = false) => {
    if (force) invalidateCache('/api/students');
    try {
      const data = await cachedFetch('/api/students');
      if (data) setStudents(data);
    } catch (err) {
      console.error('Students fetch error:', err);
    }
  }, []);

  // Modal / Drawer state
  const [selectedMessageForDetail, setSelectedMessageForDetail] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitialStudent, setComposerInitialStudent] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [selectedStudentForNudge, setSelectedStudentForNudge] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch on mount
  useEffect(() => {
    fetchMessages();
    fetchStudents();
  }, [fetchMessages, fetchStudents]);

  const handleTabChange = (tab) => {
    if (tab === 'Overview' || tab === 'Risk Signals' || tab === 'Activity' || tab === 'Reports') {
      router.push('/dashboard');
    } else if (tab === 'Students') {
      router.push('/students');
    }
  };

  const summaryMetrics = useMemo(() => {
    const batchMessages = selectedBatch === 'All Batches'
      ? allMessages
      : allMessages.filter((m) => m.batch === selectedBatch);
    const totalSent = batchMessages.filter((m) => m.status !== 'Draft' && m.status !== 'Scheduled').length;
    const delivered = batchMessages.filter((m) => ['Delivered', 'Read', 'Sent'].includes(m.status)).length;
    const read = batchMessages.filter((m) => m.status === 'Read').length;
    const awaitingResponse = batchMessages.filter((m) => m.responseStatus === 'Awaiting Response').length;
    const followupsDue = batchMessages.filter(
      (m) => m.type === 'Follow-up' || (m.riskLevel === 'High' && m.responseStatus === 'Awaiting Response')
    ).length;
    return { totalSent, delivered, read, awaitingResponse, followupsDue };
  }, [allMessages, selectedBatch]);

  // Compute filtered messages
  const filteredMessages = useMemo(() => {
    return allMessages.filter((msg) => {
      // Batch filter
      if (selectedBatch !== 'All Batches' && msg.batch !== selectedBatch) {
        return false;
      }

      // Quick metric card filters
      if (activeQuickFilter === 'DELIVERED') {
        if (!['Delivered', 'Read'].includes(msg.status)) return false;
      } else if (activeQuickFilter === 'READ') {
        if (msg.status !== 'Read') return false;
      } else if (activeQuickFilter === 'AWAITING') {
        if (msg.responseStatus !== 'Awaiting Response') return false;
      } else if (activeQuickFilter === 'FOLLOWUPS') {
        const isFollowup = msg.type === 'Follow-up' || 
          (msg.riskLevel === 'High' && (msg.responseStatus === 'No Response' || msg.responseStatus === 'Awaiting Response'));
        if (!isFollowup) return false;
      }

      // Dropdown filters
      if (selectedType !== 'All Types' && msg.type !== selectedType) return false;
      if (selectedStatus !== 'All Status' && msg.status !== selectedStatus) return false;
      if (selectedResponse !== 'All Responses' && msg.responseStatus !== selectedResponse) return false;
      if (selectedRiskLevel !== 'All Risk Levels' && msg.riskLevel.toLowerCase() !== selectedRiskLevel.toLowerCase()) return false;

      // Origin filter (Automated vs Manual)
      if (selectedOrigin === 'Automated' && !msg.automated) return false;
      if (selectedOrigin === 'Manual' && msg.automated) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = msg.studentName?.toLowerCase().includes(query);
        const matchesEmail = msg.studentEmail?.toLowerCase().includes(query);
        const matchesSubject = msg.subject?.toLowerCase().includes(query);
        const matchesContent = msg.content?.toLowerCase().includes(query);
        const matchesTrigger = msg.trigger?.toLowerCase().includes(query);
        const matchesBatch = msg.batch?.toLowerCase().includes(query);

        if (!matchesName && !matchesEmail && !matchesSubject && !matchesContent && !matchesTrigger && !matchesBatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    allMessages,
    selectedBatch,
    activeQuickFilter,
    selectedType,
    selectedStatus,
    selectedResponse,
    selectedRiskLevel,
    selectedOrigin,
    searchQuery
  ]);

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([fetchMessages(true), fetchStudents(true)]).finally(() => {
      setIsRefreshing(false);
      showToast('Outreach delivery records and responses updated.');
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('All Types');
    setSelectedStatus('All Status');
    setSelectedResponse('All Responses');
    setSelectedRiskLevel('All Risk Levels');
    setSelectedOrigin('All');
    setSelectedDateRange('All Time');
    setActiveQuickFilter('ALL');
  };

  const handleSelectQuickFilter = (key) => {
    if (activeQuickFilter === key) {
      setActiveQuickFilter('ALL');
    } else {
      setActiveQuickFilter(key);
    }
  };

  const handleSendMessage = async (payloads) => {
    const list = Array.isArray(payloads) ? payloads : [payloads];
    try {
      await Promise.all(
        list.map((p) =>
          fetch('/api/nudges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: p.studentId,
              content: p.content,
              subject: p.subject,
              type: p.type ?? 'Check-in',
              requiresResponse: p.requiresResponse ?? true,
              scheduledFor: p.scheduledFor ?? undefined,
            }),
          })
        )
      );
      invalidateCache('/api/nudges');
      invalidateCache('/api/students');
      await fetchMessages(true);
    } catch (err) {
      console.error('Failed to send messages:', err);
    }
    const count = list.length;
    showToast(
      count === 1
        ? `Outreach dispatched successfully to ${list[0].studentName ?? 'student'}.`
        : `Dispatched outreach to ${count} students successfully.`
    );
  };

  const handleOpenComposerForStudent = (msg) => {
    setComposerInitialStudent(msg);
    setIsComposerOpen(true);
  };

  const handleNudgeSent = async (studentId, message) => {
    const student = students.find((s) => s.id === studentId);
    try {
      await fetch('/api/nudges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          content: message,
          subject: 'Educator Nudge: Checking in on your progress',
          type: 'Check-in',
          requiresResponse: true,
        }),
      });
      invalidateCache('/api/nudges');
      invalidateCache('/api/students');
      await fetchMessages(true);
    } catch (err) {
      console.error('Failed to persist nudge:', err);
    }
    showToast(`Nudge sent successfully to ${student ? student.name : 'student'}.`);
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
          activeTab="Messages"
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={logout}
        />

        {/* Main Container */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 sm:py-8 space-y-6">
          
          {/* 1. Header with dynamic summary cards & + New Message */}
          <MessagesHeader
            metrics={summaryMetrics}
            activeQuickFilter={activeQuickFilter}
            onSelectQuickFilter={handleSelectQuickFilter}
            onOpenComposer={() => {
              setComposerInitialStudent(null);
              setIsComposerOpen(true);
            }}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          {/* 2. Comprehensive Filter Bar */}
          <MessagesFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedResponse={selectedResponse}
            onResponseChange={setSelectedResponse}
            selectedRiskLevel={selectedRiskLevel}
            onRiskLevelChange={setSelectedRiskLevel}
            selectedOrigin={selectedOrigin}
            onOriginChange={setSelectedOrigin}
            selectedDateRange={selectedDateRange}
            onDateRangeChange={setSelectedDateRange}
            onClearFilters={handleClearFilters}
            totalResults={filteredMessages.length}
            totalCount={allMessages.length}
          />

          {/* 3. Messages List / Empty State */}
          {allMessages.length === 0 ? (
            <MessagesEmptyState
              type="no_messages"
              onAction={() => {
                setComposerInitialStudent(null);
                setIsComposerOpen(true);
              }}
            />
          ) : filteredMessages.length === 0 ? (
            <MessagesEmptyState
              type="no_results"
              onResetFilters={handleClearFilters}
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <MessagesTable
                  messages={filteredMessages}
                  onSelectMessage={(msg) => setSelectedMessageForDetail(msg)}
                  onOpenComposerForStudent={handleOpenComposerForStudent}
                  onViewStudentProfile={(studentId) => {
                    const found = students.find(s => s.id === studentId);
                    if (found) setSelectedStudentForDetail(found);
                  }}
                />
              </div>

              {/* Mobile & Tablet Cards View */}
              <div className="md:hidden">
                <MessagesCardList
                  messages={filteredMessages}
                  onSelectMessage={(msg) => setSelectedMessageForDetail(msg)}
                  onOpenComposerForStudent={handleOpenComposerForStudent}
                />
              </div>
            </>
          )}

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
              <span>Messages & Outreach Console</span>
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

        {/* Detail Modal */}
        <MessageDetailModal
          isOpen={!!selectedMessageForDetail}
          onClose={() => setSelectedMessageForDetail(null)}
          message={selectedMessageForDetail}
          onOpenComposerForStudent={handleOpenComposerForStudent}
          onViewStudentProfile={(studentId) => {
            const found = students.find(s => s.id === studentId);
            if (found) {
              setSelectedMessageForDetail(null);
              setSelectedStudentForDetail(found);
            }
          }}
        />

        {/* Composer Modal */}
        <MessageComposerModal
          isOpen={isComposerOpen}
          onClose={() => {
            setIsComposerOpen(false);
            setComposerInitialStudent(null);
          }}
          initialStudent={composerInitialStudent}
          students={students}
          onSendMessage={handleSendMessage}
        />

        {/* Student Detail Drawer */}
        <StudentDetailDrawer
          isOpen={!!selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          student={selectedStudentForDetail}
          onOpenNudge={(student) => setSelectedStudentForNudge(student)}
        />

        {/* Nudge Modal */}
        <NudgeModal
          isOpen={!!selectedStudentForNudge}
          onClose={() => setSelectedStudentForNudge(null)}
          student={selectedStudentForNudge}
          onSendNudge={handleNudgeSent}
        />

      </div>
    </ProtectedRoute>
  );
}
