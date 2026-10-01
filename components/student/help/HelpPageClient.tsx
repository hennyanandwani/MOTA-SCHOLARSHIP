'use client';

import { useState, useEffect, useRef } from 'react';
import { HelpHeader } from '@/components/student/help/HelpHeader';
import { HelpSearch } from '@/components/student/help/HelpSearch';
import { HelpCategories } from '@/components/student/help/HelpCategories';
import { PopularTopics } from '@/components/student/help/PopularTopics';
import { HelpFAQ } from '@/components/student/help/HelpFAQ';
import { ApplicationGuidance } from '@/components/student/help/ApplicationGuidance';
import { SupportForm } from '@/components/student/help/SupportForm';
import { SupportRequestsList } from '@/components/student/help/SupportRequestsList';
import { SupportRequestModal } from '@/components/student/help/SupportRequestModal';
import { RecentlyViewed } from '@/components/student/help/RecentlyViewed';
import { OfficialInfoCard } from '@/components/student/help/OfficialInfoCard';
import {
  POPULAR_TOPICS,
  FAQ_DATA,
  HELP_CATEGORIES,
} from '@/lib/helpContent';
import {
  getSupportRequests,
  saveSupportRequest,
  updateSupportRequestStatus,
  deleteSupportRequest,
  getRecentHelpHistory,
  addRecentHelpHistory,
  clearRecentHelpHistory,
  type SupportRequest,
} from '@/lib/studentSupport';

export function HelpPageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<string[]>(['pop-how-to-apply']);
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>(['faq-app-1']);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [recentTopicIds, setRecentTopicIds] = useState<string[]>([]);

  const faqSectionRef = useRef<HTMLDivElement>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  // Load initial data on mount
  useEffect(() => {
    setSupportRequests(getSupportRequests());
    setRecentTopicIds(getRecentHelpHistory());
  }, []);

  // Calculate total search matches
  const query = searchQuery.trim().toLowerCase();
  const matchingPopularCount = POPULAR_TOPICS.filter((t) => {
    const matchesCat = !selectedCategory || t.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesQ =
      !query ||
      t.title.toLowerCase().includes(query) ||
      t.summary.toLowerCase().includes(query) ||
      t.details.some((d) => d.toLowerCase().includes(query));
    return matchesCat && matchesQ;
  }).length;

  const matchingFaqCount = FAQ_DATA.filter((f) => {
    const matchesCat = !selectedCategory || f.categoryId === selectedCategory;
    const matchesQ =
      !query ||
      f.question.toLowerCase().includes(query) ||
      f.categoryName.toLowerCase().includes(query) ||
      f.answer.some((a) => a.toLowerCase().includes(query));
    return matchesCat && matchesQ;
  }).length;

  const totalResults = matchingPopularCount + matchingFaqCount;
  const isFiltering = Boolean(query || selectedCategory);

  function handleSelectCategory(catId: string | null) {
    setSelectedCategory(catId);
    if (catId) {
      // If category selected, scroll gently to FAQs section
      faqSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleToggleTopic(id: string) {
    setExpandedTopics((prev) => {
      const isCurrentlyOpen = prev.includes(id);
      if (isCurrentlyOpen) {
        return prev.filter((item) => item !== id);
      } else {
        const updatedHistory = addRecentHelpHistory(id);
        setRecentTopicIds(updatedHistory);
        return [...prev, id];
      }
    });
  }

  function handleToggleFaq(id: string) {
    setExpandedFaqs((prev) => {
      const isCurrentlyOpen = prev.includes(id);
      if (isCurrentlyOpen) {
        return prev.filter((item) => item !== id);
      } else {
        const updatedHistory = addRecentHelpHistory(id);
        setRecentTopicIds(updatedHistory);
        return [...prev, id];
      }
    });
  }

  function handleSelectRecentTopic(id: string) {
    if (POPULAR_TOPICS.some((p) => p.id === id)) {
      if (!expandedTopics.includes(id)) {
        setExpandedTopics((prev) => [...prev, id]);
      }
      const el = document.getElementById(`button-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (FAQ_DATA.some((f) => f.id === id)) {
      if (!expandedFaqs.includes(id)) {
        setExpandedFaqs((prev) => [...prev, id]);
      }
      const el = document.getElementById(`faq-btn-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function handleClearHistory() {
    clearRecentHelpHistory();
    setRecentTopicIds([]);
  }

  function handleSubmitSupportRequest(data: {
    category: string;
    subject: string;
    description: string;
    applicationId?: string;
  }) {
    const saved = saveSupportRequest(data);
    setSupportRequests((prev) => [saved, ...prev]);
    setCreatedTicketId(saved.id);

    // Scroll to success notification / form top
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleToggleStatus(id: string, nextStatus: 'submitted' | 'resolved') {
    const updated = updateSupportRequestStatus(id, nextStatus);
    if (updated) {
      setSupportRequests((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      );
      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    }
  }

  function handleDeleteRequest(id: string) {
    const success = deleteSupportRequest(id);
    if (success) {
      setSupportRequests((prev) => prev.filter((item) => item.id !== id));
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      {/* Page Header */}
      <HelpHeader />

      {/* Search Bar */}
      <HelpSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        totalResults={totalResults}
        isFiltering={isFiltering}
      />

      {/* Recently Viewed (if any) */}
      <RecentlyViewed
        recentTopicIds={recentTopicIds}
        onSelectTopic={handleSelectRecentTopic}
        onClearHistory={handleClearHistory}
      />

      {/* Quick Help Categories */}
      <HelpCategories
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Popular Help Topics */}
      <PopularTopics
        expandedTopics={expandedTopics}
        onToggleTopic={handleToggleTopic}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
      />

      {/* Frequently Asked Questions */}
      <div ref={faqSectionRef}>
        <HelpFAQ
          expandedFaqs={expandedFaqs}
          onToggleFaq={handleToggleFaq}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
        />
      </div>

      {/* Application Support Guidance (5-step checkpoint) */}
      <ApplicationGuidance />

      {/* Support Request Form & Stored Requests */}
      <div ref={formSectionRef} className="space-y-6">
        <SupportForm
          onSubmitSuccess={handleSubmitSupportRequest}
          createdTicketId={createdTicketId}
        />

        <SupportRequestsList
          requests={supportRequests}
          onSelectRequest={setSelectedRequest}
          onToggleStatus={handleToggleStatus}
          onDeleteRequest={handleDeleteRequest}
        />
      </div>

      {/* Official Communication Notice & Governance/AI Disclaimer */}
      <OfficialInfoCard />

      {/* Ticket Details Dialog */}
      <SupportRequestModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteRequest}
      />
    </div>
  );
}