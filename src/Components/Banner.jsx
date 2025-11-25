import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

function Banner() {
  const [movies, setMovies] = useState([]);
  const [slideIndex, setSlideIndex] = useState(1);
  const [noTransition, setNoTransition] = useState(false);

  const intervalRef = useRef(null);
  const isPaused = useRef(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  /* ---------------- DATE RANGE ---------------- */
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthStr = `${year}-${month}`;

  /* ---------------- FETCH MOVIES ---------------- */
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get(
          "https://api.themoviedb.org/3/discover/movie",
          {
            params: {
              api_key: API_KEY,
              sort_by: "popularity.desc",
              include_adult: false,
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
        setSlideIndex(1);
      } catch (err) {
        console.error("Banner fetch error:", err);
      }
    };

    fetchMovies();
  }, [year, month, monthStr]);

  const totalReal = movies.length;

  /* ---------------- SLIDES WITH CLONES ---------------- */
  const slides = useMemo(() => {
    if (!totalReal) return [];
    return [movies[totalReal - 1], ...movies, movies[0]];
  }, [movies, totalReal]);

  /* ---------------- ACTIVE MOVIE ---------------- */
  const activeIndex = useMemo(() => {
    if (!totalReal) return 0;
    if (slideIndex === 0) return totalReal - 1;
    if (slideIndex === totalReal + 1) return 0;
    return slideIndex - 1;
  }, [slideIndex, totalReal]);

  const activeMovie = movies[activeIndex];

  useEffect(() => {
    if (!activeMovie) return;

    const url = `https://image.tmdb.org/t/p/original${
      activeMovie.backdrop_path || activeMovie.poster_path
    }`;

    // Remove body background so blur layer is visible
    document.body.style.backgroundImage = "none";

    // Update global blurred background layer
    const bg = document.getElementById("page-blur-bg");
    if (bg) {
      bg.style.backgroundImage = `url(${url})`;
    }
  }, [activeMovie]);

  const getImage = (m) => {
    if (!m) return "";
    if (m.backdrop_path)
      return `https://image.tmdb.org/t/p/original${m.backdrop_path}`;
    if (m.poster_path)
      return `https://image.tmdb.org/t/p/original${m.poster_path}`;
    return "https://via.placeholder.com/1200x800?text=No+Image";
  };

  /* ---------------- AUTOPLAY ---------------- */
  const startSlider = () => {
    if (intervalRef.current || !totalReal) return;
    intervalRef.current = setInterval(() => {
      setSlideIndex((p) => p + 1);
    }, 3000);
  };

  const stopSlider = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => {
    if (totalReal) startSlider();
    return stopSlider;
  }, [totalReal]);

  /* ---------------- PC HOVER ---------------- */
  const handleMouseEnter = () => {
    isPaused.current = true;
    stopSlider();
  };

  const handleMouseLeave = () => {
    isPaused.current = false;
    startSlider();
  };

  /* ---------------- SWIPE ---------------- */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isPaused.current = true;
    stopSlider();
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) setSlideIndex((p) => p + 1);
      else setSlideIndex((p) => p - 1);
    }

    isPaused.current = false;
    startSlider();
  };

  /* ---------------- LOOP FIX ---------------- */
  const handleTransitionEnd = () => {
    if (!totalReal) return;

    if (slideIndex === totalReal + 1) {
      setNoTransition(true);
      setSlideIndex(1);
    } else if (slideIndex === 0) {
      setNoTransition(true);
      setSlideIndex(totalReal);
    }
  };

  useEffect(() => {
    if (noTransition) {
      const id = requestAnimationFrame(() => setNoTransition(false));
      return () => cancelAnimationFrame(id);
    }
  }, [noTransition]);

  /* ---------------- LOADING SKELETON ---------------- */
  if (!totalReal) {
    return (
      <div className="w-full h-60 md:h-[420px] bg-gray-300 animate-pulse rounded-b-xl" />
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div
      className="relative w-full h-60 md:h-[420px] overflow-hidden rounded-b-xl select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* MAIN BLURRED SIDE BACKGROUND */}
      <div
        className="absolute inset-0 blur-[18px] scale-110 bg-center bg-cover"
        style={{ backgroundImage: `url(${getImage(activeMovie)})` }}
      />

      {/* DARK GRADIENT */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-transparent" />

      {/* SLIDE STRIP */}
      <div
        className={`flex h-full ${
          noTransition ? "" : "transition-transform duration-1000 ease-out"
        }`}
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${slideIndex * (100 / slides.length)}%)`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((m, i) => (
          <div key={i} className="w-full flex justify-center items-center">
            <img
              src={getImage(m)}
              alt={m?.title}
              className="max-h-full max-w-full object-contain drop-shadow-2xl"
            />
          </div>
        ))}
      </div>

      {/* MOVIE TITLE */}
      <div className="absolute bottom-10 w-full text-center text-white text-lg md:text-3xl font-semibold drop-shadow-2xl">
        {activeMovie?.title}
      </div>

      {/* DOTS */}
      <div className="absolute bottom-3 w-full flex justify-center gap-2">
        {movies.map((_, i) => (
          <div
            key={i}
            onClick={() => setSlideIndex(i + 1)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full cursor-pointer ${
              i === activeIndex ? "bg-white scale-125" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default Banner;
