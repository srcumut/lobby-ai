import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Bot, 
  UserPlus, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  Edit3, 
  Loader2,
  Flag,
  Coins,
  Award
} from "lucide-react";
import { BADGE_CATALOG } from "@/data/badges";
import { ReportUserModal } from "@/components/moderation/ReportUserModal";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api/users";
import { friendsApi } from "@/lib/api/friends";
import { getAvatarUrl, getBannerStyle } from "@/lib/avatar";
import { PublicUserProfile } from "@/types";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

interface UserProfileDialogProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDialog({ userId, isOpen, onClose }: UserProfileDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSendingFriendReq, setIsSendingFriendReq] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError(null);
      usersApi.getUserProfile(userId)
        .then(setProfile)
        .catch(err => {
          console.error("Failed to load profile", err);
          setError("Profil yüklenemedi.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  const handleCopyUsername = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`@${profile.username}`);
    setCopied(true);
    toast.add({
      title: "Kopyalandı",
      description: `@${profile.username} panoya kopyalandı.`,
      type: "info",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    setIsSendingFriendReq(true);
    try {
      await friendsApi.sendFriendRequest({ username: profile.username });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      toast.add({
        title: "İstek Gönderildi",
        description: `@${profile.username} kullanıcısına arkadaşlık isteği iletildi.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "İstek Gönderilemedi",
        description: err.response?.data?.error?.message || "Arkadaşlık isteği gönderilirken hata oluştu.",
        type: "error",
      });
    } finally {
      setIsSendingFriendReq(false);
    }
  };

  const isSelf = user?.id === profile?.id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] w-[95vw] bg-white brutal-border border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none p-0 overflow-hidden flex flex-col">
        {loading ? (
          <div className="h-[420px] flex flex-col items-center justify-center gap-3 bg-yellow-50">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="font-black text-sm uppercase tracking-wider">Profil Yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="h-[420px] flex flex-col items-center justify-center gap-2 p-6 text-center bg-red-50">
            <p className="font-black text-base text-red-600 uppercase">Profil Yüklenemedi</p>
            <p className="text-xs font-bold text-gray-600">{error}</p>
            <Button 
              size="sm"
              onClick={onClose} 
              className="mt-4 brutal-btn bg-white text-black text-xs font-black"
            >
              Kapat
            </Button>
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            {/* Header Cover Banner */}
            {(() => {
              const activeBannerUrl = (user && user.id === profile.id) ? (user.banner_url ?? profile.banner_url) : profile.banner_url;
              const bannerStyle = getBannerStyle(activeBannerUrl);
              return (
                <div 
                  className={`h-28 border-b-4 border-black relative p-3 flex items-start justify-start ${bannerStyle.className}`}
                  style={bannerStyle.style}
                >
                  <span className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    profile.is_bot ? "bg-[#F472B6] text-black" : "bg-[#FEF08A] text-black"
                  }`}>
                    {profile.is_bot ? "🤖 YAPAY ZEKA BOTU" : "🛡️ ÜYE"}
                  </span>
                </div>
              );
            })()}

            {/* Profile Avatar & Identity */}
            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex items-end justify-between -mt-14 mb-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-[#FEF9C3]">
                    <AvatarImage src={getAvatarUrl(profile.avatar_url)} alt={profile.username} className="object-cover" />
                    <AvatarFallback className="bg-[#FB923C] font-black text-3xl text-black">
                      {profile.is_bot ? (
                        <Bot className="w-12 h-12 text-black" />
                      ) : (
                        profile.display_name?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status dot */}
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#4ADE80] border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]" title="Çevrim İçi" />
                </div>

                {/* Copy handle button */}
                <button
                  type="button"
                  onClick={handleCopyUsername}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer flex items-center gap-1.5"
                  title="Kullanıcı Adını Kopyala"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                  <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
                </button>
              </div>

              {/* Names & Handle */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
                  {profile.display_name || profile.username}
                  {profile.is_bot && (
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded font-black uppercase">
                      BOT
                    </span>
                  )}
                </h2>
                <p className="text-sm font-bold text-gray-600 flex items-center gap-1">
                  <span>@{profile.username}</span>
                </p>
              </div>

              {/* Status Tagline */}
              {(() => {
                const userTagline = profile.tagline || (typeof window !== "undefined" ? localStorage.getItem(`lobby-ai:user-status-${profile.id}`) : null);
                if (!userTagline) return null;
                return (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-xs font-black text-black">
                    <span>💬 {userTagline}</span>
                  </div>
                );
              })()}

              {/* Stats Bar */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t-2 border-gray-100">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E0F4FF] text-blue-900 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Katılım: {new Date(profile.created_at).toLocaleDateString("tr-TR")}</span>
                </div>
                {!profile.is_bot && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FEF9C3] text-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black uppercase">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>{profile.coins ?? 0} Coin</span>
                  </div>
                )}
                {profile.is_bot ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F3E8FF] text-purple-900 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Otonom Ajan</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DCFCE7] text-green-900 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black uppercase">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Doğrulanmış Üye</span>
                  </div>
                )}
              </div>

              {/* Bio & Public Bio Box */}
              {profile.is_bot ? (
                <div className="mt-3 bg-[#CFFAFE] border-2 border-black p-3.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-cyan-900 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> Ajan Açıklaması & Görevi
                    </p>
                    {profile.owner_username && (
                      <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                        Oluşturan: @{profile.owner_username}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-800 break-words leading-relaxed">
                    {profile.public_bio || profile.bio || "Bu yapay zeka ajanı lobide sohbet etmek ve oyunlara katılmak için yapılandırıldı."}
                  </p>
                </div>
              ) : (
                <div className="mt-3 bg-[#FEF08A]/40 border-2 border-black p-3.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/70 mb-1">
                    Biyografi
                  </p>
                  <p className="text-xs font-bold text-gray-800 break-words leading-relaxed">
                    {profile.bio || "Bu kullanıcı henüz bir biyografi eklemedi."}
                  </p>
                </div>
              )}

              {/* Badges Section */}
              {profile.badges && profile.badges.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/70 mb-1.5 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" /> Rozetler & Başarımlar ({profile.badges.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    {profile.badges.map((badgeId) => {
                      const badgeMeta = BADGE_CATALOG.find((b) => b.id === badgeId) || {
                        id: badgeId,
                        name: badgeId,
                        icon: "🎖️",
                        description: "Kazanılmış Rozet",
                      };
                      return (
                        <div
                          key={badgeId}
                          className="flex items-center gap-1 px-2 py-0.5 bg-[#FDFBF7] hover:bg-[#FEF08A] border border-black text-[10px] font-black text-black rounded-xs shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-colors cursor-default"
                          title={`${badgeMeta.name}: ${badgeMeta.description}`}
                        >
                          <span>{badgeMeta.icon}</span>
                          <span>{badgeMeta.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-5 pt-2 flex flex-col sm:flex-row gap-2.5">
                {isSelf ? (
                  <Button
                    onClick={() => {
                      router.push("/profile");
                      onClose();
                    }}
                    className="w-full bg-[#60A5FA] hover:bg-[#3b82f6] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer h-10"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Profilimi Düzenle
                  </Button>
                ) : (
                  <>
                    {!profile.is_bot && (
                      <Button
                        onClick={() => {
                          router.push(`/messages?userId=${profile.id}`);
                          onClose();
                        }}
                        className="flex-1 bg-[#FEF08A] hover:bg-[#fde047] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer h-10"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mesaj Gönder
                      </Button>
                    )}

                    {!profile.is_bot && (
                      <Button
                        onClick={handleSendFriendRequest}
                        disabled={isSendingFriendReq}
                        className="flex-1 bg-[#4ADE80] hover:bg-[#22c55e] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer h-10"
                      >
                        {isSendingFriendReq ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Arkadaş Ekle
                      </Button>
                    )}

                    {!profile.is_bot && (
                      <Button
                        variant="outline"
                        onClick={() => setReportModalOpen(true)}
                        className="h-10 px-3 bg-[#FFE4E6] hover:bg-[#FECDD3] text-red-700 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
                        title="Kullanıcıyı Şikayet Et"
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    )}

                    {profile.is_bot && (
                      <div className="w-full text-center py-2 bg-purple-50 border-2 border-black text-xs font-black uppercase text-purple-900">
                        🤖 Yapay Zeka Ajanı • Lobilerde @{profile.username} ile bahsedebilirsiniz
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Report User Modal */}
        {profile && (
          <ReportUserModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            targetUser={{
              id: profile.id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
