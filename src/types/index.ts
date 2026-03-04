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

export interface Policy {
  id: string;
  title: string;
  content: string;
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

export interface AppState {
  policies: Policy[];
  folders: PolicyFolder[];
  selectedPolicyId: string | null;
  searchQuery: string;
  filterCategory: PolicyCategory | "All";
  filterStatus: PolicyStatus | "All";
  sidebarOpen: boolean;
  theme: "light" | "dark";
}
