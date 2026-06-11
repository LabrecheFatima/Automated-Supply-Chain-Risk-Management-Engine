export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          LogiShield AI
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Automated Supply Chain Risk Management Engine
        </p>
        <div className="mt-6 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
          Day 1 Stack Initialized
        </div>
      </div>
    </main>
  );
}