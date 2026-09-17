"use client";

import { useState } from "react";
import { LobbyMember } from "@/types";
import { lobbiesApi } from "@/lib/api/lobbies";
import { friendsApi } from "@/lib/api/friends";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  User, 
  UserPlus, 
  MicOff, 
  Mic, 
  UserMinus, 
  Ban, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2 
} from "lucide-react";

interface MemberContextMenuProps {
  member: LobbyMember;
  currentUserId?: string;
  currentUserRole?: string;
  isLobbyOwner: boolean;
  lobbyId: string;
  onOpenProfile: (userId: string) => void;
  onActionSuccess?: () => void;
}

export function MemberContextMenu({
  member,
  currentUserId,
  currentUserRole = "MEMBER",
  isLobbyOwner,
  lobbyId,
  onOpenProfile,
  onActionSuccess,
}: MemberContextMenuProps) {
  const isSelf = currentUserId === member.user_id;
  const isTargetOwner = member.role === "OWNER";
  const isTargetModerator = member.role === "MODERATOR";
  
  const canModerate = (isLobbyOwner || currentUserRole === "OWNER" || currentUserRole === "MODERATOR") && !isSelf && !isTargetOwner;
  // Only owners can moderate moderators or change roles
  const canManageRoles = (isLobbyOwner || currentUserRole === "OWNER") && !isSelf && !member.is_bot;

  // Dialog States
  const [confirmKickOpen, setConfirmKickOpen] = useState(false);
  const [confirmBanOpen, setConfirmBanOpen] = useState(false);
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState<number | undefined>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Friend Request Action
  const handleAddFriend = async () => {
    try {
      await friendsApi.sendFriendRequest({ username: member.username });
      toast.add({
        title: "Friend Request Sent",
        description: `Sent a friend request to ${member.username}.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to send friend request.",
        type: "error",
      });
    }
  };

  // Kick Action
  const handleKick = async () => {
    setIsSubmitting(true);
    try {
      await lobbiesApi.moderateUser(lobbyId, "kick", member.user_id);
      toast.add({
        title: "User Kicked",
        description: `${member.username} was kicked from the lobby.`,
        type: "success",
      });
      setConfirmKickOpen(false);
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Kick Failed",
        description: err.response?.data?.error?.message || "Failed to kick user.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ban Action
  const handleBan = async () => {
    setIsSubmitting(true);
    try {
      await lobbiesApi.moderateUser(lobbyId, "ban", member.user_id);
      toast.add({
        title: "User Banned",
        description: `${member.username} was banned from the lobby.`,
        type: "success",
      });
      setConfirmBanOpen(false);
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Ban Failed",
        description: err.response?.data?.error?.message || "Failed to ban user.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mute Action
  const handleMute = async () => {
    setIsSubmitting(true);
    try {
      await lobbiesApi.moderateUser(lobbyId, "mute", member.user_id, muteDuration);
      toast.add({
        title: "User Muted",
        description: `${member.username} has been muted.`,
        type: "success",
      });
      setMuteDialogOpen(false);
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Mute Failed",
        description: err.response?.data?.error?.message || "Failed to mute user.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Role Action
  const handleToggleRole = async () => {
    const newRole = isTargetModerator ? "MEMBER" : "MODERATOR";
    try {
      await lobbiesApi.setMemberRole(lobbyId, member.user_id, newRole);
      toast.add({
        title: "Role Updated",
        description: `${member.username} is now a ${newRole}.`,
        type: "success",
      });
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Failed to Update Role",
        description: err.response?.data?.error?.message || "Could not change role.",
        type: "error",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 text-gray-500 hover:text-black hover:bg-black/10 rounded-sm cursor-pointer"
              title="Member Options"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          }
        />

        <DropdownMenuContent
          align="end"
          className="w-52 bg-white brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-1.5 font-bold z-50 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Profile */}
          <DropdownMenuItem
            className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded-none font-bold"
            onClick={() => onOpenProfile(member.user_id)}
          >
            <User className="w-4 h-4 text-black" />
            <span>View Profile</span>
            {isSelf && <span className="ml-auto text-[10px] text-gray-400">(You)</span>}
          </DropdownMenuItem>

          {/* Add Friend (Only for other humans) */}
          {!isSelf && !member.is_bot && (
            <DropdownMenuItem
              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded-none font-bold"
              onClick={handleAddFriend}
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Add Friend</span>
            </DropdownMenuItem>
          )}

          {/* Moderation Actions */}
          {canModerate && (
            <>
              <DropdownMenuSeparator className="my-1 border-t-2 border-black" />

              {/* Role promotion / demotion */}
              {canManageRoles && (
                <DropdownMenuItem
                  className="flex items-center gap-2 p-2 hover:bg-purple-50 text-purple-900 cursor-pointer rounded-none font-bold"
                  onClick={handleToggleRole}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>{isTargetModerator ? "Demote to Member" : "Make Moderator"}</span>
                </DropdownMenuItem>
              )}

              {/* Mute (not applicable to bots) */}
              {!member.is_bot && (
                <DropdownMenuItem
                  className="flex items-center gap-2 p-2 hover:bg-amber-50 text-amber-900 cursor-pointer rounded-none font-bold"
                  onClick={() => setMuteDialogOpen(true)}
                >
                  <MicOff className="w-4 h-4 text-amber-600" />
                  <span>Mute User...</span>
                </DropdownMenuItem>
              )}

              {/* Kick */}
              <DropdownMenuItem
                className="flex items-center gap-2 p-2 hover:bg-red-50 text-red-700 cursor-pointer rounded-none font-bold"
                onClick={() => setConfirmKickOpen(true)}
              >
                <UserMinus className="w-4 h-4 text-red-600" />
                <span>Kick from Lobby</span>
              </DropdownMenuItem>

              {/* Ban */}
              <DropdownMenuItem
                className="flex items-center gap-2 p-2 hover:bg-red-50 text-red-700 cursor-pointer rounded-none font-bold"
                onClick={() => setConfirmBanOpen(true)}
              >
                <Ban className="w-4 h-4 text-red-600" />
                <span>Ban from Lobby</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mute Duration Dialog */}
      <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
        <DialogContent className="brutal-border border-4 brutal-shadow bg-[#FEF08A] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <MicOff className="w-5 h-5 text-amber-600" />
              Mute {member.username}
            </DialogTitle>
            <DialogDescription className="font-bold text-black/80 text-xs">
              Select how long this user should be prevented from sending messages in this lobby.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            {[
              { label: "5 Minutes", value: 5 },
              { label: "15 Minutes", value: 15 },
              { label: "1 Hour", value: 60 },
              { label: "Indefinite (Until unmuted)", value: undefined },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setMuteDuration(option.value)}
                className={`w-full p-2.5 text-left font-bold text-xs brutal-border border-2 flex items-center justify-between cursor-pointer transition-all ${
                  muteDuration === option.value
                    ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                <span>{option.label}</span>
                {muteDuration === option.value && <span>✓</span>}
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMuteDialogOpen(false)}
              className="bg-white border-2 border-black font-black uppercase"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleMute}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-black border-2 border-black font-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Mute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kick Confirmation Dialog */}
      <AlertDialog open={confirmKickOpen} onOpenChange={setConfirmKickOpen}>
        <AlertDialogContent className="brutal-border border-4 brutal-shadow bg-[#FEF08A] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-red-600" />
              Kick {member.username}?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-black/80 text-xs">
              The user will be removed from the lobby immediately. If the lobby is public, they may re-join.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel 
              disabled={isSubmitting}
              className="font-black uppercase bg-white border-2 border-black"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleKick();
              }}
              disabled={isSubmitting}
              className="font-black uppercase bg-red-600 hover:bg-red-700 text-white border-2 border-black"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Kick"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={confirmBanOpen} onOpenChange={setConfirmBanOpen}>
        <AlertDialogContent className="brutal-border border-4 brutal-shadow bg-[#FEF08A] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              Ban {member.username}?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-black/80 text-xs">
              This user will be permanently banned from this lobby and cannot re-enter unless unbanned by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel 
              disabled={isSubmitting}
              className="font-black uppercase bg-white border-2 border-black"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBan();
              }}
              disabled={isSubmitting}
              className="font-black uppercase bg-red-600 hover:bg-red-700 text-white border-2 border-black"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Ban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
