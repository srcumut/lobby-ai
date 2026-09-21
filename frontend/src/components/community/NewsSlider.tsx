// ============================================================================
// TARGET_DESTINATION: frontend/src/components/community/NewsSlider.tsx
// PURPOSE: Developer & Community News Slider with smooth sliding, fixed height and full read modal
// ============================================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { PLATFORM_NEWS, NewsPost } from "@/data/news";
import { Button } from "@/components/ui/button";
import { 
  Newspaper, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  User, 
  X,
  PlusCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function NewsSlider() {
  const [posts, setPosts] = useState<NewsPost[]>(PLATFORM_NEWS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New post form state
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<"Duyuru" | "Geliştirme Günlüğü" | "Etkinlik" | "Topluluk">("Duyuru");

  // Autoplay timer
  useEffect(() => {
    if (isPaused || posts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, posts.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const created: NewsPost = {
      id: `news-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      date: "Şimdi",
      author: {
        name: "Geliştirici",
        role: "Proje Moderatörü",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
      },
      summary: newSummary,
      content: newContent || newSummary,
      tag: "Topluluk Gönderisi",
      badgeColor: "bg-[#FEF08A] text-black",
      readTime: "1 dk okuma"
    };

    setPosts((prev) => [created, ...prev]);
    setCurrentIndex(0);
    setNewTitle("");
    setNewSummary("");
    setNewContent("");
    setShowCreateModal(false);
  };

  return (
    <div 
      className="space-y-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-[#FEF08A] border-2 border-black shadow-[1.5px_1.5px_0_0_#000]">
            <Newspaper className="w-4 h-4 text-black" />
          </span>
          <h3 className="font-black text-xs uppercase tracking-wider text-black">
            Geliştirici & Topluluk Haberleri
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-7 px-2.5 bg-white hover:bg-[#FAF8F0] text-black border-2 border-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] cursor-pointer"
          >
            <PlusCircle className="w-3 h-3 mr-1 text-[#FB923C]" /> Haber Paylaş
          </Button>

          {/* Nav arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="w-7 h-7 bg-white hover:bg-gray-100 border-2 border-black flex items-center justify-center font-black shadow-[1.5px_1.5px_0_0_#000] active:translate-y-px cursor-pointer"
              title="Önceki Haber"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-black" />
            </button>
            <button
              onClick={handleNext}
              className="w-7 h-7 bg-white hover:bg-gray-100 border-2 border-black flex items-center justify-center font-black shadow-[1.5px_1.5px_0_0_#000] active:translate-y-px cursor-pointer"
              title="Sonraki Haber"
            >
              <ChevronRight className="w-3.5 h-3.5 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Slider viewport: Fixed height 210px to eliminate layout jumping */}
      <div className="relative overflow-hidden border-2 border-black bg-white shadow-[3px_3px_0_0_#000] h-[210px] rounded-sm">
        <div 
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {posts.map((post) => (
            <div
              key={post.id}
              className="w-full shrink-0 h-full p-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase border border-black ${post.badgeColor} shadow-[1px_1px_0_0_#000]`}>
                    {post.category} • {post.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h4 className="font-black text-sm text-black leading-snug line-clamp-2">
                  {post.title}
                </h4>

                <p className="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed">
                  {post.summary}
                </p>
              </div>

              {/* Footer row */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-5 h-5 rounded-full object-cover border border-black"
                  />
                  <div className="text-[10px] font-black text-black">
                    {post.author.name} <span className="font-medium text-gray-500">({post.author.role})</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setSelectedPost(post)}
                  className="h-7 px-3 bg-[#FEF08A] hover:bg-[#FDE047] text-black border border-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] cursor-pointer"
                >
                  Haberi Oku
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {posts.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 transition-all rounded-none cursor-pointer border border-black ${
              currentIndex === idx 
                ? "w-6 bg-black shadow-[1px_1px_0_0_#000]" 
                : "w-2 bg-gray-200 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Full News Read Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-xl bg-[#FAF8F0] border-4 border-black brutal-shadow p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 text-xs font-black uppercase border-2 border-black ${selectedPost?.badgeColor}`}>
                {selectedPost?.category}
              </span>
              <span className="text-xs font-bold text-gray-600">
                {selectedPost?.date} • {selectedPost?.readTime}
              </span>
            </div>
            <DialogTitle className="text-xl font-black text-black leading-tight">
              {selectedPost?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Author box */}
            <div className="p-3 bg-white border-2 border-black flex items-center gap-3 shadow-[2px_2px_0_0_#000]">
              <img
                src={selectedPost?.author.avatar}
                alt={selectedPost?.author.name}
                className="w-10 h-10 rounded-full border-2 border-black object-cover"
              />
              <div>
                <span className="font-black text-xs text-black block">
                  {selectedPost?.author.name}
                </span>
                <span className="text-[11px] font-bold text-gray-500">
                  {selectedPost?.author.role}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 bg-[#FEF08A]/50 border-2 border-black text-xs font-bold text-gray-800">
              {selectedPost?.summary}
            </div>

            {/* Main content */}
            <div className="text-xs font-medium text-gray-800 whitespace-pre-line leading-relaxed space-y-2 bg-white p-4 border-2 border-black shadow-[2px_2px_0_0_#000]">
              {selectedPost?.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin / Dev News Creator Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md bg-[#FAF8F0] border-4 border-black brutal-shadow p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-black">
              Yeni Platform Haberi Paylaş
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-3 mt-3">
            <div>
              <label className="text-[11px] font-black uppercase text-black block mb-1">
                Kategori
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border-2 border-black font-bold text-xs"
              >
                <option value="Duyuru">Duyuru</option>
                <option value="Geliştirme Günlüğü">Geliştirme Günlüğü</option>
                <option value="Etkinlik">Etkinlik</option>
                <option value="Topluluk">Topluluk</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-black block mb-1">
                Haber Başlığı
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Örn: Lobby AI 2.1 Güncellemesi..."
                required
                className="w-full px-3 py-2 bg-white border-2 border-black font-bold text-xs text-black"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-black block mb-1">
                Kısa Özet
              </label>
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Slider kartında görünecek 1-2 cümlelik özet..."
                rows={2}
                required
                className="w-full px-3 py-2 bg-white border-2 border-black font-bold text-xs text-black"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-black block mb-1">
                Detaylı İçerik
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Habere tıklandığında açılacak detaylı metin..."
                rows={4}
                className="w-full px-3 py-2 bg-white border-2 border-black font-bold text-xs text-black"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-2 border-black font-black text-xs"
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="bg-[#4ADE80] hover:bg-[#22c55e] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_#000]"
              >
                Yayınla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
