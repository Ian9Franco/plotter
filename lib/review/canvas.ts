// lib/review/canvas.ts — Canvas generator with custom background, decimal rating, and selectable description font

export interface ReviewData {
  title: string
  year: string
  rating: number       // 0–5, accepts decimals (e.g. 4.25, 4.5, 4.75)
  reviewText: string
  reviewerName: string
  posterPath: string | null  // TMDB path e.g. "/abc123.jpg"
  bgTexture?: 'cruces' | 'grano' | 'lineas' | 'solido' | 'custom'
  customBgDataUrl?: string | null  // Uploaded image base64
  cardColor?: 'slate' | 'carbon' | 'sunset' | 'forest' | 'wine'
  descFont?: 'inter' | 'serif' | 'mono' | 'outfit'
}

export type ReviewFormat = '1:1' | '4:5' | '9:16'

interface Dims { w: number; h: number }

const DIMS: Record<ReviewFormat, Dims> = {
  '1:1':  { w: 1080, h: 1080 },
  '4:5':  { w: 1080, h: 1350 },
  '9:16': { w: 1080, h: 1920 }, // Instagram full story
}

// Color schemes for central card
export const CARD_THEMES = {
  slate:  { start: '#4a5577', end: '#3a4260', shadow: '#10141e' },
  carbon: { start: '#252a37', end: '#141822', shadow: '#06080d' },
  sunset: { start: '#e6511b', end: '#802604', shadow: '#3a1002' },
  forest: { start: '#224835', end: '#122a1d', shadow: '#07100b' },
  wine:   { start: '#592947', end: '#2f1324', shadow: '#14070f' },
}

const FONT_MAP = {
  inter:  "'Inter', sans-serif",
  serif:  "Georgia, 'Playfair Display', serif",
  mono:   "'Courier New', monospace",
  outfit: "'Outfit', sans-serif",
}

