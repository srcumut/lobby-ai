"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Compass, User, LogOut, LogIn, UserPlus } from "lucide-react";
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

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b-4 border-black bg-[#A78BFA] px-6 py-4 flex items-center justify-between z-50 relative brutal-shadow" style={{ backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.05) 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}>
      <Link href="/" className="flex items-center group cursor-pointer pt-2 pb-2">
        <div className="flex -space-x-2">
          <div className="bg-[#4ADE80] border-[3px] border-black px-3 py-1 transform -rotate-6 group-hover:rotate-0 group-hover:-translate-y-1 transition-all z-10 shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)]">
            <span className="font-black text-xl tracking-tighter uppercase text-black">LOBBY</span>
          </div>
          <div className="bg-[#FEF08A] border-[3px] border-black px-3 py-1 transform rotate-6 group-hover:rotate-0 group-hover:-translate-y-1 transition-all z-0 shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)]">
            <span className="font-black text-xl tracking-tighter uppercase text-black">AI</span>
          </div>
        </div>
      </Link>
      
      <nav className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-4 sm:gap-6 mr-2">
              <Link href="/lobbies" className="flex items-center gap-2 font-black text-lg hover:text-white transition-colors uppercase tracking-wide group cursor-pointer">
                <div className="bg-white p-1 rounded-sm brutal-border group-hover:-translate-y-1 group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <Compass className="w-5 h-5 text-black" />
                </div>
                <span className="hidden sm:inline">Rooms</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-2 font-bold px-3 py-1.5 bg-[#4ADE80] brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-md hover:-translate-y-1 transition-all text-black group cursor-pointer">
                {user?.avatar_url ? (
                  <img
                    src={getAvatarUrl(user.avatar_url)}
                    alt={user.username}
                    className="w-6 h-6 rounded-full object-cover border border-black"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="hidden md:inline">Hi, {user?.display_name || user?.username}</span>
              </Link>
            </div>
            <AlertDialog>
              <AlertDialogTrigger render={
                <Button variant="secondary" className="bg-[#F472B6] hover:bg-[#db2777] text-black font-black brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] uppercase hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              } />
              <AlertDialogContent className="brutal-border brutal-shadow bg-[#FEF08A]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-3xl font-black uppercase">Leaving so soon?</AlertDialogTitle>
                  <AlertDialogDescription className="font-bold text-black/80 text-lg">
                    Are you sure you want to log out of your account?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="font-black bg-white text-black brutal-border hover:bg-gray-100 uppercase cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={logout} className="font-black bg-[#4ADE80] text-black brutal-border hover:bg-[#22c55e] brutal-shadow hover:translate-y-[1px] hover:translate-x-[1px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] uppercase cursor-pointer">
                    Yes, Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline" className="bg-white text-black font-black brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all uppercase cursor-pointer">
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="default" className="bg-[#4ADE80] text-black font-black brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#22c55e] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all uppercase cursor-pointer">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
