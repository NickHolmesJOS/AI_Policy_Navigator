"use client";

import { useState } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { generateId } from "@/lib/utils";
import type { PolicyTag } from "@/types";
import {
  Tag,
  Folder,
  Plus,
  X,
  FolderOpen,
  Palette,
  MoveRight,
} from "lucide-react";

const TAG_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

const FOLDER_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export function PolicyOrganizer() {
  const {
    selectedPolicyId,
    policies,
    folders,
    addTag,
    removeTag,
    addFolder,
    deleteFolder,
    movePolicyToFolder,
  } = usePolicyStore();

  const policy = policies.find((p) => p.id === selectedPolicyId);

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [showNewFolder, setShowNewFolder] = useState(false);

  const handleAddTag = () => {
    if (!newTagName.trim() || !policy) return;
    const tag: PolicyTag = {
      id: generateId(),
      name: newTagName.trim(),
      color: newTagColor,
    };
    addTag(policy.id, tag);
    setNewTagName("");
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const currentFolder = folders.find((f) => f.id === policy?.folderId);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6">
      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="w-4 h-4 text-violet-400" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!policy ? (
            <p className="text-sm text-zinc-400">Select a policy to manage tags.</p>
          ) : (
            <>
              {/* Current tags */}
              <div className="flex flex-wrap gap-2">
                {policy.tags.length === 0 ? (
                  <p className="text-sm text-zinc-500">No tags yet</p>
                ) : (
                  policy.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border"
                      style={{
                        backgroundColor: tag.color + "20",
                        borderColor: tag.color + "40",
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                      <button
                        onClick={() => removeTag(policy.id, tag.id)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add new tag */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="New tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  <div className="flex gap-1.5 flex-wrap">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          outline:
                            newTagColor === color
                              ? `2px solid ${color}`
                              : "none",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Folders Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Folder className="w-4 h-4 text-violet-400" />
              Folders
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewFolder(!showNewFolder)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Folder
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNewFolder && (
            <div className="p-3 rounded-xl border border-white/10 bg-white/2 space-y-3">
              <Input
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
              />
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        outline:
                          newFolderColor === color
                            ? `2px solid ${color}`
                            : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={handleAddFolder}
                  disabled={!newFolderName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          )}

          {folders.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No folders yet. Create one to organize your policies.
            </p>
          ) : (
            <div className="space-y-2">
              {/* No folder option */}
              {policy && (
                <button
                  onClick={() => movePolicyToFolder(policy.id, undefined)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    !policy.folderId
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-white/5 hover:border-white/10 hover:bg-white/5"
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-300">No folder</span>
                  {!policy.folderId && (
                    <span className="ml-auto text-xs text-violet-400">Current</span>
                  )}
                </button>
              )}
              {folders.map((folder) => {
                const policyCount = policies.filter(
                  (p) => p.folderId === folder.id
                ).length;
                const isCurrentFolder = policy?.folderId === folder.id;

                return (
                  <div key={folder.id} className="group">
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isCurrentFolder
                          ? "border-violet-500/50 bg-violet-500/10"
                          : "border-white/5 hover:border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: folder.color }}
                      />
                      <span className="text-sm text-white flex-1 truncate">
                        {folder.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {policyCount} {policyCount === 1 ? "policy" : "policies"}
                      </span>
                      {policy && !isCurrentFolder && (
                        <button
                          onClick={() =>
                            movePolicyToFolder(policy.id, folder.id)
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-400 hover:text-violet-300"
                          title="Move policy here"
                        >
                          <MoveRight className="w-4 h-4" />
                        </button>
                      )}
                      {isCurrentFolder && (
                        <span className="text-xs text-violet-400">Current</span>
                      )}
                      <button
                        onClick={() => deleteFolder(folder.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                        title="Delete folder"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {policy && policy.analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Policy Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                <p className="text-zinc-400 text-xs">Risk Score</p>
                <p className="text-white font-bold text-lg">
                  {policy.analysis.riskScore}
                  <span className="text-xs font-normal text-zinc-400">/100</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                <p className="text-zinc-400 text-xs">Findings</p>
                <p className="text-white font-bold text-lg">
                  {policy.analysis.keyFindings.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                <p className="text-zinc-400 text-xs">Word Count</p>
                <p className="text-white font-bold text-lg">
                  {policy.analysis.wordCount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                <p className="text-zinc-400 text-xs">Reading Time</p>
                <p className="text-white font-bold text-lg">
                  {policy.analysis.readingTime}
                  <span className="text-xs font-normal text-zinc-400"> min</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
