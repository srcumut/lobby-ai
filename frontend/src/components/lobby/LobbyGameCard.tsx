export function isLobbyGameMessage(content: string) {
  return /^(💣 \[BOMBA\]|💥 \[BOMBA PATLADI\]|🎭 \[(DVC SEÇİMİ|DOĞRULUK|CESARET)\]|🎰 \[SLOT\])/.test(content);
}

export function LobbyGameCard({ content, onChoose }: { content: string; onChoose?: (choice: "dogruluk" | "cesaret") => void }) {
  const choice = content.startsWith("🎭 [DVC SEÇİMİ]");
  const boom = content.startsWith("💥");
  const slot = content.startsWith("🎰");
  const title = slot ? "ŞANS SLOTU" : content.startsWith("🎭") ? "DOĞRULUK MU CESARET Mİ?" : "SOHBET BOMBASI";
  const detail = content.replace(/^[^\[]+\[[^\]]+\]:?\s*/, "");
  return (
    <div className={`max-w-sm border-2 border-black shadow-[3px_3px_0_0_#000] px-3 py-2 text-black ${boom ? "bg-[#FED7AA]" : slot ? "bg-[#EDE9FE]" : choice ? "bg-[#FCE7F3]" : "bg-[#CFFAFE]"}`}>
      <div className="text-[10px] font-black tracking-wider border-b border-black/30 pb-1 mb-1">{title}</div>
      <p className="text-sm font-bold break-words">{detail}</p>
      {choice && onChoose && (
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => onChoose("dogruluk")} className="bg-[#86EFAC] border-2 border-black px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_#000] cursor-pointer">Doğruluk 🟢</button>
          <button type="button" onClick={() => onChoose("cesaret")} className="bg-[#FB923C] border-2 border-black px-2 py-1 text-xs font-black shadow-[2px_2px_0_0_#000] cursor-pointer">Cesaret 🔥</button>
        </div>
      )}
    </div>
  );
}
