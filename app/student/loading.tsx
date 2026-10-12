export default function StudentDashboardLoading() {
  return (
    <main aria-label="Loading student dashboard" className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
      <div className="mx-auto max-w-[1440px] animate-pulse space-y-6">
        <div className="h-40 rounded-xl border border-[#DCE3EC] bg-white" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-xl border border-[#DCE3EC] bg-white" />)}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
          <div className="h-80 rounded-xl border border-[#DCE3EC] bg-white" />
          <div className="h-80 rounded-xl border border-[#DCE3EC] bg-white" />
        </div>
      </div>
    </main>
  );
}
