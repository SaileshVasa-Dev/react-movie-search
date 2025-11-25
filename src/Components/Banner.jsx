import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";

function Banner() {
  const [movies, setMovies] = useState([]);
  const [slideIndex, setSlideIndex] = useState(1); // index in slides (with clones)
  const [noTransition, setNoTransition] = useState(false);

  const intervalRef = useRef(null);
  const isPaused = useRef(false);

  // ---- Current year & month ----
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthStr = `${year}-${month}`;

  // ---- Fetch top 10 popular movies this month ----
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get(
          "https://api.themoviedb.org/3/discover/movie",
          {
            params: {
              api_key: "7163db8b7c5abfc54583ec3896958457",
              sort_by: "popularity.desc",
              page: 1,
              "primary_release_date.gte": `${year}-${month}-01`,
              "primary_release_date.lte": `${year}-${month}-31`,
            },
          }
        );

        const monthMovies = res.data.results
          .filter((m) => m.release_date?.startsWith(monthStr))
          .slice(0, 10);

        setMovies(monthMovies);
        setSlideIndex(1); // start from first real slide
      } catch (err) {
        console.error("Error fetching banner movies:", err);
      }
    };

    fetchMovies();
  }, [year, month, monthStr]);

  // ---- Build slides array with clones for infinite loop ----
  const slides = useMemo(() => {
    if (movies.length === 0) return [];
    const first = movies[0];
    const last = movies[movies.length - 1];
    return [last, ...movies, first]; // [cloneLast, ...real, cloneFirst]
  }, [movies]);

  const totalReal = movies.length;

  // ---- Active dot index (0..totalReal-1) derived from slideIndex ----
  const activeIndex = useMemo(() => {
    if (!totalReal) return 0;
    if (slideIndex === 0) return totalReal - 1;
    if (slideIndex === totalReal + 1) return 0;
    return slideIndex - 1;
  }, [slideIndex, totalReal]);

  const activeMovie = totalReal ? movies[activeIndex] : null;

  const getImage = (movie) => {
    if (!movie) return "";
    if (movie.backdrop_path)
      return `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
    if (movie.poster_path)
      return `https://image.tmdb.org/t/p/original${movie.poster_path}`;
    return "https://via.placeholder.com/1600x900?text=No+Image";
  };

  // ---- Slider start/stop ----
  const startSlider = () => {
    if (intervalRef.current || !totalReal) return;
    intervalRef.current = setInterval(() => {
      setSlideIndex((prev) => prev + 1);
    }, 3000);
  };

  const stopSlider = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  // Start auto slide when movies ready
  useEffect(() => {
    if (totalReal) startSlider();
    return stopSlider;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalReal]);

  // Pause/resume on hover
  const handleMouseEnter = () => {
    isPaused.current = true;
    stopSlider();
  };

  const handleMouseLeave = () => {
    isPaused.current = false;
    startSlider();
  };

  // Click dot → move to that slide
  const handleDotClick = (i) => {
    stopSlider();
    setSlideIndex(i + 1); // real index i corresponds to slideIndex i+1
    if (!isPaused.current) startSlider();
  };

  // ---- Handle infinite-loop "teleport" after animation ----
  const handleTransitionEnd = () => {
    if (!totalReal) return;

    if (slideIndex === totalReal + 1) {
      // moved onto cloneFirst → jump to real first (1)
      setNoTransition(true);
      setSlideIndex(1);
    } else if (slideIndex === 0) {
      // moved onto cloneLast → jump to real last (totalReal)
      setNoTransition(true);
      setSlideIndex(totalReal);
    }
  };

  // Re-enable transition one frame after teleport
  useEffect(() => {
    if (noTransition) {
      const id = requestAnimationFrame(() => setNoTransition(false));
      return () => cancelAnimationFrame(id);
    }
  }, [noTransition]);

  const backgroundUrl = getImage(activeMovie);

  return (
    <div
      className="relative w-full h-[20vh] md:h-[65vh] overflow-hidden bg-black cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Blurred background (fills black space) */}
      {backgroundUrl && (
        <>
          <div
            className="absolute inset-0 -z-20"
            style={{
              backgroundImage: `url('${backgroundUrl}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px)",
              transform: "scale(1.1)",
            }}
          />
          {/* dark overlay so center image pops */}
          <div className="absolute inset-0 bg-black/60 -z-10" />
        </>
      )}

      {/* Sliding foreground posters */}
      <div
        className={`flex h-full w-full ${
          noTransition ? "" : "transition-transform duration-[1200ms] ease-out"
        }`}
        style={{ transform: `translateX(-${slideIndex * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((m, i) => (
          <div
            key={i}
            className="min-w-full h-full flex justify-center items-center"
          >
            <div
              key={i}
              className="min-w-full h-full flex justify-center items-center relative"
            >
              {/* Blurred full background */}
              <div
                className="absolute inset-0 -z-10"
                style={{
                  backgroundImage: `url('${getImage(m)}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(25px)",
                  transform: "scale(1.2)",
                }}
              />

              {/* Dark overlay for contrast */}
              <div className="absolute inset-0 bg-black/50 -z-10" />

              {/* Perfect non-cropped poster */}
              <img
                src={getImage(m)}
                alt={m?.title}
                className="max-w-full max-h-full object-contain drop-shadow-xl"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Dots (above title) */}
      <div className="absolute bottom-16 w-full flex justify-center gap-3 z-30">
        {movies.map((_, i) => (
          <div
            key={i}
            onClick={() => handleDotClick(i)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`h-3 w-3 rounded-full cursor-pointer transition-all duration-300 ${
              i === activeIndex ? "bg-white scale-150" : "bg-gray-400"
            }`}
          ></div>
        ))}
      </div>

      {/* Title */}
      <div className="absolute bottom-0 w-full text-white text-xl md:text-3xl text-center bg-black/50 py-3 z-20">
        {activeMovie?.title || "Loading..."}
      </div>
    </div>
  );
}

export default React.memo(Banner);
