export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-[#1f1f1f] border border-[rgba(255,255,255,0.05)] rounded-[6px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f] mb-2">Overview</p>
        <h1 className="text-[18px] font-semibold text-white mb-3 leading-tight">Admin Dashboard</h1>
        <p className="text-[#a4a4a4] max-w-2xl leading-relaxed">
          Welcome to the ClientProofing admin system. Manage albums, sessions, and
          magic links with the refreshed interface designed to mirror the client gallery
          experience.
        </p>
      </div>
    </div>
  );
}
