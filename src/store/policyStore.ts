import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Policy,
  PolicyVersion,
  PolicyFolder,
  PolicyCategory,
  PolicyStatus,
  PolicyTag,
  ChatMessage,
  PolicyAnalysis,
  RiskLevel,
  ActivityLogEntry,
  ActivityAction,
  AppSettings,
  PolicyReview,
  ScheduledReview,
  ComplianceFramework,
  ComplianceRule,
  ComplianceAssignment,
  ComplianceCheckResult,
  ComplianceCheckStatus,
  ComplianceAssignmentLevel,
  ComplianceSeverity,
} from "@/types";
import { generateId } from "@/lib/utils";
import { BUILT_IN_FRAMEWORKS, BUILT_IN_RULES } from "@/lib/complianceData";

interface PolicyStore {
  policies: Policy[];
  folders: PolicyFolder[];
  selectedPolicyId: string | null;
  searchQuery: string;
  filterCategory: PolicyCategory | "All";
  filterStatus: PolicyStatus | "All";
  filterRiskLevel: RiskLevel | "All";
  filterTag: string;
  sidebarOpen: boolean;
  activityLog: ActivityLogEntry[];
  settings: AppSettings;

  // Policy actions
  addPolicy: (
    title: string,
    content: string,
    category: PolicyCategory,
    pageContents?: string[]
  ) => Policy;
  updatePolicy: (id: string, updates: Partial<Policy>) => void;
  saveVersion: (policyId: string) => void;
  restoreVersion: (policyId: string, versionId: string) => void;
  deletePolicy: (id: string) => void;
  selectPolicy: (id: string | null) => void;
  toggleFavorite: (id: string) => void;

  // Analysis
  setAnalysis: (id: string, analysis: PolicyAnalysis) => void;
  setStatus: (id: string, status: PolicyStatus) => void;

  // Chat
  addChatMessage: (policyId: string, message: ChatMessage) => void;
  clearChat: (policyId: string) => void;

  // Tags
  addTag: (policyId: string, tag: PolicyTag) => void;
  removeTag: (policyId: string, tagId: string) => void;

  // Folders
  addFolder: (name: string, color: string) => PolicyFolder;
  deleteFolder: (id: string) => void;
  movePolicyToFolder: (policyId: string, folderId: string | undefined) => void;

  // Activity Log
  logActivity: (action: ActivityAction, label: string, detail?: string, policyId?: string, policyTitle?: string) => void;
  clearActivityLog: () => void;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Bulk actions
  deletePolicies: (ids: string[]) => void;

  // Compliance
  customFrameworks: ComplianceFramework[];
  customRules: ComplianceRule[];
  complianceAssignments: ComplianceAssignment[];
  complianceResults: ComplianceCheckResult[];

  // Reviews
  policyReviews: PolicyReview[];
  scheduledReviews: ScheduledReview[];

  addPolicyReview: (review: Omit<PolicyReview, "id" | "createdAt">) => PolicyReview;
  deletePolicyReview: (id: string) => void;
  addScheduledReview: (sr: Omit<ScheduledReview, "id" | "createdAt">) => ScheduledReview;
  updateScheduledReview: (id: string, updates: Partial<Pick<ScheduledReview, "dueDate" | "assignedTo" | "note">>) => void;
  deleteScheduledReview: (id: string) => void;

  addCustomFramework: (name: string, shortName: string, color: string, description: string) => ComplianceFramework;
  deleteCustomFramework: (id: string) => void;
  addCustomRule: (frameworkId: string, title: string, description: string, section: string, severity: ComplianceSeverity, keywords: string[]) => ComplianceRule;
  updateCustomRule: (id: string, updates: Partial<ComplianceRule>) => void;
  deleteCustomRule: (id: string) => void;
  addComplianceAssignment: (ruleId: string, level: ComplianceAssignmentLevel, targetId: string) => ComplianceAssignment;
  removeComplianceAssignment: (id: string) => void;
  toggleComplianceAssignment: (id: string) => void;
  bulkAssignFramework: (frameworkId: string, level: ComplianceAssignmentLevel, targetId: string) => void;
  removeFrameworkAssignments: (frameworkId: string, level: ComplianceAssignmentLevel, targetId: string) => void;
  setComplianceResult: (ruleId: string, policyId: string, status: ComplianceCheckStatus, note?: string) => void;
  clearComplianceResults: (policyId: string) => void;

