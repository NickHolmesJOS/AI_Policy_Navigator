import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Policy,
  PolicyFolder,
  PolicyCategory,
  PolicyStatus,
  PolicyTag,
  ChatMessage,
  PolicyAnalysis,
} from "@/types";
import { generateId } from "@/lib/utils";

interface PolicyStore {
  policies: Policy[];
  folders: PolicyFolder[];
  selectedPolicyId: string | null;
  searchQuery: string;
  filterCategory: PolicyCategory | "All";
  filterStatus: PolicyStatus | "All";
  sidebarOpen: boolean;

  // Policy actions
  addPolicy: (
    title: string,
    content: string,
    category: PolicyCategory
  ) => Policy;
  updatePolicy: (id: string, updates: Partial<Policy>) => void;
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

  // UI
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: PolicyCategory | "All") => void;
  setFilterStatus: (status: PolicyStatus | "All") => void;
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
      sidebarOpen: true,

      addPolicy: (title, content, category) => {
        const policy: Policy = {
          id: generateId(),
          title,
          content,
          category,
          tags: [],
          status: "draft",
          chatHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        };
        set((state) => ({ policies: [policy, ...state.policies] }));
        return policy;
      },

      updatePolicy: (id, updates) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePolicy: (id) => {
        set((state) => ({
          policies: state.policies.filter((p) => p.id !== id),
          selectedPolicyId:
            state.selectedPolicyId === id ? null : state.selectedPolicyId,
        }));
      },

      selectPolicy: (id) => set({ selectedPolicyId: id }),

      toggleFavorite: (id) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }));
      },

      setAnalysis: (id, analysis) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id
              ? { ...p, analysis, status: "analyzed", updatedAt: new Date().toISOString() }
              : p
          ),
        }));
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
        return folder;
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          policies: state.policies.map((p) =>
            p.folderId === id ? { ...p, folderId: undefined } : p
          ),
        }));
      },

      movePolicyToFolder: (policyId, folderId) => {
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === policyId ? { ...p, folderId } : p
          ),
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterCategory: (category) => set({ filterCategory: category }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "ai-policy-navigator",
    }
  )
);

export const useFilteredPolicies = () => {
  const { policies, searchQuery, filterCategory, filterStatus } =
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

    return matchesSearch && matchesCategory && matchesStatus;
  });
};
