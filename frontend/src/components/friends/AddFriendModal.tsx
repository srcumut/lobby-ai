import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { friendsApi, IncomingFriendRequest } from "@/lib/api/friends";
import { UserPlus, Check, X, Clock } from "lucide-react";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendsUpdated: () => void;
}

export function AddFriendModal({ isOpen, onClose, onFriendsUpdated }: AddFriendModalProps) {
  const [username, setUsername] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState<IncomingFriendRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const fetchPendingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const reqs = await friendsApi.getPendingRequests();
      setPendingRequests(reqs);
    } catch (err) {
      console.error("Failed to fetch pending requests", err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests();
      setUsername("");
      setSendError(null);
      setSendSuccess(false);
    }
  }, [isOpen]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);
    
    try {
      await friendsApi.sendFriendRequest({ username: username.trim() });
      setSendSuccess(true);
      setUsername("");
    } catch (err: any) {
      setSendError(err.response?.data?.error?.message || "Failed to send friend request");
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await friendsApi.acceptRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      onFriendsUpdated();
    } catch (err) {
      console.error("Failed to accept request", err);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await friendsApi.rejectRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error("Failed to reject request", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md brutal-border border-4 brutal-shadow p-0 overflow-hidden bg-white">
        <DialogHeader className="bg-[#A78BFA] p-6 border-b-4 border-black">
          <DialogTitle className="text-2xl font-black uppercase text-black flex items-center gap-2">
            <UserPlus className="w-6 h-6" /> Manage Friends
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {/* Send Request Section */}
          <div className="space-y-3">
            <h3 className="font-black text-sm uppercase tracking-wider text-gray-600">Add a Friend</h3>
            <form onSubmit={handleSendRequest} className="flex gap-2">
              <Input
                placeholder="Enter exact username..."
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setSendError(null);
                  setSendSuccess(false);
                }}
                className="brutal-border border-2 font-bold focus-visible:ring-0"
              />
              <Button 
                type="submit" 
                disabled={isSending || !username.trim()}
                className="bg-black text-white font-bold brutal-border border-2 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
              >
                Send
              </Button>
            </form>
            {sendError && (
              <div className="text-red-500 font-bold text-sm bg-red-100 p-2 brutal-border border-2">
                {sendError}
              </div>
            )}
            {sendSuccess && (
              <div className="text-green-600 font-bold text-sm bg-green-100 p-2 brutal-border border-2">
                Friend request sent successfully!
              </div>
            )}
          </div>

          <div className="border-t-2 border-black border-dashed pt-4"></div>

          {/* Incoming Requests Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider text-gray-600">Pending Requests</h3>
              {pendingRequests.length > 0 && (
                <Badge className="bg-black text-white font-bold">{pendingRequests.length}</Badge>
              )}
            </div>
            
            {isLoadingRequests ? (
              <div className="text-center py-4 font-bold animate-pulse text-gray-500">Loading requests...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 font-bold text-gray-500 bg-gray-50 border-2 border-dashed border-gray-300">
                No pending requests
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 border-2 border-black bg-[#f8fafc] shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-[#4ADE80] rounded-full border-2 border-black flex items-center justify-center font-black text-lg shrink-0">
                        {req.sender.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black truncate">{req.sender.username}</span>
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleAccept(req.id)}
                        className="w-8 h-8 rounded-full bg-green-400 border-2 border-black flex items-center justify-center hover:bg-green-500 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                        title="Accept"
                      >
                        <Check className="w-4 h-4 text-black" />
                      </button>
                      <button 
                        onClick={() => handleReject(req.id)}
                        className="w-8 h-8 rounded-full bg-red-400 border-2 border-black flex items-center justify-center hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                        title="Reject"
                      >
                        <X className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
