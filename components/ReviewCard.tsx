"use client"

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Download, CreditCard as Edit3, Save, X } from 'lucide-react';
import { getImageUrl } from '../lib/tmdb';
import type { Movie, TVShow } from '../types/movie';

interface ReviewCardProps {
  movie: Movie | TVShow;
  rating?: number;
  reviewText?: string;
  reviewerName?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  movie,
  rating = 5,
  reviewText = "",
  reviewerName = "Movie Lover",
}) => {
  const [isEditing, setIsEditing] = useState(true);
  const [currentRating, setCurrentRating] = useState(rating);
  const [currentReview, setCurrentReview] = useState(reviewText);
  const [currentName, setCurrentName] = useState(reviewerName);
  const [posterBase64, setPosterBase64] = useState<string | null>(null);
  const [isLoadingPoster, setIsLoadingPoster] = useState(false);

  const contentTitle = 'title' in movie ? movie.title : movie.name;
  const releaseDate = 'release_date' in movie ? movie.release_date : movie.first_air_date;
  const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, "w500") : "/placeholder.svg";

  const hasReview = currentReview.trim().length > 0;
  const shouldShowExpanded = isEditing || hasReview;

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && setCurrentRating(i + 1)}
        className={`text-3xl ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform ${
          i < rating ? "text-green-400" : "text-gray-600"
        }`}
      >
        ★
      </button>
    ));
  };

  const getCardHeight = () => {
    if (!shouldShowExpanded) return 280;
    const baseHeight = 400;
    const textLength = currentReview.length;
    const additionalHeight = Math.max(0, Math.floor(textLength / 60) * 25);
    return Math.min(baseHeight + additionalHeight, 650);
  };

  const drawTextOnCanvas = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== "") {
        ctx.fillText(line, x, currentY);
        line = word + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  };

  const loadPosterBase64 = async () => {
    if (!movie.poster_path) {
      setPosterBase64(null);
      return;
    }

    setIsLoadingPoster(true);
    try {
      const imageUrl = getImageUrl(movie.poster_path, "w500");
      
      const img = new Image();
      img.crossOrigin = "anonymous";

      const base64 = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout loading image"));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("No canvas context");

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Failed to load image"));
        };

        img.src = imageUrl;
      });

      setPosterBase64(base64);
    } catch (error) {
      console.error("Error loading poster:", error);
      setPosterBase64(null);
    } finally {
      setIsLoadingPoster(false);
    }
  };

  useEffect(() => {
    loadPosterBase64();
  }, [movie.poster_path]);

  const handleSave = () => setIsEditing(false);

  const handleCancel = () => {
    setCurrentRating(rating);
    setCurrentReview(reviewText);
    setCurrentName(reviewerName);
    setIsEditing(false);
  };

  const downloadReviewCanvas = async () => {
    if (isLoadingPoster) {
      alert("Please wait for the poster to load...");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const baseWidth = 400;
      const baseHeight = hasReview ? 380 : 300;
      const textHeight = hasReview ? Math.max(80, Math.min(currentReview.length * 0.5, 120)) : 0;
      const totalHeight = baseHeight + textHeight;

      canvas.width = baseWidth * 2;
      canvas.height = totalHeight * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.scale(2, 2);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, baseWidth, totalHeight);
      gradient.addColorStop(0, "#4a5568");
      gradient.addColorStop(1, "#2d3748");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 80, baseWidth, totalHeight - 80);

      const posterWidth = 120;
      const posterHeight = 180;
      const posterX = baseWidth / 2 - posterWidth / 2;
      const posterY = 0;

      if (posterBase64) {
        const poster = new Image();
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Timeout loading poster"));
          }, 5000);

          poster.onload = () => {
            clearTimeout(timeout);
            try {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(posterX, posterY, posterWidth, posterHeight, 12);
              ctx.clip();
              ctx.drawImage(poster, posterX, posterY, posterWidth, posterHeight);
              ctx.restore();
              resolve();
            } catch (error) {
              ctx.fillStyle = "#4a5568";
              ctx.fillRect(posterX, posterY, posterWidth, posterHeight);
              resolve();
            }
          };

          poster.onerror = () => {
            clearTimeout(timeout);
            ctx.fillStyle = "#4a5568";
            ctx.fillRect(posterX, posterY, posterWidth, posterHeight);
            resolve();
          };

          poster.src = posterBase64;
        });
      } else {
        ctx.fillStyle = "#4a5568";
        ctx.fillRect(posterX, posterY, posterWidth, posterHeight);
        ctx.fillStyle = "#a0aec0";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("No Image", posterX + posterWidth / 2, posterY + posterHeight / 2);
      }

      // Title and year
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(contentTitle, baseWidth / 2, 220);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#a0aec0";
      const yearText = releaseDate ? new Date(releaseDate).getFullYear().toString() : "N/A";
      ctx.fillText(yearText, baseWidth / 2, 245);

      // Stars
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < currentRating ? "#48bb78" : "#4a5568";
        ctx.font = "28px sans-serif";
        ctx.fillText("★", baseWidth / 2 - 60 + i * 30, 280);
      }

      let currentY = 300;

      // Review text
      if (hasReview) {
        ctx.strokeStyle = "#4a5568";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, currentY);
        ctx.lineTo(baseWidth - 60, currentY);
        ctx.stroke();

        currentY += 30;
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";

        currentY = drawTextOnCanvas(ctx, currentReview, baseWidth / 2, currentY, baseWidth - 60, 22);
        currentY += 20;
      } else {
        currentY += 20;
      }

      // Reviewer name
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#a0aec0";
      ctx.textAlign = "center";
      const reviewByText = "Review by ";
      const reviewByWidth = ctx.measureText(reviewByText).width;
      const totalWidth = reviewByWidth + ctx.measureText(currentName).width;
      const startX = baseWidth / 2 - totalWidth / 2;

      ctx.fillText(reviewByText, startX + reviewByWidth / 2, currentY);
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(currentName, startX + reviewByWidth + ctx.measureText(currentName).width / 2, currentY);

      // Download
      const dataURL = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `review-${contentTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading review:", error);
      alert("There was an error downloading the image. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <div className="flex justify-end gap-2 mb-4 px-4">
        {!isEditing ? (
          <>
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={downloadReviewCanvas}
              variant="outline"
              size="sm"
              disabled={isLoadingPoster}
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoadingPoster ? "Loading..." : "Download"}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </>
        )}
      </div>

      <div className="relative mx-auto" style={{ width: "400px" }}>
        {/* Poster */}
        <div className="relative z-20 flex justify-center">
          <div className="w-30 h-45 rounded-xl overflow-hidden shadow-2xl border-4 border-white">
            {isLoadingPoster ? (
              <div className="bg-gray-800 flex items-center justify-center" style={{ width: "120px", height: "180px" }}>
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mb-2"></div>
                  <span className="text-gray-400 text-xs text-center">Loading...</span>
                </div>
              </div>
            ) : (
              <img
                src={posterUrl}
                alt={contentTitle}
                className="w-full h-full object-cover"
                style={{ width: "120px", height: "180px" }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
            )}
          </div>
        </div>

        <div
          className="relative -mt-20 pt-24 pb-8 px-8 rounded-3xl shadow-2xl transition-all duration-300"
          style={{
            height: `${getCardHeight()}px`,
            background: `linear-gradient(135deg, #4a5568 0%, #2d3748 100%)`,
          }}
        >
          {/* Title and year */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{contentTitle}</h2>
            <p className="text-lg text-gray-300 font-medium">
              {releaseDate ? new Date(releaseDate).getFullYear() : "N/A"}
            </p>
          </div>

          {/* Stars */}
          <div className="flex items-center justify-center mb-6">{renderStars(currentRating, isEditing)}</div>

          {shouldShowExpanded && (
            <>
              {hasReview && <div className="w-full h-px bg-gray-600 mb-6"></div>}

              {/* Review text editor/display */}
              <div className="flex-1 mb-6 px-2">
                {isEditing ? (
                  <Textarea
                    value={currentReview}
                    onChange={(e) => setCurrentReview(e.target.value)}
                    className="w-full min-h-32 bg-transparent border border-gray-600/50 text-white text-center resize-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 placeholder:text-gray-400 px-4 py-3 rounded-lg"
                    placeholder="Write your thoughts about this movie..."
                    style={{ fontSize: "14px", lineHeight: "1.6", textAlign: "center" }}
                  />
                ) : hasReview ? (
                  <div className="px-6 py-2">
                    <p className="text-white text-center text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {currentReview}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Reviewer name */}
              <div className="text-center mt-auto pt-4">
                {isEditing ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-300 text-sm">Review by</span>
                    <Input
                      value={currentName}
                      onChange={(e) => setCurrentName(e.target.value)}
                      className="bg-transparent border border-gray-600/50 text-white text-center focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 max-w-32 h-8 text-sm"
                      placeholder="Your name"
                    />
                  </div>
                ) : (
                  <p className="text-gray-300">
                    Review by <span className="font-bold text-white">{currentName}</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;