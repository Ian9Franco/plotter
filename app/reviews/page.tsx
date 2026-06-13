'use client'

import { useState, useEffect } from 'react'
import { Star, LogOut, Database, Lock, Mail, Key, User, PlusCircle, Loader2, ArrowLeft, Trash2, ChevronRight, MessageSquare, Check, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchCommunityReviews, syncLocalReviews, deleteReview, fetchUserProfile, type Review, type Profile } from '@/lib/review/storage'
import { toast } from 'sonner'
import ProfileSettings from '@/components/profile/ProfileSettings'
import { AnimatePresence } from 'framer-motion'
import { getPosterUrl } from '@/lib/tmdb/client'

interface ReviewerGroup {
  name: string
  avatarUrl?: string | null
  reviews: Review[]
  avgRating: number
  isCurrentUser: boolean
}

export default function ReviewsPage() {
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [selectedReviewerName, setSelectedReviewerName] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Restore remembered email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('plotter_remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  // Load user profile details
  const loadUserProfile = async (userId: string) => {
    const data = await fetchUserProfile(userId)
    if (data) {
      setProfile(data)
    }
  }

  // Listen to Auth State changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoadingUser(false)
      if (session?.user) {
        handlePostAuthSync(session.user.id)
        loadUserProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoadingUser(false)
      if (session?.user) {
        handlePostAuthSync(session.user.id)
        loadUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch reviews whenever user signs in or community updates
  useEffect(() => {
    if (user) {
      loadReviews()
    }
  }, [user])

  const loadReviews = async () => {
    setLoadingReviews(true)
    try {
      const data = await fetchCommunityReviews()
      setReviews(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handlePostAuthSync = async (userId: string) => {
    try {
      const syncRes = await syncLocalReviews(userId)
      if (syncRes.success && syncRes.count > 0) {
        toast.success(`¡Sincronizadas ${syncRes.count} reseñas guardadas localmente en tu cuenta!`)
        loadReviews()
      }
    } catch (err) {
      console.error('Error syncing local reviews:', err)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        toast.success('Cuenta creada. Iniciando sesión...')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // Persist email to localStorage if "remember me" is checked
        if (rememberMe) {
          localStorage.setItem('plotter_remembered_email', email)
        } else {
          localStorage.removeItem('plotter_remembered_email')
        }
        toast.success('Sesión iniciada correctamente')
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error al autenticar')
      toast.error(err.message || 'Error al autenticar')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Sesión cerrada')
      setUser(null)
      setProfile(null)
      setShowProfileEdit(false)
      setReviews([])
      setSelectedReviewerName(null)
      // Only clear remembered email if user explicitly unchecked "remember me"
      if (!rememberMe) {
        localStorage.removeItem('plotter_remembered_email')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!reviewId) return

    try {
      const res = await deleteReview(reviewId)
      if (res.success) {
        toast.success('Reseña eliminada correctamente')
        // Update local state
        const updatedReviews = reviews.filter(r => r.id !== reviewId)
        setReviews(updatedReviews)
        
        // If current reviewer has no reviews left, exit detailed view
        const currentGroupReviews = updatedReviews.filter(r => r.reviewer_name === selectedReviewerName)
        if (currentGroupReviews.length === 0) {
          setSelectedReviewerName(null)
        }
      } else {
        toast.error('Error al eliminar la reseña')
      }
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error al intentar eliminar')
    }
  }

  // Group reviews
  const groupedReviewers: ReviewerGroup[] = []
  reviews.forEach(review => {
    const displayName = review.profiles?.display_name || review.reviewer_name || 'Anónimo'
    const avatarUrl = review.profiles?.avatar_url || null

    let group = groupedReviewers.find(g => g.name.toLowerCase() === displayName.toLowerCase())
    if (!group) {
      group = {
        name: displayName,
        avatarUrl: avatarUrl,
        reviews: [],
        avgRating: 0,
        isCurrentUser: false
      }
      groupedReviewers.push(group)
    }
    if (avatarUrl && !group.avatarUrl) {
      group.avatarUrl = avatarUrl
    }
    group.reviews.push(review)
    if (user && review.user_id === user.id) {
      group.isCurrentUser = true
    }
  })

  // Calculate averages
  groupedReviewers.forEach(group => {
    const sum = group.reviews.reduce((acc, r) => acc + r.rating, 0)
    group.avgRating = parseFloat((sum / group.reviews.length).toFixed(2))
  })

  // Sort reviewers: put current user first, then sort by reviews count desc
  groupedReviewers.sort((a, b) => {
    if (a.isCurrentUser && !b.isCurrentUser) return -1
    if (!a.isCurrentUser && b.isCurrentUser) return 1
    return b.reviews.length - a.reviews.length
  })

  const selectedGroup = selectedReviewerName 
    ? groupedReviewers.find(g => g.name.toLowerCase() === selectedReviewerName.toLowerCase())
    : null

  if (loadingUser) {
    return (
      <div className="min-h-screen pt-32 pb-32 flex flex-col items-center justify-center bg-[var(--plotter-black)]">
        <Loader2 className="w-10 h-10 text-[var(--plotter-orange)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 px-5 pb-32 flex flex-col items-center bg-[var(--plotter-black)]">
      
      {!user ? (
        // AUTHENTICATION COMPONENT
        <div 
          className="p-8 rounded-[32px] max-w-md w-full flex flex-col items-center gap-5 transition-all duration-300 animate-fade-in mt-10"
          style={{ boxShadow: 'var(--nm-raised-lg)', backgroundColor: 'var(--plotter-card)' }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-1"
            style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
          >
            <Lock className="w-6 h-6 text-[var(--plotter-orange)]" />
          </div>
          
          <div className="text-center">
            <h1 className="font-['Outfit'] font-black text-2xl text-[var(--plotter-white)] tracking-tight">
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h1>
            <p className="text-[var(--plotter-muted)] text-xs mt-1 px-4">
              Para ver y compartir reseñas en la comunidad, por favor iniciá sesión.
            </p>
          </div>

          <form onSubmit={handleAuth} className="w-full flex flex-col gap-4 mt-2">
            <div 
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
            >
              <Mail className="w-4 h-4 text-[var(--plotter-muted)]" />
              <input 
                type="email"
                required
                placeholder="Tu correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-transparent border-none text-[var(--plotter-white)] placeholder-[var(--plotter-muted)] focus:outline-none text-xs font-semibold"
              />
            </div>

            <div 
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
            >
              <Key className="w-4 h-4 text-[var(--plotter-muted)] flex-shrink-0" />
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-transparent border-none text-[var(--plotter-white)] placeholder-[var(--plotter-muted)] focus:outline-none text-xs font-semibold"
              />
              {/* Toggle password visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="flex-shrink-0 text-[var(--plotter-muted)] hover:text-[var(--plotter-white)] transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>

            {/* Remember me checkbox */}
            {!isSignUp && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none group px-1">
                <div
                  onClick={() => setRememberMe(prev => !prev)}
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
                    rememberMe
                      ? 'bg-[var(--plotter-orange)] border-[var(--plotter-orange)]'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {rememberMe && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs text-[var(--plotter-muted)] group-hover:text-[var(--plotter-white)] transition-colors font-semibold">
                  Recordar mi sesión
                </span>
              </label>
            )}

            {authError && (
              <p className="text-center text-red-400 font-bold text-xs bg-red-950/20 border border-red-500/20 py-2.5 px-4 rounded-xl">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-4 rounded-2xl font-['Outfit'] font-black text-xs text-white uppercase tracking-wider active:scale-95 transition-all mt-2 flex items-center justify-center gap-2"
              style={{ boxShadow: 'var(--nm-glow-orange)', backgroundColor: 'var(--plotter-orange)' }}
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isSignUp ? 'Registrarme' : 'Entrar'
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setAuthError(null)
            }}
            className="text-xs text-[var(--plotter-muted)] hover:text-[var(--plotter-white)] transition-all font-semibold mt-1"
          >
            {isSignUp ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
          </button>
        </div>
      ) : (
        // LOGGED IN: REVIEWS PORTAL
        <div className="max-w-4xl w-full flex flex-col gap-8 mt-4 animate-fade-in">
          
          {/* Header Portal Profile Info */}
          <div 
            className="w-full p-6 rounded-[32px] flex flex-col gap-6"
            style={{ boxShadow: 'var(--nm-raised)', backgroundColor: 'var(--plotter-card)' }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-white/10"
                  style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep)' }}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-[var(--plotter-orange)]" />
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs text-[var(--plotter-muted)] font-semibold">Sesión activa</p>
                  <p className="text-sm font-black text-white font-['Outfit'] truncate max-w-[200px] sm:max-w-xs">
                    {profile?.display_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-[var(--plotter-muted)] font-semibold">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(!showProfileEdit)}
                  className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 border border-white/5 ${
                    showProfileEdit 
                      ? 'text-[var(--plotter-orange)] border-[var(--plotter-orange)]/35' 
                      : 'text-[var(--plotter-muted)] hover:text-white'
                  }`}
                  style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
                >
                  <User className="w-4 h-4" />
                  {showProfileEdit ? 'Ver Autores' : 'Editar Perfil'}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-5 py-3 rounded-2xl text-[var(--plotter-muted)] hover:text-red-400 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 border border-white/5"
                  style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>

            {/* Profile settings component shown inline if toggled */}
            <AnimatePresence>
              {showProfileEdit && (
                <ProfileSettings
                  userId={user.id}
                  email={user.email}
                  onClose={() => setShowProfileEdit(false)}
                  onProfileUpdated={(updatedProfile) => {
                    setProfile(updatedProfile)
                    loadReviews()
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* VIEW: MAIN GROUPED FEED */}
          {!selectedReviewerName ? (
            <>
              {/* Feed Header */}
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-[var(--plotter-white)] font-['Outfit'] tracking-tight">
                  Autores en la Comunidad
                </h2>
                <span className="text-xs text-[var(--plotter-muted)] font-bold bg-[#22c55e]/10 text-[#22c55e] px-2.5 py-1 rounded-full">
                  {groupedReviewers.length} autor{groupedReviewers.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {/* Feed Grid (Grouped by Reviewer) */}
              {loadingReviews ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-[var(--plotter-orange)] animate-spin" />
                </div>
              ) : groupedReviewers.length === 0 ? (
                <div 
                  className="p-12 text-center rounded-[32px] flex flex-col items-center gap-4"
                  style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep)' }}
                >
                  <Database className="w-12 h-12 text-[var(--plotter-muted)]" />
                  <p className="text-sm text-[var(--plotter-muted)] font-medium">Aún no hay reseñas en la comunidad.</p>
                  <p className="text-xs text-[var(--plotter-muted)]/70">¡Andá al detalle de cualquier película o serie para crear una!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedReviewers.map((group) => (
                    <div 
                      key={group.name}
                      onClick={() => setSelectedReviewerName(group.name)}
                      className="p-6 rounded-[28px] flex justify-between items-center relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[var(--plotter-orange)]/30 border border-white/5 cursor-pointer active:scale-98"
                      style={{ boxShadow: 'var(--nm-raised)', backgroundColor: 'var(--plotter-card)' }}
                    >
                      <div className="flex gap-4 items-center min-w-0">
                        <div 
                          className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-white/10"
                          style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep)' }}
                        >
                          {group.avatarUrl ? (
                            <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className={`w-4 h-4 ${group.isCurrentUser ? 'text-[var(--plotter-orange)]' : 'text-[var(--plotter-muted)]'}`} />
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <h3 className="font-['Outfit'] font-black text-white text-base leading-tight flex items-center gap-2 truncate">
                            {group.name}
                            {group.isCurrentUser && (
                              <span className="text-[9px] font-bold tracking-wider uppercase bg-[var(--plotter-orange)]/15 text-[var(--plotter-orange)] px-2 py-0.5 rounded-full border border-[var(--plotter-orange)]/25">
                                Tú
                              </span>
                            )}
                          </h3>
                          
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--plotter-muted)] font-bold">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {group.reviews.length} reseña{group.reviews.length !== 1 ? 's' : ''}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <span className="flex items-center gap-1 text-[#22c55e]">
                              <Star className="w-3.5 h-3.5 fill-[#22c55e]" />
                              {group.avgRating} prom.
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-[var(--plotter-muted)] transition-all ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // VIEW: DETAILED REVIEWER USER FEED
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Back Bar Header */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedReviewerName(null)}
                  className="px-4 py-2.5 rounded-2xl text-[var(--plotter-muted)] hover:text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 border border-white/5"
                  style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a Autores
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--plotter-muted)] font-black">Viendo perfil de</span>
                  <span className="text-xs font-black text-white font-['Outfit'] bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    {selectedGroup?.name}
                  </span>
                </div>
              </div>

              {/* Selected Reviewer Stats Bar */}
              <div 
                className="p-5 rounded-[28px] flex flex-col sm:flex-row gap-4 items-center justify-between"
                style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep)' }}
              >
                <div className="text-center sm:text-left">
                  <h3 className="font-['Outfit'] font-black text-lg text-white">
                    Reseñas escritas por {selectedGroup?.name}
                  </h3>
                  <p className="text-xs text-[var(--plotter-muted)] mt-0.5">
                    Total de {selectedGroup?.reviews.length} opiniones compartidas
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                    <span className="text-[9px] font-bold text-[var(--plotter-muted)] uppercase tracking-wider">Promedio</span>
                    <span className="text-sm font-black text-[#22c55e] flex items-center gap-1 font-['Outfit']">
                      <Star className="w-3.5 h-3.5 fill-[#22c55e]" />
                      {selectedGroup?.avgRating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedGroup?.reviews.map((review) => {
                  const rating = review.rating
                  const isOwner = user && review.user_id === user.id
                  return (
                    <div 
                      key={review.id}
                      className="p-6 rounded-[28px] flex flex-col gap-4 relative overflow-hidden transition-all duration-300 border border-white/5"
                      style={{ boxShadow: 'var(--nm-raised)', backgroundColor: 'var(--plotter-card)' }}
                    >
                      {/* Header */}
                      <div className="flex gap-4 items-start">
                        {review.poster_path ? (
                          <img 
                            src={getPosterUrl(review.poster_path, 'w185')}
                            alt={review.title}
                            className="w-12 h-18 object-cover rounded-xl shadow-md flex-shrink-0 animate-fade-in"
                          />
                        ) : (
                          <div 
                            className="w-12 h-18 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep)' }}
                          >
                            <span className="text-[10px] text-[var(--plotter-muted)]">N/A</span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-['Outfit'] font-black text-white text-base leading-tight truncate">
                            {review.title}
                          </h3>
                          <p className="text-xs text-[var(--plotter-muted)] font-semibold mt-0.5">
                            {review.year}
                          </p>
                          
                          {/* Rating Stars */}
                          <div className="flex gap-1.5 mt-2 items-center">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, idx) => {
                                const fillPercentage = Math.max(0, Math.min(100, (rating - idx) * 100))
                                return (
                                  <div key={idx} className="relative text-xs text-white/10 select-none">
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
                            <span className="font-['Outfit'] font-black text-[10px] text-[#22c55e] px-1 py-0.5 rounded bg-[#22c55e]/10 select-none">
                              {rating % 0.5 === 0 ? rating.toFixed(1) : rating.toString()}
                            </span>
                          </div>
                        </div>

                        {/* Delete Trigger */}
                        {isOwner && review.id && (
                          <button
                            type="button"
                            onClick={() => {
                              if (deletingId === review.id) {
                                handleDeleteReview(review.id!)
                                setDeletingId(null)
                              } else {
                                setDeletingId(review.id!)
                                // Reset after 4 seconds if they don't confirm
                                setTimeout(() => {
                                  setDeletingId(current => current === review.id ? null : current)
                                }, 4000)
                              }
                            }}
                            className={`p-2 rounded-xl transition-all active:scale-90 ${
                              deletingId === review.id 
                                ? 'text-green-400 hover:text-green-300 bg-green-500/10' 
                                : 'text-[var(--plotter-muted)] hover:text-red-400 hover:bg-red-500/5'
                            }`}
                            style={{ 
                              boxShadow: 'var(--nm-inset)', 
                              backgroundColor: deletingId === review.id ? 'transparent' : 'var(--plotter-deep)' 
                            }}
                            title={deletingId === review.id ? "Confirmar eliminación" : "Eliminar Reseña"}
                          >
                            {deletingId === review.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="w-full h-px bg-white/5" />

                      {/* Body */}
                      <div className="flex-1">
                        <p className="text-xs text-[var(--plotter-white)]/90 leading-relaxed italic line-clamp-5">
                          "{review.review_text}"
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-[var(--plotter-muted)] font-bold flex items-center gap-1.5">
                          {review.profiles?.avatar_url && (
                            <img src={review.profiles.avatar_url} alt={review.profiles.display_name || review.reviewer_name} className="w-4.5 h-4.5 rounded-full object-cover border border-white/10" />
                          )}
                          Por: {review.profiles?.display_name || review.reviewer_name}
                        </span>
                        <span className="text-[9px] text-[var(--plotter-muted)]/75">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}
      
    </div>
  )
}