  // UI
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: PolicyCategory | "All") => void;
  setFilterStatus: (status: PolicyStatus | "All") => void;
  setFilterRiskLevel: (level: RiskLevel | "All") => void;
  setFilterTag: (tag: string) => void;
  toggleSidebar: () => void;
}

export const usePolicyStore = create<PolicyStore>()(
  persist(
    (set, get) => ({
      policies: [],
      folders: [],
      selectedPolicyId: null,
      searchQuery: "",
      filterCategory: "All",
      filterStatus: "All",
      filterRiskLevel: "All" as RiskLevel | "All",
      filterTag: "",
      sidebarOpen: true,
      activityLog: [],
      customFrameworks: [],
      customRules: [],
      complianceAssignments: [],
      complianceResults: [],
      policyReviews: [],
      scheduledReviews: [],
      settings: {
        openaiApiKey: "",
        autoAnalyze: false,
        defaultCategory: "Other" as PolicyCategory,
        exportFormat: "markdown" as const,
        showWelcomeBanner: true,
      },

      logActivity: (action, label, detail, policyId, policyTitle) => {
        const entry: ActivityLogEntry = {
          id: generateId(),
          action,
          label,
          detail,
          policyId,
          policyTitle,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          activityLog: [entry, ...state.activityLog].slice(0, 500),
        }));
      },

      clearActivityLog: () => set({ activityLog: [] }),

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
        get().logActivity("settings_changed", "Settings updated");
      },

      deletePolicies: (ids) => {
        const { policies } = get();
        const titles = policies.filter(p => ids.includes(p.id)).map(p => p.title);
        set((state) => ({
          policies: state.policies.filter((p) => !ids.includes(p.id)),
          selectedPolicyId: ids.includes(state.selectedPolicyId || "") ? null : state.selectedPolicyId,
        }));
        get().logActivity("bulk_action", `Deleted ${ids.length} policies`, titles.join(", "));
      },

      addPolicy: (title, content, category, pageContents) => {
        const policy: Policy = {
          id: generateId(),
          title,
          content,
          ...(pageContents?.length ? { pageContents } : {}),
          category,
          tags: [],
          status: "draft",
          chatHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        };
        set((state) => ({ policies: [policy, ...state.policies] }));
        get().logActivity("policy_created", `Created "${title}"`, category, policy.id, title);
        return policy;
      },

      updatePolicy: (id, updates) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      saveVersion: (policyId) => {
        const policy = get().policies.find((p) => p.id === policyId);
        if (!policy) return;
        const version: PolicyVersion = {
          id: generateId(),
          savedAt: new Date().toISOString(),
          title: policy.title,
          content: policy.content,
          category: policy.category,
        };
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policyId
              ? { ...p, versions: [version, ...(p.versions ?? [])].slice(0, 50) }
              : p
          ),
        }));
      },

      restoreVersion: (policyId, versionId) => {
        const policy = get().policies.find((p) => p.id === policyId);
        if (!policy) return;
        const version = (policy.versions ?? []).find((v) => v.id === versionId);
        if (!version) return;
        // Snapshot current state before overwriting
        get().saveVersion(policyId);
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policyId
              ? {
                  ...p,
                  title: version.title,
                  content: version.content,
                  category: version.category,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      deletePolicy: (id) => {
        const policy = get().policies.find(p => p.id === id);
        set((state) => ({
          policies: state.policies.filter((p) => p.id !== id),
          selectedPolicyId:
            state.selectedPolicyId === id ? null : state.selectedPolicyId,
        }));
        if (policy) get().logActivity("policy_deleted", `Deleted "${policy.title}"`, undefined, id, policy.title);
      },

      selectPolicy: (id) => set({ selectedPolicyId: id }),

      toggleFavorite: (id) => {
        const policy = get().policies.find(p => p.id === id);
        const wasFav = policy?.isFavorite;
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }));
        if (policy) get().logActivity(wasFav ? "policy_unfavorited" : "policy_favorited", `${wasFav ? "Unfavorited" : "Favorited"} "${policy.title}"`, undefined, id, policy.title);
      },

      setAnalysis: (id, analysis) => {
        const policy = get().policies.find(p => p.id === id);
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id
              ? { ...p, analysis, status: "analyzed", updatedAt: new Date().toISOString() }
              : p
          ),
        }));
        if (policy) get().logActivity("policy_analyzed", `Analyzed "${policy.title}"`, `Risk: ${analysis.riskLevel} (${analysis.riskScore}/100)`, id, policy.title);
      },

      setStatus: (id, status) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id ? { ...p, status } : p
          ),
        }));
      },

      addChatMessage: (policyId, message) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policyId
              ? { ...p, chatHistory: [...p.chatHistory, message] }
              : p
          ),
        }));
      },

      clearChat: (policyId) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policyId ? { ...p, chatHistory: [] } : p
          ),
        }));
      },

      addTag: (policyId, tag) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policyId
              ? { ...p, tags: [...p.tags.filter((t) => t.id !== tag.id), tag] }
              : p
          ),
        }));
      },

      removeTag: (policyId, tagId) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policyId
              ? { ...p, tags: p.tags.filter((t) => t.id !== tagId) }
              : p
          ),
        }));
      },

      addFolder: (name, color) => {
        const folder: PolicyFolder = {
          id: generateId(),
          name,
          color,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ folders: [...state.folders, folder] }));
        get().logActivity("folder_created", `Created folder "${name}"`);
        return folder;
      },

      deleteFolder: (id) => {
        const folder = get().folders.find(f => f.id === id);
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          policies: state.policies.map((p) =>
            p.folderId === id ? { ...p, folderId: undefined } : p
          ),
        }));
        if (folder) get().logActivity("folder_deleted", `Deleted folder "${folder.name}"`);
      },

      movePolicyToFolder: (policyId, folderId) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policyId ? { ...p, folderId } : p
          ),
        }));
      },

      // ── Review Actions ─────────────────────────────────────────────

      addPolicyReview: (review) => {
        const r: PolicyReview = { ...review, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({ policyReviews: [r, ...state.policyReviews] }));
        get().logActivity("policy_analyzed", `Review logged for policy`, `${review.reviewer} — ${review.outcome}`, review.policyId);
        return r;
      },

      deletePolicyReview: (id) => {
        set((state) => ({ policyReviews: state.policyReviews.filter((r) => r.id !== id) }));
      },

      addScheduledReview: (sr) => {
        const s: ScheduledReview = { ...sr, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({ scheduledReviews: [s, ...state.scheduledReviews] }));
        return s;
      },

      updateScheduledReview: (id, updates) => {
        set((state) => ({
          scheduledReviews: state.scheduledReviews.map((s) => s.id === id ? { ...s, ...updates } : s),
        }));
      },

      deleteScheduledReview: (id) => {
        set((state) => ({ scheduledReviews: state.scheduledReviews.filter((s) => s.id !== id) }));
      },

      // ── Compliance Actions ─────────────────────────────────────────────

      addCustomFramework: (name, shortName, color, description) => {
        const fw: ComplianceFramework = {
          id: generateId(),
          name,
          shortName,
          color,
          description,
          isBuiltIn: false,
        };
        set((state) => ({ customFrameworks: [...state.customFrameworks, fw] }));
        get().logActivity("settings_changed", `Created compliance framework "${shortName}"`);
        return fw;
      },

      deleteCustomFramework: (id) => {
        set((state) => ({
          customFrameworks: state.customFrameworks.filter((f) => f.id !== id),
          customRules: state.customRules.filter((r) => r.frameworkId !== id),
          complianceAssignments: state.complianceAssignments.filter(
            (a) => !state.customRules.some((r) => r.frameworkId === id && r.id === a.ruleId)
          ),
        }));
      },

      addCustomRule: (frameworkId, title, description, section, severity, keywords) => {
        const rule: ComplianceRule = {
          id: generateId(),
          frameworkId,
          title,
          description,
          section: section || undefined,
          severity,
          isBuiltIn: false,
          keywords,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ customRules: [...state.customRules, rule] }));
        get().logActivity("settings_changed", `Created compliance rule "${title}"`);
        return rule;
      },

      updateCustomRule: (id, updates) => {
        set((state) => ({
          customRules: state.customRules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      deleteCustomRule: (id) => {
        set((state) => ({
          customRules: state.customRules.filter((r) => r.id !== id),
          complianceAssignments: state.complianceAssignments.filter((a) => a.ruleId !== id),
          complianceResults: state.complianceResults.filter((r) => r.ruleId !== id),
        }));
      },

      addComplianceAssignment: (ruleId, level, targetId) => {
        // Prevent duplicates
        const existing = get().complianceAssignments.find(
          (a) => a.ruleId === ruleId && a.level === level && a.targetId === targetId
        );
        if (existing) return existing;

        const assignment: ComplianceAssignment = {
          id: generateId(),
          ruleId,
          level,
          targetId,
          enabled: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          complianceAssignments: [...state.complianceAssignments, assignment],
        }));
        return assignment;
      },

      removeComplianceAssignment: (id) => {
        set((state) => ({
          complianceAssignments: state.complianceAssignments.filter((a) => a.id !== id),
        }));
      },

      toggleComplianceAssignment: (id) => {
        set((state) => ({
          complianceAssignments: state.complianceAssignments.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        }));
      },

      bulkAssignFramework: (frameworkId, level, targetId) => {
        const allRules = [...BUILT_IN_RULES, ...get().customRules];
        const frameworkRules = allRules.filter((r) => r.frameworkId === frameworkId);
        const existingAssignments = get().complianceAssignments;

        const newAssignments: ComplianceAssignment[] = [];
        for (const rule of frameworkRules) {
          const exists = existingAssignments.find(
            (a) => a.ruleId === rule.id && a.level === level && a.targetId === targetId
          );
          if (!exists) {
            newAssignments.push({
              id: generateId(),
              ruleId: rule.id,
              level,
              targetId,
              enabled: true,
              createdAt: new Date().toISOString(),
            });
          }
        }
        if (newAssignments.length > 0) {
          set((state) => ({
            complianceAssignments: [...state.complianceAssignments, ...newAssignments],
          }));
        }
      },

      removeFrameworkAssignments: (frameworkId, level, targetId) => {
        const allRules = [...BUILT_IN_RULES, ...get().customRules];
        const ruleIds = new Set(allRules.filter((r) => r.frameworkId === frameworkId).map((r) => r.id));
        set((state) => ({
          complianceAssignments: state.complianceAssignments.filter(
            (a) => !(ruleIds.has(a.ruleId) && a.level === level && a.targetId === targetId)
          ),
        }));
      },

      setComplianceResult: (ruleId, policyId, status, note) => {
        set((state) => {
          const existing = state.complianceResults.findIndex(
            (r) => r.ruleId === ruleId && r.policyId === policyId
          );
          const result: ComplianceCheckResult = {
            ruleId,
            policyId,
            status,
            note: note || "",
            checkedAt: new Date().toISOString(),
            checkedBy: "manual",
          };
          if (existing >= 0) {
            const updated = [...state.complianceResults];
            updated[existing] = result;
            return { complianceResults: updated };
          }
          return { complianceResults: [...state.complianceResults, result] };
        });
      },

      clearComplianceResults: (policyId) => {
        set((state) => ({
          complianceResults: state.complianceResults.filter((r) => r.policyId !== policyId),
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterCategory: (category) => set({ filterCategory: category }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterRiskLevel: (level) => set({ filterRiskLevel: level }),
      setFilterTag: (tag) => set({ filterTag: tag }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "ai-policy-navigator",
    }
  )
);

export const useFilteredPolicies = () => {
  const { policies, searchQuery, filterCategory, filterStatus, filterRiskLevel, filterTag } =
    usePolicyStore();

  return policies.filter((policy) => {
    const matchesSearch =
      !searchQuery ||
      policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.tags.some((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      filterCategory === "All" || policy.category === filterCategory;

    const matchesStatus =
      filterStatus === "All" || policy.status === filterStatus;

    const matchesRisk =
      filterRiskLevel === "All" || policy.analysis?.riskLevel === filterRiskLevel;

    const matchesTag =
      !filterTag ||
      policy.tags.some((t) => t.name === filterTag);

    return matchesSearch && matchesCategory && matchesStatus && matchesRisk && matchesTag;
  });
};

export const useAllTags = () => {
  const policies = usePolicyStore((s) => s.policies);
  const tagMap = new Map<string, string>();
  policies.forEach((p) => p.tags.forEach((t) => tagMap.set(t.name, t.color)));
  return Array.from(tagMap.entries()).map(([name, color]) => ({ name, color }));
};

// ── Compliance Selectors ─────────────────────────────────────────────────

export const useAllFrameworks = () => {
  const custom = usePolicyStore((s) => s.customFrameworks);
  return [...BUILT_IN_FRAMEWORKS, ...custom];
};

export const useAllComplianceRules = () => {
  const custom = usePolicyStore((s) => s.customRules);
  return [...BUILT_IN_RULES, ...custom];
};

/** Get all effective rules for a given policy, merging folder + tag + individual assignments */
export const useEffectiveRulesForPolicy = (policyId: string) => {
  const policies = usePolicyStore((s) => s.policies);
  const assignments = usePolicyStore((s) => s.complianceAssignments);
  const results = usePolicyStore((s) => s.complianceResults);
  const customRules = usePolicyStore((s) => s.customRules);

  const policy = policies.find((p) => p.id === policyId);
  if (!policy) return [];

  const allRules = [...BUILT_IN_RULES, ...customRules];
  const ruleMap = new Map(allRules.map((r) => [r.id, r]));

  // Collect all enabled assignments that apply to this policy
  const relevantAssignments = assignments.filter((a) => {
    if (!a.enabled) return false;
    if (a.level === "policy" && a.targetId === policyId) return true;
    if (a.level === "folder" && policy.folderId && a.targetId === policy.folderId) return true;
    if (a.level === "tag" && policy.tags.some((t) => t.name === a.targetId)) return true;
    return false;
  });

  // Dedupe by ruleId, keeping track of where each assignment came from
  const ruleAssignments = new Map<string, { rule: ComplianceRule; sources: { level: ComplianceAssignmentLevel; targetId: string }[] }>();

  for (const a of relevantAssignments) {
    const rule = ruleMap.get(a.ruleId);
    if (!rule) continue;
    const existing = ruleAssignments.get(a.ruleId);
    if (existing) {
      existing.sources.push({ level: a.level, targetId: a.targetId });
    } else {
      ruleAssignments.set(a.ruleId, {
        rule,
        sources: [{ level: a.level, targetId: a.targetId }],
      });
    }
  }

  // Attach results
  return Array.from(ruleAssignments.values()).map(({ rule, sources }) => {
    const result = results.find((r) => r.ruleId === rule.id && r.policyId === policyId);
    return {
      rule,
      sources,
      result: result || null,
    };
  });
};

/** Get compliance statistics for a single policy */
export const usePolicyComplianceStats = (policyId: string) => {
  const effective = useEffectiveRulesForPolicy(policyId);
  const total = effective.length;
  const pass = effective.filter((e) => e.result?.status === "pass").length;
  const fail = effective.filter((e) => e.result?.status === "fail").length;
  const partial = effective.filter((e) => e.result?.status === "partial").length;
  const unchecked = total - pass - fail - partial;
  const score = total > 0 ? Math.round(((pass + partial * 0.5) / total) * 100) : 0;
  return { total, pass, fail, partial, unchecked, score };
};
