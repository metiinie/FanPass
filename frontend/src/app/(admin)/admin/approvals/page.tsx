"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/apiClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { VERIFICATION_STATUS_LABELS, REJECTION_REASONS } from "@/lib/constants";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, RefreshCw, ZoomIn } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SubmissionListItem, GlobalApprovalStats } from "@/types";

export default function AdminApprovalsDashboard() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [stats, setStats] = useState<GlobalApprovalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"needs_review" | "approved" | "rejected">("needs_review");
  const [selectedItem, setSelectedItem] = useState<SubmissionListItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchData = async (showSilently = false) => {
    if (!showSilently) setIsLoading(true);
    try {
      const [submissionsData, statsData] = await Promise.all([
        fetchBackend(`/admin/approvals?status=${activeTab}`),
        fetchBackend(`/admin/approvals/stats`),
      ]);
      setSubmissions(submissionsData.submissions);
      setStats(statsData);
      
      if (selectedItem) {
        const stillExists = submissionsData.submissions.find((s: SubmissionListItem) => s.id === selectedItem.id);
        if (stillExists) setSelectedItem(stillExists);
        else setSelectedItem(submissionsData.submissions[0] || null);
      } else if (submissionsData.submissions.length > 0) {
        setSelectedItem(submissionsData.submissions[0]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    let interval: NodeJS.Timeout;
    if (activeTab === "needs_review") {
      interval = setInterval(() => fetchData(true), 15000); // 15s polling for global admin
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      await fetchBackend(`/tickets/${selectedItem.id}/approve`, { method: "POST" });
      toast.success("Ticket approved & issued!");
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve ticket");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason) return;
    setIsProcessing(true);
    try {
      await fetchBackend(`/tickets/${selectedItem.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectionReason })
      });
      toast.success("Submission rejected");
      setShowRejectModal(false);
      setRejectionReason("");
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject submission");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-full flex flex-col -m-6 md:-m-8">
      {/* Header */}
      <div className="p-6 border-b border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-[#111827]">Global Approvals</h1>
            <p className="text-sm text-[#6B7280]">Review submissions across all events</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {stats && (
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-500 mr-4">
              <span>Pending: <strong className="text-yellow-600">{stats.needsReview}</strong></span>
              <span>Avg Time: <strong>{stats.avgApprovalMinutes}m</strong></span>
            </div>
          )}
          <button onClick={() => fetchData(false)} className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: List */}
        <div className="w-full md:w-96 bg-gray-50 border-r border-[#E5E7EB] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#E5E7EB] bg-white">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab("needs_review")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "needs_review" ? "bg-[#111827] text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Review
              </button>
              <button 
                onClick={() => setActiveTab("approved")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "approved" ? "bg-[#111827] text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Approved
              </button>
              <button 
                onClick={() => setActiveTab("rejected")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "rejected" ? "bg-[#111827] text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Rejected
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#111827]" /></div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No submissions found.
              </div>
            ) : (
              submissions.map(sub => (
                <div 
                  key={sub.id}
                  onClick={() => setSelectedItem(sub)}
                  className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                    selectedItem?.id === sub.id 
                      ? "border-[#111827] bg-white shadow-sm" 
                      : "border-transparent bg-white shadow-sm hover:border-gray-300"
                  } ${sub.verificationStatus === "AI_FLAGGED" ? "border-l-4 border-l-orange-500" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="truncate">
                      <p className="font-bold text-[#111827] truncate">{sub.buyerName || sub.buyerPhone}</p>
                      <p className="text-xs text-gray-500 truncate">{sub.event.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 shrink-0 ml-2">{new Date(sub.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-gray-600">{sub.ticketCount} Ticket(s)</p>
                      <p className="text-xs font-medium text-[#1A7A4A] mt-1">{formatCurrency((sub.event.expectedAmount || 0) * sub.ticketCount, sub.event.currency)}</p>
                    </div>
                    {sub.verificationStatus === "AI_FLAGGED" && (
                      <span className="text-[10px] font-bold uppercase px-2 py-1 bg-orange-100 text-orange-700 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Detail View */}
        <div className="flex-1 bg-white hidden md:flex flex-col">
          {!selectedItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a submission to review</p>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold font-['Outfit']">{selectedItem.buyerName}</h2>
                  <p className="text-[#6B7280]">{selectedItem.buyerPhone}</p>
                  <p className="text-xs font-medium text-[#1A7A4A] mt-1 bg-[#1A7A4A]/10 inline-block px-2 py-0.5 rounded">Event: {selectedItem.event.title}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${VERIFICATION_STATUS_LABELS[selectedItem.verificationStatus].bgColor} ${VERIFICATION_STATUS_LABELS[selectedItem.verificationStatus].color}`}>
                    {VERIFICATION_STATUS_LABELS[selectedItem.verificationStatus].label}
                  </div>
                  <p className="text-sm mt-2 font-bold text-[#111827]">
                    Expected: {formatCurrency((selectedItem.event.expectedAmount || 0) * selectedItem.ticketCount, selectedItem.event.currency)}
                  </p>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 flex gap-6">
                
                {/* Image Viewer */}
                <div className="w-1/2 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
                  <div className="p-3 border-b border-gray-200 bg-white font-medium text-sm text-gray-700 flex justify-between items-center">
                    Receipt Screenshot
                    <a href={selectedItem.screenshotUrl || "#"} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-gray-100 rounded-md">
                      <ZoomIn className="w-4 h-4 text-gray-500" />
                    </a>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedItem.screenshotUrl || ""} 
                      alt="Receipt" 
                      className="max-w-full rounded-lg shadow-sm"
                    />
                  </div>
                </div>

                {/* AI Extraction Data */}
                <div className="w-1/2 space-y-6">
                  <div>
                    <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-[#111827]/10 text-[#111827] flex items-center justify-center text-xs">AI</span>
                      Extracted Data
                    </h3>
                    
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <tbody className="divide-y divide-[#E5E7EB]">
                          <tr>
                            <th className="px-4 py-3 bg-gray-50 font-medium text-gray-500 w-1/3">Amount</th>
                            <td className="px-4 py-3 font-bold">
                              {selectedItem.extractedAmount 
                                ? formatCurrency(selectedItem.extractedAmount, selectedItem.event.currency) 
                                : <span className="text-red-500">Not detected</span>
                              }
                              {selectedItem.extractedAmount !== null && selectedItem.extractedAmount !== (selectedItem.event.expectedAmount || 0) * selectedItem.ticketCount && (
                                <span className="ml-2 text-xs text-red-500 font-medium">(Mismatch)</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 bg-gray-50 font-medium text-gray-500">Sender Name</th>
                            <td className="px-4 py-3">{selectedItem.extractedSenderName || <span className="text-gray-400">Not detected</span>}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 bg-gray-50 font-medium text-gray-500">Date</th>
                            <td className="px-4 py-3">{selectedItem.extractedDate || <span className="text-gray-400">Not detected</span>}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 bg-gray-50 font-medium text-gray-500">Reference #</th>
                            <td className="px-4 py-3 font-mono">{selectedItem.extractedRef || <span className="text-gray-400">Not detected</span>}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI Confidence & Flags */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">AI Confidence</span>
                      <span className={`text-sm font-bold ${(selectedItem.aiConfidenceScore || 0) > 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
                        {Math.round((selectedItem.aiConfidenceScore || 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div className={`h-2 rounded-full ${(selectedItem.aiConfidenceScore || 0) > 0.8 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.round((selectedItem.aiConfidenceScore || 0) * 100)}%` }}></div>
                    </div>
                    
                    {(() => {
                      const raw = selectedItem.aiRawText ? JSON.parse(selectedItem.aiRawText) : null;
                      const flags = raw?.flags || [];
                      if (flags.length > 0) {
                        return (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase">Flags</p>
                            <ul className="space-y-1">
                              {flags.map((f: string, i: number) => (
                                <li key={i} className="text-sm text-orange-700 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4" /> {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> No flags detected</p>;
                    })()}
                  </div>

                  {/* Reject Reason Display */}
                  {selectedItem.verificationStatus === "REJECTED" && (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-600">{selectedItem.rejectionReason}</p>
                    </div>
                  )}

                </div>
              </div>

              {/* Action Footer */}
              {(selectedItem.verificationStatus === "PENDING" || selectedItem.verificationStatus === "AI_FLAGGED") && (
                <div className="p-6 border-t border-[#E5E7EB] bg-gray-50 flex gap-4">
                  <button 
                    onClick={() => setShowRejectModal(true)}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 rounded-xl font-bold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-[2] py-3.5 rounded-xl font-bold bg-[#111827] text-white hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Approve & Issue Ticket</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold font-['Outfit'] mb-2">Reject Submission</h3>
            <p className="text-gray-500 text-sm mb-6">Select a reason to inform the fan why their payment was rejected.</p>
            
            <div className="space-y-3 mb-6">
              {REJECTION_REASONS.map(reason => (
                <label key={reason} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${rejectionReason === reason ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}>
                  <input type="radio" name="reason" value={reason} checked={rejectionReason === reason} onChange={() => setRejectionReason(reason)} className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-gray-900">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50">Cancel</button>
              <button onClick={handleReject} disabled={!rejectionReason || isProcessing} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex justify-center">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
