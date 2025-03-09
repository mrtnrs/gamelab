"use client";

import { useState, useEffect } from "react";
import { getGameSubmissions, approveGameSubmission, rejectGameSubmission } from "@/actions/admin-actions";
import { toast } from "react-hot-toast";

interface Submission {
  id: string;
  game_id: string;
  game_title: string;
  developer: string;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
}

export default function SubmissionsClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submissionToReject, setSubmissionToReject] = useState<string | null>(null);

  // Fetch submissions on component mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Fetch submissions from server action
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const result = await getGameSubmissions(10);
      if (result.error) {
        toast.error(result.error);
      } else if (result.submissions) {
        setSubmissions(result.submissions as Submission[]);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  // Handle approving a submission
  const handleApprove = async (submissionId: string) => {
    try {
      const result = await approveGameSubmission(submissionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Game approved successfully");
        fetchSubmissions(); // Refresh the list
      }
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Failed to approve game");
    }
  };

  // Open the rejection modal
  const openRejectModal = (submissionId: string) => {
    setSubmissionToReject(submissionId);
    setRejectionReason("");
  };

  // Close the rejection modal
  const closeRejectModal = () => {
    setSubmissionToReject(null);
    setRejectionReason("");
  };

  // Handle rejecting a submission
  const handleReject = async () => {
    if (!submissionToReject || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      const result = await rejectGameSubmission(submissionToReject, rejectionReason);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Game rejected");
        closeRejectModal();
        fetchSubmissions(); // Refresh the list
      }
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Failed to reject game");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">No Pending Submissions</h2>
        <p className="text-muted-foreground">There are no game submissions to review at this time.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Game Submissions</h2>
      
      <div className="space-y-6">
        {submissions.map((submission) => (
          <div 
            key={submission.id} 
            className="bg-card rounded-lg shadow p-6 border border-border"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{submission.game_title}</h3>
                <p className="text-muted-foreground">
                  By {submission.developer} • Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                {submission.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(submission.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(submission.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {submission.status === "approved" && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md">
                    Approved
                  </span>
                )}
                {submission.status === "rejected" && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-md">
                    Rejected
                  </span>
                )}
              </div>
            </div>
            
            {submission.status === "rejected" && submission.rejection_reason && (
              <div className="mt-2 p-3 bg-red-50 rounded-md">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Reason for rejection:</span> {submission.rejection_reason}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {submissionToReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Reject Submission</h3>
            <p className="text-muted-foreground mb-4">
              Please provide a reason for rejecting this game submission. This will be visible to the developer.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-border rounded-md mb-4 min-h-[100px]"
              placeholder="Reason for rejection..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                disabled={!rejectionReason.trim()}
              >
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
