import React, { useState, useEffect } from 'react';
import { Movie, TVShow } from '../types/movie';
import { getImageUrl } from '../lib/tmdb';
import { Star, Calendar, Play } from 'lucide-react';
import SearchBar from './SearchBar';

interface HeroProps {
  topMovie: Movie | null;
  topTVShow: TVShow | null;
  onSearch: (query: string, type: 'all' | 'movie' | 'tv') => void;
}

const Hero: React.FC<HeroProps> = ({ topMovie, topTVShow, onSearch }) => {
  const [currentItem, setCurrentItem] = useState<Movie | TVShow | null>(null);
  const [itemIndex, setItemIndex] = useState(0);

  const items = [topMovie, topTVShow].filter(Boolean) as (Movie | TVShow)[];

  useEffect(() => {
    if (items.length > 0) {
      setCurrentItem(items[0]);
    }
  }, [topMovie, topTVShow]);

  useEffect(() => {
    if (items.length > 1) {
      const interval = setInterval(() => {
        setItemIndex((prev) => (prev + 1) % items.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [items.length]);

  useEffect(() => {
    if (items[itemIndex]) {
      setCurrentItem(items[itemIndex]);
    }
  }, [itemIndex, items]);

  if (!currentItem) {
    return (
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Welcome to Plotter
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create beautiful movie and TV show reviews with style
          </p>
          <div className="pt-6">
            <SearchBar onSearch={onSearch} />
          </div>
        </div>
      </div>
    );
  }

  const title = 'title' in currentItem ? currentItem.title : currentItem.name;
  const date = 'release_date' in currentItem ? currentItem.release_date : currentItem.first_air_date;
  const backdropUrl = currentItem.backdrop_path 
    ? getImageUrl(currentItem.backdrop_path, 'w1280')
    : null;

  return (
    <div className="relative h-96 overflow-hidden">
      {backdropUrl && (
        <>
          <img
            src={backdropUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      )}
      
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="px-3 py-1 bg-green-600 text-white rounded-full">
                {'title' in currentItem ? 'Movie' : 'TV Show'}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{currentItem.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{date ? new Date(date).getFullYear() : 'N/A'}</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              {title}
            </h1>
            
            {currentItem.overview && (
              <p className="text-lg text-gray-300 leading-relaxed">
                {currentItem.overview.length > 150 
                  ? `${currentItem.overview.substring(0, 150)}...`
                  : currentItem.overview
                }
              </p>
            )}

            <div className="pt-6">
              <SearchBar onSearch={onSearch} />
            </div>
          </div>
        </div>
      </div>

      {/* Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setItemIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === itemIndex ? 'bg-green-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Hero;