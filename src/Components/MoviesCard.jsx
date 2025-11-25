import React, { memo, useMemo } from "react";
import { useWatchList } from "../Context/WatchListContext";

function MoviesCard({ movie }) {
  const { watchList, handleAddtoWatchList, handleRemovefromWatchList } =
    useWatchList();

  const isInWatchList = useMemo(
    () => watchList.some((m) => m.id === movie.id),
    [watchList, movie.id]
  );

  // ********** FIX: choose best available image **********
  const imageUrl = useMemo(() => {
    if (movie.backdrop_path)
      return `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;

    if (movie.poster_path)
      return `https://image.tmdb.org/t/p/original${movie.poster_path}`;

    // fallback if both props missing
    return "https://via.placeholder.com/300x450?text=No+Image";
  }, [movie.backdrop_path, movie.poster_path]);

  const name = movie.title;
  const overview = movie.overview;

  return (
    <div
      className="group relative h-[40vh] w-[150px] bg-center bg-cover rounded-xl overflow-hidden 
                 hover:cursor-pointer hover:scale-110 duration-300"
      style={{
        backgroundImage: `url('${imageUrl}')`,
      }}
    >
      {/* Bookmark Icon - top right */}
      {isInWatchList ? (
        <div
          onClick={() => handleRemovefromWatchList(movie)}
          className="absolute top-2 right-2 h-8 w-8 flex justify-center items-center 
                      rounded-lg bg-red-500/60 z-20"
        >
          <i className="fa-solid fa-bookmark"></i>
        </div>
      ) : (
        <div
          onClick={() => handleAddtoWatchList(movie)}
          className="absolute top-2 right-2 h-8 w-8 flex justify-center items-center 
                      rounded-lg bg-gray-500/60 z-20"
        >
          <i className="fa-regular fa-bookmark"></i>
        </div>
      )}

      {/* Movie Title - bottom */}
      <div className="absolute bottom-0 w-full text-white text-center text-sm p-1 bg-gray-900/60 z-10">
        {name}
      </div>

      {/* Overview overlay on hover */}
      <div
        className="absolute inset-0 bg-black/70 text-white text-xs p-2 
                   opacity-0 group-hover:opacity-100 duration-300 overflow-y-auto z-5"
      >
        {overview}
      </div>
    </div>
  );
}

// Prevent re-render unless movie id changes
export default memo(
  MoviesCard,
  (prev, next) => prev.movie.id === next.movie.id
);
