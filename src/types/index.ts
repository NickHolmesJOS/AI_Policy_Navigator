export type PolicyStatus = "draft" | "analyzing" | "analyzed" | "error";

export type PolicyCategory =
  | "Privacy"
  | "Security"
  | "HR"
  | "Compliance"
  | "Environmental"
  | "Financial"
  | "Ethics"
  | "Other";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface PolicyTag {
  id: string;
  name: string;
  color: string;
}

export interface PolicyFinding {
  id: string;
  type: "risk" | "requirement" | "recommendation" | "compliance";
  severity: RiskLevel;
  title: string;
  description: string;
  section?: string;
}

export interface PolicyAnalysis {
  summary: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  keyFindings: PolicyFinding[];
  complianceStatus: string;
  recommendations: string[];
  wordCount: number;
  readingTime: number;
  analyzedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface PolicyVersion {
  id: string;
  savedAt: string;
  title: string;
  content: string;
  category: PolicyCategory;
}

export interface Policy {
  id: string;
  title: string;
  content: string;
  /** Per-page text extracted from an uploaded PDF */
  pageContents?: string[];
  /** Snapshot history — newest first, capped at 50 */
  versions?: PolicyVersion[];
  category: PolicyCategory;
  tags: PolicyTag[];
  status: PolicyStatus;
  analysis?: PolicyAnalysis;
  chatHistory: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  folderId?: string;
}

export interface PolicyFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export type ActivityAction =
  | "policy_created"
  | "policy_analyzed"
  | "policy_deleted"
  | "policy_exported"
  | "policy_compared"
  | "policy_favorited"
  | "policy_unfavorited"
  | "folder_created"
  | "folder_deleted"
  | "tag_added"
  | "tag_removed"
  | "chat_message"
  | "chat_cleared"
  | "template_used"
  | "bulk_action"
  | "settings_changed";

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  label: string;
  detail?: string;
  policyId?: string;
  policyTitle?: string;
  timestamp: string;
}

// --------------- Compliance System ---------------

export type ComplianceSeverity = "critical" | "high" | "medium" | "low" | "info";
export type ComplianceCheckStatus = "pass" | "fail" | "partial" | "unchecked";
export type ComplianceAssignmentLevel = "folder" | "tag" | "policy";

export interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  color: string;
  description: string;
  isBuiltIn: boolean;
}

export interface ComplianceRule {
  id: string;
  frameworkId: string;
  title: string;
  description: string;
  section?: string;
  severity: ComplianceSeverity;
  isBuiltIn: boolean;
  keywords: string[];
  createdAt: string;
}

export interface ComplianceAssignment {
  id: string;
  ruleId: string;
  level: ComplianceAssignmentLevel;
  targetId: string; // folderId, tagName, or policyId depending on level
  enabled: boolean;
  createdAt: string;
}

export interface ComplianceCheckResult {
  ruleId: string;
  policyId: string;
  status: ComplianceCheckStatus;
  note: string;
  checkedAt: string;
  checkedBy: "manual" | "auto";
}

export interface PolicyTemplate {
  id: string;
  title: string;
  description: string;
  category: PolicyCategory;
  content: string;
  tags: string[];
  icon: string;
}

export interface AppSettings {
  openaiApiKey: string;
  autoAnalyze: boolean;
  defaultCategory: PolicyCategory;
  exportFormat: "markdown" | "json" | "txt";
  showWelcomeBanner: boolean;
}

// --------------- Review System ---------------

export type ReviewOutcome = "approved" | "declined" | "pending";

/** A completed / logged review event */
export interface PolicyReview {
  id: string;
  policyId: string;
  reviewer: string;       // free-text name
  reviewedAt: string;     // ISO date string (actual date of review)
  outcome: ReviewOutcome;
  reason: string;         // required notes / rationale
  createdAt: string;      // when the record was created
}

/** A scheduled future review */
export interface ScheduledReview {
  id: string;
  policyId: string;
  dueDate: string;        // ISO date string
  assignedTo: string;     // who should perform the review
  note: string;           // optional context
  createdAt: string;
}

export interface AppState {
  policies: Policy[];
  folders: PolicyFolder[];
  selectedPolicyId: string | null;
  searchQuery: string;
  filterCategory: PolicyCategory | "All";
  filterStatus: PolicyStatus | "All";
  sidebarOpen: boolean;
  theme: "light" | "dark";
  activityLog: ActivityLogEntry[];
  settings: AppSettings;
}
