"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { friendsApi } from "@/lib/api/friends";
import { UserInfo } from "@/types";
import { AddFriendModal } from "@/components/friends/AddFriendModal";
import { AllFriendsDialog } from "@/components/friends/AllFriendsDialog";
import { 
  Bot, 
  Compass, 
  Home, 
  LogOut, 
  Settings, 
  User, 
  PanelLeftClose, 
  Users, 
  Plus,
  MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [friends, setFriends] = useState<UserInfo[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAllFriendsOpen, setIsAllFriendsOpen] = useState(false);

  const fetchFriendsData = async () => {
    if (!isAuthenticated) return;
    try {
      const [friendsData, pendingData] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingRequests()
      ]);
      setFriends(friendsData);
      setPendingCount(pendingData.length);
    } catch (err) {
      console.error("Failed to fetch friends data", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchFriendsData();

    // Periodic check for new friends / requests every 15s
    const interval = setInterval(() => {
      fetchFriendsData();
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Discover Rooms", href: "/lobbies", icon: Compass },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "My Agents", href: "/agents", icon: Bot },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col
          bg-[#F4F4F5] border-r border-black/[0.08] transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo Area */}
        <div className="h-16 border-b border-black/[0.08] flex items-center justify-center px-4 bg-[#A78BFA] shrink-0 relative">
          <Link href="/" className="flex items-center group cursor-pointer" onClick={() => setIsOpen(false)}>
            <div className="flex -space-x-1">
              <div className="bg-[#4ADE80] border-2 border-black px-2.5 py-0.5 transform -rotate-6 group-hover:rotate-0 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <span className="font-black text-lg tracking-tighter uppercase text-black">LOBBY</span>
              </div>
              <div className="bg-[#FEF08A] border-2 border-black px-2.5 py-0.5 transform rotate-6 group-hover:rotate-0 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <span className="font-black text-lg tracking-tighter uppercase text-black">AI</span>
              </div>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-black hover:bg-black/10 absolute right-3"
            onClick={() => setIsOpen(false)}
          >
            <PanelLeftClose className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-sm font-bold text-sm uppercase transition-all
                      border-2 brutal-border
                      ${isActive 
                        ? 'bg-black text-white shadow-[2px_2px_0_0_rgba(255,255,255,1)] translate-x-1 translate-y-1' 
                        : 'bg-white text-black hover:bg-[#FEF08A] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></span>
                    )}
                  </Link>
                );
              })}

              {/* Friends Section */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    <Users className="w-4 h-4" /> Friends
                    {pendingCount > 0 && (
                      <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-bold animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setIsAllFriendsOpen(true)}
                      className="p-1 bg-[#FEF08A] hover:bg-[#fde047] border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                      title="All Friends & Requests"
                    >
                      <Users className="w-3 h-3 text-black" />
                    </button>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="p-1 bg-[#4ADE80] hover:bg-[#22c55e] border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                      title="Add Friend"
                    >
                      <Plus className="w-3 h-3 text-black" />
                    </button>
                  </div>
                </div>

                {friends.length === 0 ? (
                  <div className="text-xs font-bold text-gray-400 p-2 text-center bg-gray-100 rounded-sm">
                    No friends yet
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {friends.slice(0, 6).map(friend => (
                      <div 
                        key={friend.id} 
                        onClick={() => {
                          router.push(`/messages?userId=${friend.id}`);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 p-1.5 bg-white border-2 border-transparent hover:border-black rounded-sm cursor-pointer group hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                        title={`Message ${friend.username}`}
                      >
                        <div className="w-6 h-6 bg-[#A78BFA] rounded-full border border-black flex items-center justify-center font-black text-[10px] text-white shrink-0 overflow-hidden">
                          {friend.avatar_url ? (
                            <img
                              src={getAvatarUrl(friend.avatar_url)}
                              alt={friend.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            friend.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-sm truncate flex-1">{friend.username}</span>
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 group-hover:text-black shrink-0 transition-colors" />
                      </div>
                    ))}

                    <button
                      onClick={() => setIsAllFriendsOpen(true)}
                      className="w-full mt-2 py-1 text-[11px] font-black uppercase text-center bg-gray-50 hover:bg-[#FEF08A] border-2 border-dashed border-gray-400 hover:border-black rounded-sm transition-all cursor-pointer text-gray-700 hover:text-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                    >
                      View All Friends ({friends.length})
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center mt-10">
              <p className="font-bold text-gray-500 mb-4">Please log in to access the platform.</p>
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-[#4ADE80] text-black border-2 border-black font-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                  LOG IN
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* User Profile (Bottom) */}
        {isAuthenticated && user && (
          <div className="border-t border-black/[0.08] p-4 bg-white shrink-0">
            <div 
              onClick={() => {
                router.push("/profile");
                setIsOpen(false);
              }}
              className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-gray-50 p-1.5 rounded-sm border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all group"
              title="Go to My Profile"
            >
              <div className="w-10 h-10 rounded-full border-2 border-black bg-[#F472B6] flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={getAvatarUrl(user.avatar_url)}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-black" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm truncate group-hover:underline">{user.display_name || user.username}</p>
                <p className="text-xs font-bold text-gray-500 truncate">@{user.username}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 bg-[#E0F4FF] text-black border-2 border-black font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer"
                onClick={() => {
                  router.push("/profile");
                  setIsOpen(false);
                }}
              >
                <Settings className="w-4 h-4 mr-1" />
                Profile
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="bg-[#FFE4E6] text-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                    </Button>
                  }
                />
                <AlertDialogContent className="brutal-border brutal-shadow bg-[#FEF08A]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black uppercase">Leaving so soon?</AlertDialogTitle>
                    <AlertDialogDescription className="font-bold text-black/80">
                      Are you sure you want to log out?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="font-black bg-white text-black border-2 border-black uppercase cursor-pointer">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={logout}
                      className="font-black bg-red-600 text-white border-2 border-black uppercase hover:bg-red-700 cursor-pointer"
                    >
                      Log Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </aside>

      {/* Add Friend Modal */}
      <AddFriendModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onFriendsUpdated={fetchFriendsData}
      />

      {/* All Friends & Requests Hub Dialog */}
      <AllFriendsDialog
        isOpen={isAllFriendsOpen}
        onClose={() => setIsAllFriendsOpen(false)}
        onFriendsUpdated={fetchFriendsData}
        onOpenAddFriend={() => setIsAddModalOpen(true)}
      />
    </>
  );
}
