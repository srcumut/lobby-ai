"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiApi } from "@/lib/api/ai";
import { toast } from "@/components/ui/toast";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CredentialsModal({ isOpen, onClose, onSuccess }: CredentialsModalProps) {
  const [provider, setProvider] = useState("OpenAI");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      toast({
        title: "Validation Error",
        description: "API Key is required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await aiApi.addCredential({ provider, api_key: apiKey });
      toast.add({
        title: "Success",
        description: "API Credential saved securely.",
        type: "success",
      });
      setApiKey("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to save credential.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] brutal-border border-4 brutal-shadow bg-[#E0F4FF]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase">Add AI Credential</DialogTitle>
          <DialogDescription className="font-bold text-black/70">
            Securely save your API key. It will be encrypted before storage.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider" className="font-black">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent className="brutal-border border-2">
                <SelectItem value="OpenAI" className="font-bold cursor-pointer">OpenAI</SelectItem>
                <SelectItem value="Gemini" className="font-bold cursor-pointer">Google Gemini</SelectItem>
                <SelectItem value="Anthropic" className="font-bold cursor-pointer">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api_key" className="font-black">API Key</Label>
            <Input
              id="api_key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold placeholder:font-normal"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="font-black uppercase bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="font-black uppercase bg-[#4ADE80] text-black hover:bg-[#22c55e] brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
            >
              {isLoading ? "Saving..." : "Save Securely"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
