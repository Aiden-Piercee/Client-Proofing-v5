export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Overview</p>
        <h1 className="text-3xl font-semibold text-white mb-3">Admin Dashboard</h1>
        <p className="text-neutral-300 max-w-2xl">
          Welcome to the ClientProofing admin system. Manage albums, sessions, and
          magic links with the refreshed interface designed to mirror the client gallery
          experience.
        </p>
      </div>
    </div>
  );
}
