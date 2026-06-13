'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear } from '@/lib/tmdb/types'
import { generateReviewCanvas, type ReviewFormat } from '@/lib/review/canvas'
import type { MovieDetails, TVDetails } from '@/lib/tmdb/types'
import { Download, Check, Loader2, Layers, Palette, Image as ImageIcon, Trash2, Type, Eye, X } from 'lucide-react'
import { saveReview } from '@/lib/review/storage'
import { toast } from 'sonner'

interface ReviewEditorProps {
  item: MovieDetails | TVDetails
}

const FORMATS: { id: ReviewFormat; label: string; hint: string }[] = [
  { id: '1:1',  label: '1:1 Square',     hint: 'Feed cuadrado clásico'      },
  { id: '4:5',  label: '4:5 Vertical',   hint: 'Recomendado para Feed IG'   },
  { id: '9:16', label: '9:16 Full story', hint: 'Historia de pantalla completa' },
]

const TEXTURES = [
  { id: 'cruces', label: 'Cruces'   },
  { id: 'grano',  label: 'Grano'    },
  { id: 'lineas', label: 'Líneas'   },
  { id: 'solido', label: 'Liso'     },
] as const

const CARD_COLORS = [
  { id: 'slate',  label: 'Slate',  bg: 'from-[#4a5577] to-[#3a4260]', border: 'border-t-white/30 border-l-white/25 border-r-white/10 border-b-white/5', dot: 'bg-[#4a5577]' },
  { id: 'carbon', label: 'Carbon', bg: 'from-[#252a37] to-[#141822]', border: 'border-t-white/20 border-l-white/15 border-r-white/5 border-b-white/5', dot: 'bg-[#252a37]' },
  { id: 'sunset', label: 'Sunset', bg: 'from-[#e6511b] to-[#802604]', border: 'border-t-white/35 border-l-white/30 border-r-white/10 border-b-white/5', dot: 'bg-[#e6511b]' },
  { id: 'forest', label: 'Forest', bg: 'from-[#224835] to-[#122a1d]', border: 'border-t-white/25 border-l-white/20 border-r-white/10 border-b-white/5', dot: 'bg-[#224835]' },
  { id: 'wine',   label: 'Wine',   bg: 'from-[#592947] to-[#2f1324]', border: 'border-t-white/30 border-l-white/25 border-r-white/10 border-b-white/5', dot: 'bg-[#592947]' },
] as const

const FONTS = [
  { id: 'inter',  label: 'Moderna (Inter)',   class: "font-['Inter']" },
  { id: 'serif',  label: 'Editorial (Serif)', class: "font-serif" },
  { id: 'mono',   label: 'Monospace (Guión)', class: "font-mono" },
  { id: 'outfit', label: 'Geométrica (Outfit)', class: "font-['Outfit']" },
] as const

import { useLanguage } from '@/hooks/useLanguage'

