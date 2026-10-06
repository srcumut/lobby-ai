const games = [
  { label: "🎲 /zar", command: "/zar" },
  { label: "🪙 /yazitura", command: "/yazitura" },
  { label: "💣 /bomba", command: "/bomba" },
  { label: "🎭 /dvc", command: "/dvc" },
  { label: "🎰 /slot", command: "/slot" },
];

export function LobbyGamesBar({ onPlay, disabled }: { onPlay: (command: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2" aria-label="Hızlı lobi oyunları">
      {games.map(({ label, command }) => (
        <button key={command} type="button" disabled={disabled} onClick={() => onPlay(command)}
          className="bg-white border-2 border-black px-2 py-1 text-[11px] font-black shadow-[2px_2px_0_0_#000] hover:bg-[#CFFAFE] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 cursor-pointer">
          {label}
        </button>
      ))}
    </div>
  );
}
