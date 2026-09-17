"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { friendsApi, IncomingFriendRequest } from "@/lib/api/friends";
import { UserInfo } from "@/types";
import { toast } from "@/components/ui/toast";
import { 
  Users, 
  UserPlus, 
  Search, 
  UserMinus, 
  Check, 
  X, 
  Clock, 
  UserCheck, 
  Loader2, 
  User,
  MessageSquare 
} from "lucide-react";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";

interface AllFriendsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendsUpdated: () => void;
  onOpenAddFriend: () => void;
}

export function AllFriendsDialog({
  isOpen,
  onClose,
  onFriendsUpdated,
  onOpenAddFriend,
}: AllFriendsDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"friends" | "pending">("friends");
  const [friends, setFriends] = useState<UserInfo[]>([]);
  const [pendingRequests, setPendingRequests] = useState<IncomingFriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Profile Dialog state
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Remove friend confirmation state
  const [friendToRemove, setFriendToRemove] = useState<UserInfo | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Processing requests state
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [friendsData, pendingData] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
    } catch (err) {
      console.error("Failed to load friends data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleAcceptRequest = async (requestId: string, username: string) => {
    setProcessingId(requestId);
    try {
      await friendsApi.acceptRequest(requestId);
      toast.add({
        title: "Friend Request Accepted",
        description: `You are now friends with ${username}!`,
        type: "success",
      });
      await loadData();
      onFriendsUpdated();
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to accept request",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await friendsApi.rejectRequest(requestId);
      toast.add({
        title: "Request Declined",
        description: "Friend request was declined.",
        type: "info",
      });
      await loadData();
      onFriendsUpdated();
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to decline request",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;
    setIsRemoving(true);
    try {
      await friendsApi.removeFriend(friendToRemove.id);
      toast.add({
        title: "Friend Removed",
        description: `Removed ${friendToRemove.username} from your friends.`,
        type: "info",
      });
      setFriendToRemove(null);
      await loadData();
      onFriendsUpdated();
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to remove friend",
        type: "error",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase();
    return friends.filter(
      (f) =>
        f.username.toLowerCase().includes(q) ||
        (f.display_name && f.display_name.toLowerCase().includes(q))
    );
  }, [friends, searchQuery]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px] bg-white brutal-border border-4 brutal-shadow shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-0 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <DialogHeader className="p-4 border-b-4 border-black bg-[#E0F4FF] shrink-0">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
                <Users className="w-6 h-6" /> Friends Hub
              </DialogTitle>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenAddFriend();
                }}
                className="bg-[#4ADE80] hover:bg-[#22c55e] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Add Friend
              </Button>
            </div>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="flex border-b-2 border-black bg-gray-50 shrink-0">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-2.5 font-black text-xs uppercase flex items-center justify-center gap-2 border-r-2 border-black transition-colors cursor-pointer ${
                activeTab === "friends"
                  ? "bg-[#FEF08A] text-black shadow-inner"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>All Friends</span>
              <span className="bg-black text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {friends.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 py-2.5 font-black text-xs uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === "pending"
                  ? "bg-[#FEF08A] text-black shadow-inner"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>Requests</span>
              {pendingRequests.length > 0 && (
                <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Search bar (only on friends tab) */}
          {activeTab === "friends" && (
            <div className="p-3 border-b-2 border-black bg-gray-50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 font-bold" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter friends by name or username..."
                  className="pl-9 bg-white border-2 border-black font-bold text-xs h-9 shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none"
                />
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 divide-y-2 divide-gray-100">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-500 font-bold">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
                <span className="text-xs uppercase">Loading friends...</span>
              </div>
            ) : activeTab === "friends" ? (
              filteredFriends.length > 0 ? (
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-3 bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-between gap-3 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          setProfileUserId(friend.id);
                          setProfileOpen(true);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#A78BFA] border-2 border-black flex items-center justify-center font-black text-white shrink-0 text-sm shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm truncate" title={friend.display_name || friend.username}>
                            {friend.display_name || friend.username}
                          </h4>
                          <p className="text-xs font-bold text-gray-500 truncate">
                            @{friend.username}
                          </p>
                          {friend.bio && (
                            <p className="text-[11px] font-medium text-gray-600 truncate mt-0.5 italic">
                              "{friend.bio}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            router.push(`/messages?userId=${friend.id}`);
                            onClose();
                          }}
                          className="h-8 px-2.5 bg-[#FEF08A] hover:bg-[#fde047] text-black border-2 border-black font-black text-xs uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setProfileUserId(friend.id);
                            setProfileOpen(true);
                          }}
                          className="h-8 px-2.5 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs uppercase"
                        >
                          <User className="w-3.5 h-3.5 mr-1" />
                          Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setFriendToRemove(friend)}
                          className="h-8 w-8 p-0 bg-[#FFE4E6] hover:bg-red-200 text-red-700 border-2 border-black"
                          title="Remove Friend"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-black flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-black text-sm uppercase">
                    {searchQuery ? "No matching friends found" : "No friends added yet"}
                  </p>
                  <p className="text-xs font-bold text-gray-500 max-w-xs">
                    {searchQuery
                      ? "Try searching for another keyword."
                      : "Add friends using their username to see them here and chat together."}
                  </p>
                </div>
              )
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-[#FEF08A] brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center font-black text-black shrink-0 text-sm">
                        {req.sender.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-sm truncate">
                          {req.sender.display_name || req.sender.username}
                        </h4>
                        <p className="text-xs font-bold text-gray-600">
                          @{req.sender.username}
                        </p>
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={processingId === req.id}
                        onClick={() => handleAcceptRequest(req.id, req.sender.username)}
                        className="bg-[#4ADE80] hover:bg-[#22c55e] text-black border-2 border-black font-black text-xs uppercase h-8 px-3 shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === req.id}
                        onClick={() => handleRejectRequest(req.id)}
                        className="bg-white hover:bg-gray-100 text-red-600 border-2 border-black font-black text-xs uppercase h-8 px-2.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-black flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-black text-sm uppercase">No Pending Requests</p>
                <p className="text-xs font-bold text-gray-500">
                  You don't have any incoming friend requests at the moment.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Friend Confirmation Alert */}
      <AlertDialog open={!!friendToRemove} onOpenChange={(open) => !open && setFriendToRemove(null)}>
        <AlertDialogContent className="brutal-border border-4 brutal-shadow bg-[#FEF08A] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-red-600" />
              Remove Friend?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-black/80 text-xs">
              Are you sure you want to remove <span className="underline font-black">{friendToRemove?.username}</span> from your friends list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel
              disabled={isRemoving}
              className="font-black uppercase bg-white border-2 border-black"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveFriend();
              }}
              disabled={isRemoving}
              className="font-black uppercase bg-red-600 hover:bg-red-700 text-white border-2 border-black"
            >
              {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Dialog */}
      <UserProfileDialog
        userId={profileUserId}
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}