export default function ReviewEditor({ item }: ReviewEditorProps) {
  const { useOriginal } = useLanguage()
  const title = getTitle(item, useOriginal)
  const year  = getReleaseYear(item)

  const [rating,       setRating]       = useState(0)
  const [hoveredStar,  setHoveredStar]  = useState<number | null>(null)
  const [reviewText,   setReviewText]   = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [format,       setFormat]       = useState<ReviewFormat>('9:16')
  const [texture,      setTexture]      = useState<'cruces' | 'grano' | 'lineas' | 'solido' | 'custom'>('cruces')
  const [customBg,     setCustomBg]     = useState<string | null>(null)
  const [cardColor,    setCardColor]    = useState<'slate' | 'carbon' | 'sunset' | 'forest' | 'wine'>('slate')
  const [descFont,     setDescFont]     = useState<'inter' | 'serif' | 'mono' | 'outfit'>('inter')
  
  const [downloading,  setDownloading]  = useState(false)
  const [generatedImg, setGeneratedImg] = useState<string | null>(null) // holds result base64 to show in modal
  const [isModalOpen,  setIsModalOpen]  = useState(false)
  const [isMounted,    setIsMounted]    = useState(false)
  const [isSaved,      setIsSaved]      = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false) // Mobile Sidebar Drawer state

  const starsContainerRef = useRef<HTMLDivElement>(null)

  const handleStarGesture = (clientX: number) => {
    if (!starsContainerRef.current) return
    const rect = starsContainerRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width))
    const rawRating = percentage * 5
    const snapped = Math.round(rawRating * 4) / 4
    setRating(snapped)
    setIsSaved(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleStarGesture(e.touches[0].clientX)
    }
  }

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomBg(event.target.result as string)
        setTexture('custom')
      }
    }
    reader.readAsDataURL(file)
  }

  const removeCustomBg = () => {
    setCustomBg(null)
    setTexture('cruces')
  }

  const [errorMsg,     setErrorMsg]     = useState<string | null>(null)
  const [publishing,   setPublishing]   = useState(false)

  const handlePublishOnly = async () => {
    if (publishing || rating === 0) return
    if (isSaved) {
      toast.success('Esta reseña ya fue guardada/publicada.')
      return
    }
    setPublishing(true)
    setErrorMsg(null)
    try {
      // Save review to Supabase or LocalStorage
      const saveRes = await saveReview({
        reviewer_name: reviewerName.trim() || 'Anónimo',
        title,
        year: year ? year.toString() : '',
        rating,
        review_text: reviewText.trim(),
        description: item.overview || '',
        poster_path: item.poster_path || null
      })

      if (saveRes.success) {
        setIsSaved(true)
        if (saveRes.storage === 'cloud') {
          toast.success('Reseña compartida con la comunidad')
        } else {
          toast.success('Reseña guardada localmente (iniciá sesión en "Reviews" para subirla)')
        }
      } else {
        throw new Error('No se pudo guardar la reseña')
      }
    } catch (err) {
      console.error('Error publishing review:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(`Error al publicar: ${msg}`)
    } finally {
      setPublishing(false)
    }
  }

  const handleGenerate = async () => {
    if (downloading || rating === 0) return
    setDownloading(true)
    setErrorMsg(null)
    try {
      // Generate Canvas in memory
      const canvas = await generateReviewCanvas({
        title,
        year,
        rating,
        reviewText: reviewText.trim(),
        reviewerName: reviewerName.trim() || 'Anónimo',
        posterPath: item.poster_path,
        bgTexture: texture,
        customBgDataUrl: customBg,
        cardColor: cardColor,
        descFont: descFont,
      }, format)
      
      const base64 = canvas.toDataURL('image/png', 1.0)
      setGeneratedImg(base64)
      setIsModalOpen(true)

      // Skip save review if already saved
      if (!isSaved) {
        const saveRes = await saveReview({
          reviewer_name: reviewerName.trim() || 'Anónimo',
          title,
          year: year ? year.toString() : '',
          rating,
          review_text: reviewText.trim(),
          description: item.overview || '',
          poster_path: item.poster_path || null
        })

        if (saveRes.success) {
          setIsSaved(true)
          if (saveRes.storage === 'cloud') {
            toast.success('Reseña compartida con la comunidad')
          } else {
            toast.success('Reseña guardada localmente (iniciá sesión en "Reviews" para subirla)')
          }
        }
      }
    } catch (err) {
      console.error('Error generating image:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(`Error: ${msg}`)
    } finally {
      setDownloading(false)
    }
  }

  const forceDownload = () => {
    if (!generatedImg) return
    const a = document.createElement('a')
    a.href = generatedImg
    a.download = `plotter-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const activeColorTheme = CARD_COLORS.find(c => c.id === cardColor) || CARD_COLORS[0]
  const activeFontTheme = FONTS.find(f => f.id === descFont) || FONTS[0]

  // Render the core card preview element
  const renderLivePreviewCard = (scaleClass: string = '') => (
    <div className={`w-full max-w-[340px] aspect-[9/16] rounded-3xl relative overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between p-6 select-none bg-[#0e1015] ${scaleClass}`}>
      {texture === 'custom' && customBg ? (
        <img 
          src={customBg} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-[#0f1118]" />
      )}
      
      {texture === 'cruces' && (
        <div 
          className="absolute inset-0 z-[1] opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
            backgroundSize: '32px 32px'
          }}
        />
      )}
      {texture === 'grano' && (
        <div 
          className="absolute inset-0 z-[1] opacity-[0.16]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
          }}
        />
      )}
      {texture === 'lineas' && (
        <div 
          className="absolute inset-0 z-[1] opacity-[0.14]"
          style={{
            backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px)',
            backgroundSize: '6px 100%'
          }}
        />
      )}
      
      {/* Ambient Radial Vignette */}
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_30%,rgba(0,0,0,0.9)_100%)]" />

      {/* Central Card container with extreme 3D shadow and glowing borders */}
      <div 
        className={`w-full h-auto rounded-[32px] mt-14 mb-4 p-5 pb-6 flex flex-col items-center justify-center relative z-10 shadow-[0_25px_65px_-12px_rgba(0,0,0,0.95)] bg-gradient-to-b ${activeColorTheme.bg} border-2 ${activeColorTheme.border}`}
        style={{
          minHeight: !reviewText.trim() ? '35%' : reviewText.trim().length < 80 ? '40%' : '45%'
        }}
      >
        
        {/* Central Floating Poster with strong 3D elevation */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[114px] h-[171px] rounded-2xl overflow-hidden shadow-[0_18px_36px_rgba(0,0,0,0.9)] border-2 border-white/20 bg-gray-900 shrink-0">
          {item.poster_path ? (
            <img
              src={getPosterUrl(item.poster_path, 'w342')}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-950 text-white/30 text-[10px]">
              Sin Imagen
            </div>
          )}
        </div>

        {/* Card Contents */}
        <div className="w-full flex flex-col items-center mt-32 text-center flex-1">
          {/* Title and year */}
          <h3 className="font-['Outfit'] font-extrabold text-white text-base leading-tight w-full line-clamp-2 px-1">
            {title} <span className="font-normal text-white/70 text-sm">, {year}</span>
          </h3>

          {/* Decimal-Rendered HTML Stars & Equivalent Number */}
          <div className="flex gap-2 mt-3.5 justify-center items-center">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100))
                return (
                  <div key={i} className="relative text-lg text-white/10 select-none">
                    ★
                    <div 
                      className="absolute inset-0 text-[#22c55e] overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                    >
                      ★
                    </div>
                  </div>
                )
              })}
            </div>
            <span className="font-['Outfit'] font-black text-xs text-[#22c55e] px-1.5 py-0.5 rounded bg-[#22c55e]/10 select-none">
              {rating % 0.5 === 0 ? rating.toFixed(1) : rating.toString()}
            </span>
          </div>

          {reviewText.trim() && (
            <>
              <div className="w-[85%] h-[2px] bg-white/20 my-4 shrink-0 shadow-sm" />
              {/* Review Text — uses currently selected font families */}
              <p className={`w-full text-white/90 leading-relaxed px-1 mb-5 italic break-all whitespace-pre-wrap ${activeFontTheme.class} ${
                reviewText.length > 500 ? 'text-[8px]' : 
                reviewText.length > 300 ? 'text-[9.5px]' : 
                reviewText.length > 150 ? 'text-[10.5px]' : 
                reviewText.length > 80 ? 'text-[11.5px]' : 'text-[13px]'
              }`}>
                {reviewText.trim()}
              </p>
            </>
          )}
        </div>

        {/* Reviewer signature */}
        <div className="w-full text-center pb-1 text-[10.5px] text-white/55 tracking-wider">
          Review by <span className="font-extrabold text-white">{reviewerName.trim() || 'Anónimo'}</span>
        </div>
      </div>

      {/* Plotter branding signature */}
      <div className="text-center font-['Outfit'] font-black text-[9px] tracking-widest text-white/20 relative z-10">
        plotter.
      </div>
    </div>
  )

  return (
    <>
      {isMounted && createPortal(
        <>
          {/* MOBILE FULL-SCREEN SIDEBAR DRAWER (SLIDE-DOWN / SWIPE-UP TO SAVE) */}
          <AnimatePresence>
            {isPreviewOpen && (
              <div className="fixed inset-0 z-[100] lg:hidden flex flex-col justify-start">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                  onClick={() => setIsPreviewOpen(false)}
                />
                
                {/* Slide-down container */}
                <motion.div
                  drag="y"
                  dragConstraints={{ top: -400, bottom: 0 }}
                  dragElastic={{ top: 0.1, bottom: 0.2 }}
                  onDragEnd={(e, info) => {
                    // Close if swiped up
                    if (info.offset.y < -85 || info.velocity.y < -250) {
                      setIsPreviewOpen(false)
                    }
                  }}
                  initial={{ y: '-100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="w-full bg-[#070b12]/98 border-b border-white/10 p-5 rounded-b-[32px] flex flex-col items-center justify-between z-10 shadow-2xl touch-none"
                  style={{ maxHeight: '82vh' }}
                >
                  {/* Drag Handle Indicator */}
                  <div className="w-12 h-1 bg-white/20 rounded-full mb-3 shrink-0" />

                  <div className="w-full flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0">
                    <span className="font-['Outfit'] font-black text-white text-xs tracking-wider uppercase">Vista Previa</span>
                    <span className="text-[10px] text-[var(--plotter-muted)] font-medium">Desliza hacia arriba para guardar</span>
                    <button 
                      type="button" 
                      onClick={() => setIsPreviewOpen(false)}
                      className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center w-full overflow-hidden py-4">
                    {renderLivePreviewCard('scale-[0.8] origin-center')}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="w-full py-3 bg-[var(--plotter-orange)] hover:bg-[#d84e1b] text-white font-black rounded-xl text-xs border border-white/10 shrink-0 transition-all mt-2 active:scale-98"
                  >
                    Guardar y continuar escribiendo
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* GUARANTEED DOWNLOAD & SAVE DIALOG (MODAL OVERLAY) */}
          {isModalOpen && generatedImg && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {/* Backdrop blur close action */}
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
              
              <div
                className="relative w-full max-w-[400px] rounded-3xl p-6 text-center z-10 flex flex-col items-center"
                style={{ boxShadow: 'var(--nm-raised-lg)', backgroundColor: 'var(--plotter-card)' }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--plotter-muted)] hover:text-white transition-all active:scale-90"
                  style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
                >
                  <X className="w-4.5 h-4.5" />
                </button>

                <h3 className="font-['Outfit'] font-extrabold text-[var(--plotter-white)] text-lg mb-2">¡Imagen lista!</h3>
                
                {/* Preview image */}
                <div
                  className="w-full max-h-[360px] aspect-[9/16] overflow-y-auto rounded-2xl my-4 relative flex justify-center items-center p-1"
                  style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
                >
                  <img
                    src={generatedImg!}
                    alt="Plotter Review"
                    className="max-w-full max-h-full object-contain rounded-xl select-all touch-auto cursor-pointer"
                  />
                </div>

                {/* Instructions */}
                <div
                  className="p-4 w-full mb-5 text-left text-xs space-y-2 rounded-2xl"
                  style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
                >
                  <p className="text-[var(--plotter-white)] font-bold flex items-center gap-1.5">📱 Para celulares (iPhone/Android):</p>
                  <p className="text-[var(--plotter-muted)] leading-relaxed pl-5">
                    Mantén presionada la imagen y selecciona <strong className="text-[var(--plotter-white)]">"Guardar imagen"</strong>.
                  </p>
                  <div className="w-full h-px" style={{ backgroundColor: 'var(--plotter-border)' }} />
                  <p className="text-[var(--plotter-white)] font-bold flex items-center gap-1.5">💻 Para computadoras:</p>
                  <p className="text-[var(--plotter-muted)] leading-relaxed pl-5">
                    Usa el botón de descarga abajo.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full shrink-0">
                  <button
                    type="button"
                    onClick={forceDownload}
                    className="flex-1 py-3.5 text-white font-['Outfit'] font-black rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{ boxShadow: 'var(--nm-glow-orange)', backgroundColor: 'var(--plotter-orange)' }}
                  >
                    <Download className="w-4 h-4" />
                    Descargar Directo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-3.5 px-5 text-[var(--plotter-white)] font-bold rounded-2xl text-xs active:scale-95 transition-all"
                    style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
                  >
                    Listo
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      <div className="px-4 mt-6 pb-20 relative animate-fade-up delay-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* DESKTOP PERMANENT PREVIEW COLUMN */}
          <div className="hidden lg:col-span-5 lg:flex flex-col items-center sticky top-24">
            <p className="text-[var(--plotter-muted)] text-[11px] mb-3 uppercase tracking-widest font-bold self-start pl-1">
              Previsualización en tiempo real
            </p>
            {renderLivePreviewCard()}
          </div>

          {/* CONTROLS FORM */}
          <div
            className="lg:col-span-7 rounded-3xl p-5 lg:p-6 space-y-6"
            style={{ boxShadow: 'var(--nm-raised-lg)', backgroundColor: 'var(--plotter-card)' }}
          >
            
            <div className="flex items-center justify-between pb-3 border-b border-[var(--plotter-border)]">
              <div className="nm-section-title mb-0">
                <h2 className="font-['Outfit'] font-extrabold text-[var(--plotter-white)] text-lg">
                  Personaliza tu Review
                </h2>
              </div>
              
              <div
                className="text-white font-['Outfit'] font-black px-4 py-1.5 rounded-full text-xs"
                style={{ backgroundColor: 'var(--plotter-orange)', boxShadow: 'var(--nm-glow-orange)' }}
              >
                {rating.toFixed(2)} / 5.00
              </div>
            </div>

            {/* Form inputs */}
            <div className="space-y-4">
              
              {/* Rating Stars */}
              <div>
                <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block mb-1.5">
                  Calificación (Arrastra o haz tap con precisión decimal 4.5, 4.25...)
                </label>
                
                <div
                  ref={starsContainerRef}
                  className="w-full max-w-[280px] h-12 rounded-2xl flex items-center justify-between px-4 cursor-pointer select-none touch-none transition-all active:scale-[0.99]"
                  style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
                  onMouseDown={(e) => handleStarGesture(e.clientX)}
                  onMouseMove={(e) => e.buttons === 1 && handleStarGesture(e.clientX)}
                  onTouchMove={handleTouchMove}
                  onTouchStart={(e) => handleStarGesture(e.touches[0].clientX)}
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100))
                    return (
                      <div key={i} className="relative text-2xl text-[var(--plotter-muted)]/20 select-none">
                        ★
                        <div 
                          className="absolute inset-0 text-[#22c55e] overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                        >
                          ★
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Review text */}
              <div>
                <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block mb-2">
                  Opinión / Reseña (opcional)
                </label>
                <textarea
                  id="review-text-input"
                  value={reviewText}
                  onChange={e => { setReviewText(e.target.value.slice(0, 300)); setIsSaved(false); }}
                  placeholder={`¿Qué te pareció "${title}"?`}
                  rows={3}
                  className="w-full rounded-2xl px-4 py-3 text-[var(--plotter-white)] text-sm placeholder:text-[var(--plotter-subtle)] resize-none outline-none transition-all"
                  style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
                />
                <div className="flex justify-between text-[10px] text-[var(--plotter-subtle)] mt-1">
                  <span>Ajuste automático en palabras largas</span>
                  <span>{reviewText.length}/300</span>
                </div>
              </div>

              {/* Select Font for Description */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Type className="w-3.5 h-3.5 text-[var(--plotter-orange)]" />
                  <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block">
                    Tipografía del texto de tu opinión
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FONTS.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDescFont(f.id)}
                      className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                      style={descFont === f.id ? {
                        boxShadow: 'var(--nm-glow-orange)',
                        backgroundColor: 'var(--plotter-orange)',
                        color: 'white',
                      } : {
                        boxShadow: 'var(--nm-pill)',
                        backgroundColor: 'var(--plotter-card)',
                        color: 'var(--plotter-muted)',
                      }}
                    >
                      <span className={`inline-block mr-1.5 ${f.class}`}>Aa</span>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block mb-2">
                  Tu nombre
                </label>
                <input
                  id="reviewer-name-input"
                  value={reviewerName}
                  onChange={e => { setReviewerName(e.target.value); setIsSaved(false); }}
                  placeholder="Ej: Martín"
                  maxLength={20}
                  className="w-full rounded-2xl px-4 py-2.5 text-[var(--plotter-white)] text-sm placeholder:text-[var(--plotter-subtle)] outline-none transition-all"
                  style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
                />
              </div>
            </div>

            <div className="w-full h-[1px] bg-[var(--plotter-border)]" />

            {/* Style Controls */}
            <div className="space-y-4">
              
              {/* Custom Background Upload */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--plotter-orange)]" />
                  <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block">
                    Fondo de la Imagen (Usa tu propia Galería)
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-[var(--plotter-card)] hover:bg-[var(--plotter-card-hover)] text-[var(--plotter-white)] rounded-xl text-xs font-bold border border-[var(--plotter-border)] cursor-pointer transition-all">
                    <ImageIcon className="w-4 h-4" />
                    Elegir foto de galería
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomBgUpload}
                      className="hidden"
                    />
                  </label>
                  
                  {customBg && (
                    <button
                      type="button"
                      onClick={removeCustomBg}
                      className="flex items-center gap-1 px-3 py-2.5 bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-900/60 rounded-xl text-xs font-bold transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Quitar fondo
                    </button>
                  )}
                </div>
              </div>

              {/* Card Colors */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Palette className="w-3.5 h-3.5 text-[var(--plotter-orange)]" />
                  <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block">
                    Fondo de la tarjeta central
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CARD_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCardColor(c.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                      style={cardColor === c.id ? {
                        boxShadow: 'var(--nm-glow-orange)',
                        backgroundColor: 'var(--plotter-orange)',
                        color: 'white',
                      } : {
                        boxShadow: 'var(--nm-pill)',
                        backgroundColor: 'var(--plotter-card)',
                        color: 'var(--plotter-muted)',
                      }}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.dot} ring-1 ring-white/10`} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textures */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--plotter-orange)]" />
                  <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block">
                    Texturas Alternativas
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEXTURES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTexture(t.id)}
                      disabled={texture === 'custom'}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${texture === 'custom' ? 'opacity-40 cursor-not-allowed' : ''}`}
                      style={texture === t.id ? {
                        boxShadow: 'var(--nm-inset)',
                        backgroundColor: 'var(--plotter-deep, var(--plotter-black))',
                        color: 'var(--plotter-orange)',
                      } : {
                        boxShadow: 'var(--nm-pill)',
                        backgroundColor: 'var(--plotter-card)',
                        color: 'var(--plotter-muted)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Formats */}
              <div>
                <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block mb-2">
                  Formato / Resolución de la imagen (Instagram / Redes)
                </label>
                <div className="flex gap-2">
                  {FORMATS.map(f => (
                    <button
                      key={f.id}
                      id={`format-${f.id.replace(':','x')}`}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                      style={format === f.id ? {
                        boxShadow: 'var(--nm-glow-orange)',
                        backgroundColor: 'var(--plotter-orange)',
                        color: 'white',
                      } : {
                        boxShadow: 'var(--nm-pill)',
                        backgroundColor: 'var(--plotter-card)',
                        color: 'var(--plotter-muted)',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-[var(--plotter-subtle)] text-[10px] mt-1.5 text-center">
                  {FORMATS.find(f => f.id === format)?.hint}
                </p>
              </div>
            </div>

            {/* Mobile Preview Button above Download on mobile */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="lg:hidden w-full py-3.5 mb-3 text-[var(--plotter-white)] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
            >
              <Eye className="w-4 h-4 text-[var(--plotter-orange)]" />
              ver vista previa
            </button>

            {/* Action Trigger Buttons */}
            <div className="flex flex-col gap-3">
              <button
                id="download-review-btn"
                type="button"
                onClick={handleGenerate}
                disabled={downloading || rating === 0}
                className={`w-full py-4 rounded-2xl font-['Outfit'] font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 text-white ${
                  rating === 0 ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
                }`}
                style={rating === 0 ? {
                  boxShadow: 'var(--nm-inset)',
                  backgroundColor: 'var(--plotter-deep, var(--plotter-black))',
                  color: 'var(--plotter-muted)',
                } : {
                  boxShadow: 'var(--nm-glow-orange)',
                  backgroundColor: 'var(--plotter-orange)',
                }}
              >
                {downloading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Generando...</>
                ) : (
                  <><Download className="w-4 h-4" />descargar review</>
                )}
              </button>

              <button
                type="button"
                onClick={handlePublishOnly}
                disabled={publishing || rating === 0}
                className={`w-full py-3.5 rounded-2xl font-['Outfit'] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 border border-white/5 text-[var(--plotter-white)] hover:text-[var(--plotter-orange)] ${
                  rating === 0 ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
                }`}
                style={{
                  boxShadow: 'var(--nm-pill)',
                  backgroundColor: 'var(--plotter-card)',
                }}
              >
                {publishing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</>
                ) : (
                  <>publicar reseña</>
                )}
              </button>
            </div>

            {errorMsg && (
              <p className="text-center text-red-400 font-bold text-xs bg-red-950/20 border border-red-500/20 py-2.5 px-4 rounded-xl animate-shake mt-2">
                {errorMsg}
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
