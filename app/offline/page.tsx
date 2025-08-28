export default function OfflinePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-4 text-center">
      <h1 className="text-xl font-semibold">Estás sin conexión</h1>
      <p className="text-gray-600">
        Podés seguir trabajando. Cuando vuelva la conexión se sincronizará el guardado local.
      </p>
    </main>
  );
}
