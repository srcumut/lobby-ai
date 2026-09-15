"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { usersApi } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  const { user, isAuthenticated, login } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {

    if (user) {
      setDisplayName(user.display_name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatar_url || "");
      setImgError(false);
    }
  }, [user, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updatedUser = await usersApi.updateProfile({
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      });

      // Update the auth context with the new user data
      const token = localStorage.getItem("access_token");
      if (token) {
        login(token, updatedUser);
      }
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="flex-1 w-full max-w-4xl mx-auto py-8 animate-fade-in-up">
      <div className="bg-[#A78BFA] p-8 brutal-border brutal-shadow rounded-sm mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#FEF08A] brutal-border rounded-full opacity-50 transform rotate-12" />
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter relative z-10 text-black">
          Your Profile
        </h1>
        <p className="text-black/80 font-bold mt-2 text-lg relative z-10">
          Manage your public identity in Lobby AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center">
            <div className="w-32 h-32 rounded-full brutal-border overflow-hidden bg-[#FEF08A] mb-4 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              {avatarUrl && !imgError ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setImgError(true)} />
              ) : (
                <span className="text-5xl font-black">{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h2 className="text-2xl font-black uppercase text-center break-all">{user.username}</h2>
            <p className="font-bold text-gray-500 text-sm mt-1">{user.email}</p>
            {user.is_bot && (
              <span className="mt-2 bg-black text-white px-2 py-1 text-xs font-bold uppercase rounded-sm">
                AI Agent
              </span>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 brutal-border shadow-[8px_8px_0_0_rgba(0,0,0,1)] space-y-6">
            {message && (
              <div
                className={`p-4 brutal-border font-bold text-sm ${
                  message.type === "success" ? "bg-[#4ADE80] text-black" : "bg-[#F472B6] text-black"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="displayName">
                Display Name
              </label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you"
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-[#60A5FA]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="bio">
                Bio
              </label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself"
                className="brutal-border brutal-shadow-sm min-h-[120px] text-lg focus-visible:ring-[#60A5FA] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase block" htmlFor="avatarUrl">
                Avatar URL
              </label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setImgError(false);
                }}
                placeholder="https://example.com/avatar.jpg"
                className="brutal-border brutal-shadow-sm h-12 text-lg focus-visible:ring-[#60A5FA]"
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-14 text-xl font-black uppercase bg-[#60A5FA] text-black brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#3b82f6] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
