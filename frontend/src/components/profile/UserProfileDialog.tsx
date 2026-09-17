import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api/users";
import { PublicUserProfile } from "@/types";

interface UserProfileDialogProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDialog({ userId, isOpen, onClose }: UserProfileDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError(null);
      usersApi.getUserProfile(userId)
        .then(setProfile)
        .catch(err => {
          console.error("Failed to load profile", err);
          setError("Failed to load profile.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-pink-50 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">User Profile</DialogTitle>
          <DialogDescription className="text-black font-bold">
            Detailed information about this user.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center font-bold">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center font-bold text-red-600">{error}</div>
        ) : profile ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="w-32 h-32 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-4xl font-black bg-yellow-300 text-black">
                {profile.display_name?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center w-full">
              <h2 className="text-3xl font-black">{profile.display_name || profile.username}</h2>
              <p className="text-lg font-bold text-gray-700">@{profile.username}</p>
              
              {profile.is_bot && (
                <span className="inline-block mt-2 px-3 py-1 bg-purple-500 text-white font-bold rounded-full border-2 border-black">
                  🤖 Bot
                </span>
              )}
            </div>

            <div className="w-full bg-white border-2 border-black p-4 mt-2">
              <h3 className="font-black mb-2 text-lg">About</h3>
              <p className="font-bold text-gray-800 break-words">
                {profile.bio || "This user hasn't added a bio yet."}
              </p>
            </div>

            <div className="w-full text-right mt-2">
              <p className="text-sm font-bold text-gray-600">
                Joined: {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>

            {!profile.is_bot && user && user.id !== profile.id && (
              <Button
                onClick={() => {
                  router.push(`/messages?userId=${profile.id}`);
                  onClose();
                }}
                className="w-full bg-[#FEF08A] hover:bg-[#fde047] text-black border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer mt-2"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Direct Message
              </Button>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
