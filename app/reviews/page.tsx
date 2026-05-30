import { Star, Database } from 'lucide-react'

export const metadata = {
  title: 'Reviews | Plotter',
  description: 'Sección de reseñas de la comunidad (Próximamente)',
}

export default function ReviewsPage() {
  return (
    <div className="min-h-screen pt-24 px-5 pb-32 flex flex-col items-center justify-center text-center animate-fade-in">
      <div 
        className="p-8 rounded-3xl max-w-md w-full flex flex-col items-center gap-5 transition-all duration-300"
        style={{ boxShadow: 'var(--nm-raised-lg)', backgroundColor: 'var(--plotter-card)' }}
      >
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center mb-2"
          style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
        >
          <Database className="w-10 h-10 text-[var(--plotter-orange)]" />
        </div>
        
        <h1 className="font-['Outfit'] font-black text-3xl text-[var(--plotter-white)] tracking-tight">
          Próximamente
        </h1>
        
        <p className="text-[var(--plotter-white)]/85 text-[15px] leading-relaxed font-light px-2">
          Integración con base de datos en desarrollo. Muy pronto podrás ver y explorar las reviews de toda la comunidad en este espacio.
        </p>
        
        <div 
          className="inline-flex items-center gap-2 px-6 py-2.5 mt-4 rounded-full"
          style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
        >
          <Star className="w-4 h-4 text-[var(--plotter-orange)] fill-[var(--plotter-orange)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--plotter-muted)]">
            En Construcción
          </span>
        </div>
      </div>
    </div>
  )
}
