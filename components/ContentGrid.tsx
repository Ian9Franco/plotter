import React from 'react';
import { Movie, TVShow } from '../types/movie';
import { getImageUrl } from '../lib/tmdb';
import { Star, Calendar } from 'lucide-react';

interface ContentGridProps {
  items: (Movie | TVShow)[];
  onItemSelect: (item: Movie | TVShow) => void;
}

const ContentGrid: React.FC<ContentGridProps> = ({ items, onItemSelect }) => {
  const getTitle = (item: Movie | TVShow): string => {
    return 'title' in item ? item.title : item.name;
  };

  const getDate = (item: Movie | TVShow): string => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return date ? new Date(date).getFullYear().toString() : 'N/A';
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No results found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemSelect(item)}
          className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-gray-700"
        >
          <div className="aspect-[2/3] relative">
            <img
              src={item.poster_path ? getImageUrl(item.poster_path, 'w300') : '/placeholder.svg'}
              alt={getTitle(item)}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-white text-xs">{item.vote_average.toFixed(1)}</span>
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
              {getTitle(item)}
            </h3>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Calendar className="w-3 h-3" />
              <span>{getDate(item)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContentGrid;