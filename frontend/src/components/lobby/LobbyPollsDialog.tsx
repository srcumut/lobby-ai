"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart2, Plus, Inbox } from "lucide-react";
import { Poll } from "@/lib/api/polls";
import { LobbyPollCard } from "./LobbyPollCard";

interface LobbyPollsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  polls: Poll[];
  currentUserId: string;
  isModeratorOrOwner?: boolean;
  onVote: (pollId: string, optionId: string) => Promise<void>;
  onClosePoll?: (pollId: string) => Promise<void>;
  onOpenCreateModal: () => void;
}

export function LobbyPollsDialog({
  isOpen,
  onClose,
  polls,
  currentUserId,
  isModeratorOrOwner = false,
  onVote,
  onClosePoll,
  onOpenCreateModal,
}: LobbyPollsDialogProps) {
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

  const activePolls = polls.filter((p) => !p.is_closed);
  const closedPolls = polls.filter((p) => p.is_closed);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[680px] max-w-[680px] h-[640px] max-h-[88vh] bg-[#f8fafc] border-4 border-black brutal-shadow p-6 text-black flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-black" />
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                LOBİ ANKETLERİ
              </DialogTitle>
            </div>
            <Button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-xs h-8 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> Anket Başlat
            </Button>
          </div>
          <DialogDescription className="font-bold text-black/75">
            Lobi üyelerinin açtığı tüm güncel ve tamamlanmış anketler.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "active" | "closed")}
          className="flex-1 flex flex-col min-h-0 mt-3"
        >
          <TabsList className="bg-white border-2 border-black p-1 rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] grid grid-cols-2 shrink-0">
            <TabsTrigger
              value="active"
              className="font-black text-xs py-1.5 data-[state=active]:bg-[#FEF08A] data-[state=active]:text-black border border-transparent data-[state=active]:border-black"
            >
              Aktif Anketler ({activePolls.length})
            </TabsTrigger>
            <TabsTrigger
              value="closed"
              className="font-black text-xs py-1.5 data-[state=active]:bg-[#FEF08A] data-[state=active]:text-black border border-transparent data-[state=active]:border-black"
            >
              Tamamlananlar ({closedPolls.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Polls Tab */}
          <TabsContent value="active" className="flex-1 min-h-0 overflow-y-auto space-y-3 py-3 pr-1 mt-0">
            {activePolls.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 bg-white border-2 border-dashed border-gray-300 rounded-sm">
                <Inbox className="w-10 h-10 text-gray-400 mb-2" />
                <h4 className="font-black text-base text-gray-700">Aktif Anket Bulunmuyor</h4>
                <p className="text-xs font-bold text-gray-500 mt-1 max-w-xs">
                  Odadaki diğer üyelerin fikirlerini almak için hemen yeni bir anket başlatın.
                </p>
                <Button
                  onClick={() => {
                    onClose();
                    onOpenCreateModal();
                  }}
                  className="mt-3 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-xs h-8 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1" /> Yeni Anket Oluştur
                </Button>
              </div>
            ) : (
              activePolls.map((poll) => (
                <LobbyPollCard
                  key={poll.id}
                  poll={poll}
                  currentUserId={currentUserId}
                  isModeratorOrOwner={isModeratorOrOwner}
                  onVote={onVote}
                  onClosePoll={onClosePoll}
                />
              ))
            )}
          </TabsContent>

          {/* Closed Polls Tab */}
          <TabsContent value="closed" className="flex-1 min-h-0 overflow-y-auto space-y-3 py-3 pr-1 mt-0">
            {closedPolls.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 bg-white border-2 border-dashed border-gray-300 rounded-sm">
                <Inbox className="w-10 h-10 text-gray-400 mb-2" />
                <h4 className="font-black text-base text-gray-700">Tamamlanan Anket Yok</h4>
                <p className="text-xs font-bold text-gray-500 mt-1">
                  Sonlandırılan anketlerin sonuçları burada arşivlenir.
                </p>
              </div>
            ) : (
              closedPolls.map((poll) => (
                <LobbyPollCard
                  key={poll.id}
                  poll={poll}
                  currentUserId={currentUserId}
                  isModeratorOrOwner={isModeratorOrOwner}
                  onVote={onVote}
                  onClosePoll={onClosePoll}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