// ── Image loader helper ──────────────────────────────────────────
export async function loadRawImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ── Image loading via proxy (solves CORS) ────────────────────
export async function loadProxiedImage(tmdbPath: string | null): Promise<HTMLImageElement | null> {
  if (!tmdbPath) return null
  const tmdbUrl = `https://image.tmdb.org/t/p/w500${tmdbPath}`
  const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(tmdbUrl)}`
  return loadRawImage(proxyUrl)
}

// ── Text wrapping with smart split for long words ───────────────
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  maxWidth: number,
  lineHeight: number,
  startY: number,
): number {
  const words = text.split(' ')
  let line = ''
  let y = startY

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (ctx.measureText(word).width > maxWidth) {
      if (line) {
        ctx.fillText(line, cx, y)
        y += lineHeight
        line = ''
      }
      let subWord = ''
      for (let j = 0; j < word.length; j++) {
        const char = word[j]
        const testSub = subWord + char
        if (ctx.measureText(testSub).width > maxWidth) {
          ctx.fillText(subWord, cx, y)
          y += lineHeight
          subWord = char
        } else {
          subWord = testSub
        }
      }
      line = subWord
    } else {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, cx, y)
        line = word
        y += lineHeight
      } else {
        line = test
      }
    }
  }
  
  if (line) {
    ctx.fillText(line, cx, y)
    y += lineHeight
  }
  return y
}

// ── Measure wrapped text height helper ────────────────────────────
function measureWrappedTextHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ')
  let line = ''
  let linesCount = 0

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (ctx.measureText(word).width > maxWidth) {
      if (line) {
        linesCount++
        line = ''
      }
      let subWord = ''
      for (let j = 0; j < word.length; j++) {
        const char = word[j]
        const testSub = subWord + char
        if (ctx.measureText(testSub).width > maxWidth) {
          linesCount++
          subWord = char
        } else {
          subWord = testSub
        }
      }
      line = subWord
    } else {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth && line) {
        linesCount++
        line = word
      } else {
        line = test
      }
    }
  }
  
  if (line) {
    linesCount++
  }
  return linesCount * lineHeight
}

// ── Rounded rect helper ──────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  if (r < 0) r = 0
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ── Background texture ───────────────────────────────────────────
async function drawBgTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  texture: 'cruces' | 'grano' | 'lineas' | 'solido' | 'custom',
  customBgImg: HTMLImageElement | null
) {
  if (texture === 'custom' && customBgImg) {
    const imgRatio = customBgImg.width / customBgImg.height
    const canvasRatio = w / h
    let dx = 0, dy = 0, dw = w, dh = h

    if (imgRatio > canvasRatio) {
      dw = h * imgRatio
      dx = (w - dw) / 2
    } else {
      dh = w / imgRatio
      dy = (h - dh) / 2
    }
    ctx.drawImage(customBgImg, dx, dy, dw, dh)
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#13161c')
    bg.addColorStop(0.5, '#0a0b0f')
    bg.addColorStop(1, '#050608')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
  }

  if (texture === 'cruces') {
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    const spacing = 70
    for (let x = spacing / 2; x < w; x += spacing) {
      for (let y = spacing / 2; y < h; y += spacing) {
        ctx.fillRect(x - 3, y - 1, 6, 2)
        ctx.fillRect(x - 1, y - 3, 2, 6)
      }
    }
  } else if (texture === 'grano') {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      ctx.fillRect(x, y, 1.5, 1.5)
    }
  } else if (texture === 'lineas') {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    for (let x = 0; x < w; x += 6) {
      ctx.fillRect(x, 0, 1.5, h)
    }
  }

  // Vignette overlay
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, texture === 'custom' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.8)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

// ── Draw single custom fraction-filled star ───────────────────────
function drawDecimalStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fillFraction: number
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.font = `${size}px sans-serif`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  
  const text = '★'
  const starW = size
  const starH = size
  const snappedFraction = Math.round(fillFraction * 4) / 4

  if (snappedFraction >= 1) {
    ctx.fillStyle = '#22c55e'
    ctx.fillText(text, 0, 0)
  } else if (snappedFraction <= 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillText(text, 0, 0)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillText(text, 0, 0)

    ctx.beginPath()
    ctx.rect(0, -size * 0.2, starW * snappedFraction, starH * 1.4)
    ctx.clip()

    ctx.fillStyle = '#22c55e'
    ctx.fillText(text, 0, 0)
  }

  ctx.restore()
}

// ── Main generator ───────────────────────────────────────────────
export async function generateReviewCanvas(
  data: ReviewData,
  format: ReviewFormat = '9:16',
): Promise<HTMLCanvasElement> {
  const { w, h } = DIMS[format]
  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const themeKey = data.cardColor || 'slate'
  const activeCardColors = CARD_THEMES[themeKey]
  const activeTexture = data.bgTexture || 'cruces'
  const descriptionFont = FONT_MAP[data.descFont || 'inter']

  // Scale factor (design at 1080 wide)
  const s = w / 1080

  // Load custom bg image if requested
  let customBgImg: HTMLImageElement | null = null
  if (activeTexture === 'custom' && data.customBgDataUrl) {
    customBgImg = await loadRawImage(data.customBgDataUrl)
  }

  // 1. Background
  await drawBgTexture(ctx, w, h, activeTexture, customBgImg)

  // 2. Load poster via proxy
  const posterImg = await loadProxiedImage(data.posterPath)

  // 3. Card geometry & Layout calculation
  const cardMarginX = 90 * s
  const cardW       = w - cardMarginX * 2
  const posterW     = 240 * s
  const posterH     = 360 * s
  const posterOverlap = posterH * 0.52
  const cardTopY    = (h * 0.08) + posterOverlap
  const cardBottomY = h - 120 * s
  const cardR       = 40 * s

  const posterX = w / 2 - posterW / 2
  const posterY = cardTopY - posterOverlap
  const posterR = 20 * s

  const contentStartY = posterY + posterH + 75 * s
  const cx = w / 2
  const textMaxW = cardW - 120 * s
  let layoutY = contentStartY

  // Calculate dynamic heights before drawing the card
  ctx.save()
  const titleFontSize = 48 * s
  ctx.font = `bold ${titleFontSize}px 'Outfit', Georgia, serif`
  const titleText = data.title
  const yearText = `, ${data.year}`
  const titleW = ctx.measureText(titleText).width
  ctx.font = `${titleFontSize}px 'Outfit', Georgia, serif`
  const yearW = ctx.measureText(yearText).width

  if (titleW + yearW < textMaxW) {
    layoutY += titleFontSize + 12 * s
  } else {
    ctx.font = `bold ${titleFontSize}px 'Outfit', Georgia, serif`
    const titleHeight = measureWrappedTextHeight(ctx, titleText, textMaxW, titleFontSize + 12 * s)
    layoutY += titleHeight + (38 * s) + 12 * s
  }
  layoutY += 12 * s
  ctx.restore()

  const starSize = 62 * s
  layoutY += starSize + 32 * s

  if (data.reviewText.trim()) {
    layoutY += 40 * s
    ctx.save()
    ctx.font = `${28 * s}px ${descriptionFont}`
    const reviewTextHeight = measureWrappedTextHeight(ctx, data.reviewText, textMaxW, 46 * s)
    layoutY += reviewTextHeight + 20 * s
    ctx.restore()
  }

  // Calculate cardH dynamically with a minimum percentage
  const minHeightPercentage = data.reviewText.trim().length === 0 ? 0.35 : data.reviewText.trim().length < 80 ? 0.40 : 0.45
  const minCardH = h * minHeightPercentage
  const maxCardH = h - 120 * s - cardTopY
  const calculatedCardH = layoutY - cardTopY + 125 * s
  const cardH = Math.min(maxCardH, Math.max(minCardH, calculatedCardH))

  // 4. Card shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.92)'
  ctx.shadowBlur  = 85 * s
  ctx.shadowOffsetY = 30 * s
  roundRect(ctx, cardMarginX, cardTopY, cardW, cardH, cardR)
  ctx.fillStyle = activeCardColors.shadow
  ctx.fill()
  ctx.restore()

  // 5. Card background fill
  const cardGrad = ctx.createLinearGradient(0, cardTopY, 0, cardTopY + cardH)
  cardGrad.addColorStop(0, activeCardColors.start)
  cardGrad.addColorStop(1, activeCardColors.end)
  ctx.fillStyle = cardGrad
  roundRect(ctx, cardMarginX, cardTopY, cardW, cardH, cardR)
  ctx.fill()

  // Glowing 3D bevel top-highlight
  const borderGrad = ctx.createLinearGradient(0, cardTopY, 0, cardTopY + cardH)
  borderGrad.addColorStop(0, 'rgba(255,255,255,0.22)')
  borderGrad.addColorStop(0.3, 'rgba(255,255,255,0.06)')
  borderGrad.addColorStop(1, 'rgba(255,255,255,0.02)')
  ctx.strokeStyle = borderGrad
  ctx.lineWidth = 2 * s
  roundRect(ctx, cardMarginX, cardTopY, cardW, cardH, cardR)
  ctx.stroke()

  // 6. Poster
  ctx.save()
  ctx.shadowColor   = 'rgba(0,0,0,0.95)'
  ctx.shadowBlur    = 50 * s
  ctx.shadowOffsetY = 22 * s

  if (posterImg) {
    roundRect(ctx, posterX, posterY, posterW, posterH, posterR)
    ctx.clip()
    ctx.drawImage(posterImg, posterX, posterY, posterW, posterH)
  } else {
    roundRect(ctx, posterX, posterY, posterW, posterH, posterR)
    const ph = ctx.createLinearGradient(posterX, posterY, posterX, posterY + posterH)
    ph.addColorStop(0, '#2a3350')
    ph.addColorStop(1, '#1a2240')
    ctx.fillStyle = ph
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = `bold ${28 * s}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Sin imagen', posterX + posterW / 2, posterY + posterH / 2)
  }
  ctx.restore()

  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 2.5 * s
  roundRect(ctx, posterX, posterY, posterW, posterH, posterR)
  ctx.stroke()

  // 7. Text contents
  let curY = contentStartY

  ctx.textAlign    = 'center'
  ctx.textBaseline = 'alphabetic'

  // Title + Year
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${titleFontSize}px 'Outfit', Georgia, serif`

  if (titleW + yearW < textMaxW) {
    const totalW = titleW + yearW
    const startX = cx - totalW / 2

    ctx.font = `bold ${titleFontSize}px 'Outfit', Georgia, serif`
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(titleText, startX, curY)

    ctx.font = `${titleFontSize}px 'Outfit', Georgia, serif`
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.fillText(yearText, startX + titleW, curY)

    ctx.textAlign = 'center'
    curY += titleFontSize + 12 * s
  } else {
    ctx.font = `bold ${titleFontSize}px 'Outfit', Georgia, serif`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    curY = wrapText(ctx, titleText, cx, textMaxW, titleFontSize + 12 * s, curY)

    ctx.font = `${38 * s}px 'Outfit', Georgia, serif`
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText(data.year, cx, curY)
    curY += (38 * s) + 12 * s
  }

  curY += 12 * s

  // Draw 5 Decimal Stars & Equivalent Number
  const starGap = 10 * s
  const totalStarW = 5 * starSize + 4 * starGap
  const ratingVal = data.rating
  const formattedRating = ratingVal % 0.5 === 0 ? ratingVal.toFixed(1) : ratingVal.toString()

  ctx.save()
  ctx.font = `bold ${32 * s}px 'Outfit', sans-serif`
  const textW = ctx.measureText(formattedRating).width
  const gapBetweenStarsAndText = 20 * s
  const totalWidth = totalStarW + gapBetweenStarsAndText + textW

  let sx = cx - totalWidth / 2
  const starDrawingY = curY - starSize * 0.1

  for (let i = 0; i < 5; i++) {
    const starIndexFill = Math.max(0, Math.min(1, ratingVal - i))
    drawDecimalStar(ctx, sx, starDrawingY, starSize, starIndexFill)
    sx += starSize + starGap
  }

  // Draw rating number text
  ctx.fillStyle = '#22c55e'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(formattedRating, sx - starGap + gapBetweenStarsAndText, starDrawingY + starSize / 2 + 2 * s)
  ctx.restore()

  curY += starSize + 32 * s

  // Divider (only if reviewText is not empty)
  if (data.reviewText.trim()) {
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth   = 2 * s
    ctx.beginPath()
    ctx.moveTo(cardMarginX + 90 * s, curY)
    ctx.lineTo(cardMarginX + cardW - 90 * s, curY)
    ctx.stroke()
    curY += 40 * s
  }

  // Centered review text with customizable description font
  if (data.reviewText.trim()) {
    ctx.fillStyle   = 'rgba(255,255,255,0.92)'
    ctx.font        = `${28 * s}px ${descriptionFont}`
    ctx.textAlign   = 'center'
    curY = wrapText(ctx, data.reviewText, cx, textMaxW, 46 * s, curY)
    curY += 20 * s
  }

  // 8. Signature
  const byY = cardTopY + cardH - 65 * s

  const byLabel = 'Review by '
  const byName  = data.reviewerName || 'Anónimo'
  ctx.font      = `${24 * s}px 'Inter', Arial, sans-serif`
  const lblW    = ctx.measureText(byLabel).width
  ctx.font      = `bold ${24 * s}px 'Inter', Arial, sans-serif`
  const nameW   = ctx.measureText(byName).width
  const byStartX= cx - (lblW + nameW) / 2

  ctx.font      = `${24 * s}px 'Inter', Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.textAlign = 'left'
  ctx.fillText(byLabel, byStartX, byY)

  ctx.font      = `bold ${24 * s}px 'Inter', Arial, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(byName, byStartX + lblW, byY)

  // 9. Branding footer
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.font      = `bold ${20 * s}px 'Outfit', sans-serif`
  ctx.fillText('plotter.', cx, cardBottomY + 55 * s)

  return canvas
}
