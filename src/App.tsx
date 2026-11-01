export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-950 text-2xl font-black text-lime">
        S
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Spendly</h1>
        <p className="mt-2 max-w-sm text-sm text-ink/60">
          Seu plano semanal de gastos está sendo preparado.
        </p>
      </div>
    </main>
  );
}
