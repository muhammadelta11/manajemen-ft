export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-4 p-1">
      <div className="h-8 w-40 rounded-lg bg-black/5" />
      <div className="h-32 rounded-2xl bg-black/5" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-black/5" />
        <div className="h-24 rounded-2xl bg-black/5" />
      </div>
    </div>
  );
}
