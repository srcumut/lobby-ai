export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 bg-[#FEF08A] brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-2 bg-[#60A5FA] brutal-border animate-[spin_4s_linear_infinite_reverse]" />
        <div className="absolute inset-4 bg-[#F472B6] brutal-border animate-[spin_2s_linear_infinite]" />
      </div>
      <div className="bg-white px-4 py-2 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-2xl font-black uppercase tracking-widest animate-pulse">
        Loading...
      </div>
    </div>
  );
}
