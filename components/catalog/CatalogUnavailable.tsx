export default function CatalogUnavailable({ label }: { label: string }) {
  return (
    <div className="min-h-full bg-[var(--plotter-black)] flex items-center justify-center px-6 py-32">
      <p className="text-[var(--plotter-muted)] text-center max-w-md">
        No se pudo cargar {label}. El catálogo no está vacío: TMDb no respondió. Probá de nuevo en un rato.
      </p>
    </div>
  )
}
