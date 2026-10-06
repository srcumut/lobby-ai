const ranks = [
  { min: 0, name: "Çay Ocağı", capacity: 20 },
  { min: 100, name: "Mahalle Kahvesi", capacity: 30 },
  { min: 300, name: "Neo Kulüp", capacity: 40 },
  { min: 700, name: "Siber Meydan", capacity: 60 },
  { min: 1500, name: "Efsanevi Lobi", capacity: 100 },
];

export function LobbyXpBar({ xp }: { xp: number }) {
  const safeXp = Math.max(0, xp || 0);
  const index = ranks.reduce((level, rank, i) => safeXp >= rank.min ? i : level, 0);
  const current = ranks[index];
  const next = ranks[index + 1];
  const progress = next ? ((safeXp - current.min) / (next.min - current.min)) * 100 : 100;
  return (
    <div className="min-w-[126px] max-w-[170px]" title={next ? `${next.name} için ${next.min - safeXp} XP kaldı · Kapasite: ${current.capacity}` : `En yüksek seviye · Kapasite: ${current.capacity}`}>
      <div className="inline-block bg-black text-white border-2 border-black px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight whitespace-nowrap">
        {index === 4 ? "🏅 " : ""}LVL {index + 1}: {current.name}
      </div>
      <div className="h-1.5 border border-black bg-white mt-1" role="progressbar" aria-label="Lobi XP ilerlemesi" aria-valuenow={safeXp} aria-valuemin={current.min} aria-valuemax={next?.min ?? safeXp}>
        <div className="h-full bg-[#10B981]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
