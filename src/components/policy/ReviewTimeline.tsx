"use client";

import { useState } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { useToast } from "@/components/ui/Toast";
import type { ReviewOutcome } from "@/types";
import {
  CalendarClock,
  CalendarCheck2,
  CalendarX2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Helpers ──────────────────────────────────────────────── */

function formatLocalDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(iso: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}

const OUTCOME_CONFIG: Record<ReviewOutcome, { icon: typeof CheckCircle2; label: string; color: string; bg: string; border: string }> = {
  approved: { icon: CheckCircle2,  label: "Approved",  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  declined: { icon: XCircle,       label: "Declined",  color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
  pending:  { icon: AlertTriangle, label: "Pending",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
};

/* ── Schedule badge ───────────────────────────────────────── */
function DueBadge({ dueDate }: { dueDate: string }) {
  const days = daysUntil(dueDate);
  if (days < 0) {
    return (
      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
        Overdue by {Math.abs(days)}d
      </span>
    );
  }
  if (days <= 14) {
    return (
      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        Due in {days}d
      </span>
    );
  }
  return (
    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
      Due {formatLocalDate(dueDate)}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   ReviewTimeline — main export
   ══════════════════════════════════════════════════════════ */

export function ReviewTimeline({ policyId }: { policyId: string }) {
  const {
    policyReviews,
    scheduledReviews,
    addPolicyReview,
    deletePolicyReview,
    addScheduledReview,
    updateScheduledReview,
    deleteScheduledReview,
  } = usePolicyStore();
  const { toast } = useToast();

  /* ── local state ── */
  const [showAddReview, setShowAddReview]     = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // "Add Review" form
  const [reviewer, setReviewer]     = useState("");
  const [reviewedAt, setReviewedAt] = useState(new Date().toISOString().slice(0, 10));
  const [outcome, setOutcome]       = useState<ReviewOutcome>("approved");
  const [reason, setReason]         = useState("");

  // "Schedule Review" form
  const [schedDue, setSchedDue]         = useState("");
  const [schedAssigned, setSchedAssigned] = useState("");
  const [schedNote, setSchedNote]         = useState("");

  // Editing scheduled review
  const [editDue, setEditDue]         = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [editNote, setEditNote]         = useState("");

  // Quick-complete a scheduled review
  const [quickComplete, setQuickComplete] = useState<{ id: string; outcome: ReviewOutcome } | null>(null);
  const [quickNote, setQuickNote]         = useState("");

  /* ── filter to this policy ── */
  const reviews   = policyReviews.filter((r) => r.policyId === policyId)
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
  const scheduled = scheduledReviews.filter((s) => s.policyId === policyId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  /* ── handlers ── */
  const handleAddReview = () => {
    if (!reviewer.trim()) { toast({ title: "Reviewer name required", variant: "error" }); return; }
    if (!reviewedAt)       { toast({ title: "Review date required", variant: "error" }); return; }
    if (!reason.trim())    { toast({ title: "Please add a reason / notes", variant: "error" }); return; }

    addPolicyReview({ policyId, reviewer: reviewer.trim(), reviewedAt, outcome, reason: reason.trim() });
    toast({ title: "Review logged", description: `${reviewer} — ${outcome}`, variant: "success" });
    setReviewer(""); setReviewedAt(new Date().toISOString().slice(0, 10));
    setOutcome("approved"); setReason(""); setShowAddReview(false);
  };

  const handleAddSchedule = () => {
    if (!schedDue)               { toast({ title: "Due date required", variant: "error" }); return; }
    if (!schedAssigned.trim())   { toast({ title: "Assigned reviewer required", variant: "error" }); return; }
    addScheduledReview({ policyId, dueDate: schedDue, assignedTo: schedAssigned.trim(), note: schedNote.trim() });
    toast({ title: "Review scheduled", description: `Assigned to ${schedAssigned}`, variant: "success" });
    setSchedDue(""); setSchedAssigned(""); setSchedNote(""); setShowAddSchedule(false);
  };

  const startEditSchedule = (id: string) => {
    const s = scheduledReviews.find((x) => x.id === id);
    if (!s) return;
    setEditingScheduleId(id);
    setEditDue(s.dueDate);
    setEditAssigned(s.assignedTo);
    setEditNote(s.note);
  };

  const handleSaveScheduleEdit = () => {
    if (!editingScheduleId) return;
    if (!editDue)               { toast({ title: "Due date required", variant: "error" }); return; }
    if (!editAssigned.trim())   { toast({ title: "Assigned reviewer required", variant: "error" }); return; }
    updateScheduledReview(editingScheduleId, { dueDate: editDue, assignedTo: editAssigned.trim(), note: editNote.trim() });
    toast({ title: "Schedule updated", variant: "success" });
    setEditingScheduleId(null);
  };

  const openQuickComplete = (id: string, outcome: ReviewOutcome) => {
    setQuickComplete({ id, outcome });
    setQuickNote("");
    setEditingScheduleId(null);
  };

  const handleQuickComplete = () => {
    if (!quickComplete) return;
    const s = scheduledReviews.find((x) => x.id === quickComplete.id);
    if (!s) return;
    const today = new Date().toISOString().slice(0, 10);
    addPolicyReview({
      policyId,
      reviewer: s.assignedTo,
      reviewedAt: today,
      outcome: quickComplete.outcome,
      reason: quickNote.trim() || `${quickComplete.outcome === "approved" ? "Approved" : "Declined"} on scheduled review`,
    });
    deleteScheduledReview(quickComplete.id);
    toast({ title: `Review ${quickComplete.outcome}`, description: "Moved to review history", variant: "success" });
    setQuickComplete(null);
  };

  const inputCls = "w-full rounded-lg border border-white/[0.08] bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none";
  const labelCls = "block text-[11px] font-medium text-zinc-400 mb-1";

  return (
    <div className="space-y-6">

      {/* ── Scheduled Reviews ───────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarClock className="h-4 w-4 text-violet-400" />
            Scheduled Reviews
            {scheduled.length > 0 && (
              <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                {scheduled.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowAddSchedule(!showAddSchedule)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            {showAddSchedule ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAddSchedule ? "Cancel" : "Schedule"}
          </button>
        </div>

        {/* Add schedule form */}
        {showAddSchedule && (
          <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-violet-300">New Scheduled Review</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Due Date</label>
                <input type="date" value={schedDue} onChange={(e) => setSchedDue(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Assigned To</label>
                <input type="text" value={schedAssigned} onChange={(e) => setSchedAssigned(e.target.value)} placeholder="Reviewer name" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes (optional)</label>
              <textarea value={schedNote} onChange={(e) => setSchedNote(e.target.value)} rows={2} placeholder="Context or scope for this review…" className={inputCls + " resize-none"} />
            </div>
            <button onClick={handleAddSchedule} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors">
              Add Schedule
            </button>
          </div>
        )}

        {/* Scheduled list */}
        {scheduled.length === 0 && !showAddSchedule ? (
          <div className="rounded-xl border border-white/[0.05] bg-zinc-900/30 py-8 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-500">No scheduled reviews yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduled.map((s) => {
              const isEditing = editingScheduleId === s.id;
              const days = daysUntil(s.dueDate);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    days < 0 ? "border-red-500/20 bg-red-500/5"
                    : days <= 14 ? "border-amber-500/20 bg-amber-500/5"
                    : "border-white/[0.06] bg-zinc-900/50"
                  )}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Due Date</label>
                          <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Assigned To</label>
                          <input type="text" value={editAssigned} onChange={(e) => setEditAssigned(e.target.value)} className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Notes</label>
                        <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={2} className={inputCls + " resize-none"} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveScheduleEdit} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-colors">
                          <Check className="h-3 w-3" /> Save
                        </button>
                        <button onClick={() => setEditingScheduleId(null)} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Header row */}
                      <div className="flex items-start gap-3">
                        <CalendarClock className={cn("h-4 w-4 shrink-0 mt-0.5", days < 0 ? "text-red-400" : days <= 14 ? "text-amber-400" : "text-zinc-500")} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Pending badge — always shown */}
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                              Pending
                            </span>
                            <DueBadge dueDate={s.dueDate} />
                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                              <User className="h-3 w-3" /> {s.assignedTo}
                            </span>
                          </div>
                          {s.note && <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{s.note}</p>}
                          <p className="mt-1 text-[10px] text-zinc-700">Scheduled {formatLocalDate(s.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEditSchedule(s.id)} className="rounded-md p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { deleteScheduledReview(s.id); toast({ title: "Schedule removed", variant: "info" }); }} className="rounded-md p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Quick-complete panel */}
                      {quickComplete?.id === s.id ? (
                        <div className="rounded-lg border border-white/[0.06] bg-zinc-900/60 p-3 space-y-2">
                          <p className="text-[11px] text-zinc-400">
                            Optional note for this{" "}
                            <span className={quickComplete.outcome === "approved" ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                              {quickComplete.outcome}
                            </span>{" "}
                            review:
                          </p>
                          <textarea
                            value={quickNote}
                            onChange={(e) => setQuickNote(e.target.value)}
                            rows={2}
                            placeholder="Add a note (optional)…"
                            className={inputCls + " resize-none text-xs"}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleQuickComplete}
                              className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors",
                                quickComplete.outcome === "approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                              )}
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              Confirm {quickComplete.outcome === "approved" ? "Approved" : "Declined"}
                            </button>
                            <button onClick={() => setQuickComplete(null)} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Approve / Decline buttons */
                        <div className="flex gap-2 pl-7">
                          <button
                            onClick={() => openQuickComplete(s.id, "approved")}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => openQuickComplete(s.id, "declined")}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Review Timeline ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarCheck2 className="h-4 w-4 text-violet-400" />
            Review History
            {reviews.length > 0 && (
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                {reviews.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowAddReview(!showAddReview)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            {showAddReview ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAddReview ? "Cancel" : "Log Review"}
          </button>
        </div>

        {/* Add review form */}
        {showAddReview && (
          <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-violet-300">Log a Completed Review</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Reviewer Name</label>
                <input type="text" value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="e.g. Jane Smith" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Review Date</label>
                <input type="date" value={reviewedAt} onChange={(e) => setReviewedAt(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Outcome</label>
              <div className="flex gap-2">
                {(["approved", "declined", "pending"] as ReviewOutcome[]).map((o) => {
                  const cfg = OUTCOME_CONFIG[o];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOutcome(o)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                        outcome === o ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-white/[0.06] text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className={labelCls}>Reason / Notes <span className="text-red-400">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Describe what was reviewed, any changes made, or why it was declined…"
                className={inputCls + " resize-none"}
              />
            </div>
            <button onClick={handleAddReview} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors">
              Log Review
            </button>
          </div>
        )}

        {/* Timeline */}
        {reviews.length === 0 && !showAddReview ? (
          <div className="rounded-xl border border-white/[0.05] bg-zinc-900/30 py-8 text-center">
            <CalendarCheck2 className="mx-auto h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-500">No reviews logged yet</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Log the first review to start the timeline</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* vertical line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-white/[0.05]" />
            {reviews.map((r, idx) => {
              const cfg = OUTCOME_CONFIG[r.outcome];
              const Icon = cfg.icon;
              return (
                <div key={r.id} className="relative flex gap-4 pb-5 last:pb-0">
                  {/* dot */}
                  <div className={cn("relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", cfg.bg, cfg.border)}>
                    <Icon className={cn("h-4 w-4", cfg.color)} />
                  </div>

                  {/* card */}
                  <div className={cn("flex-1 rounded-xl border p-4", cfg.bg, cfg.border)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-xs font-semibold rounded-full border px-2 py-0.5", cfg.color, cfg.bg, cfg.border)}>
                            {cfg.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-zinc-300 font-medium">
                            <User className="h-3 w-3 text-zinc-500" />
                            {r.reviewer}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Clock className="h-3 w-3" />
                            {formatLocalDate(r.reviewedAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{r.reason}</p>
                        <p className="mt-1.5 text-[10px] text-zinc-600">Logged {formatLocalDate(r.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => { deletePolicyReview(r.id); toast({ title: "Review removed", variant: "info" }); }}
                        className="shrink-0 rounded-md p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Compact badge used in policy list cards ────────────────── */
export function ReviewStatusBadge({ policyId }: { policyId: string }) {
  const { scheduledReviews } = usePolicyStore();
  const upcoming = scheduledReviews
    .filter((s) => s.policyId === policyId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  if (!upcoming) return null;

  const days = daysUntil(upcoming.dueDate);
  if (days < 0) {
    return (
      <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
        <CalendarX2 className="h-3 w-3" /> Review overdue
      </span>
    );
  }
  if (days <= 14) {
    return (
      <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        <CalendarClock className="h-3 w-3" /> Due in {days}d
      </span>
    );
  }
  return null; // only show if urgent
}
