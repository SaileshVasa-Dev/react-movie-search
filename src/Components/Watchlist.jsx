import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import genreIds from "../Utilities/Genreids";
import languages from "../Utilities/Languages";
import { useWatchList } from "../Context/WatchListContext";

function Watchlist() {
  const { watchList, handleRemovefromWatchList } = useWatchList();

  const [search, setSearch] = useState("");
  const [currGenre, setCurrGenre] = useState("All Genres");

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // LANGUAGE FILTER STATE
  const [languageFilter, setLanguageFilter] = useState("All Languages");
  const [languageSearchInput, setLanguageSearchInput] = useState("");
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const searchInputRef = useRef(null);
  const langBoxRef = useRef(null);

  /* ---------------- Autofocus ---------------- */
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  /* ---------------- Close dropdown on outside click ---------------- */
  useEffect(() => {
    function handleClickOutside(e) {
      if (langBoxRef.current && !langBoxRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- Handlers ---------------- */
  const handleSearch = useCallback((e) => setSearch(e.target.value), []);

  // Genre filter handler
  const handleFilter = useCallback((g) => setCurrGenre(g), []);

  // Sorting Handlers
  const sortRatingAsc = () => {
    setSortField("rating");
    setSortOrder("asc");
  };
  const sortRatingDesc = () => {
    setSortField("rating");
    setSortOrder("desc");
  };
  const sortPopAsc = () => {
    setSortField("popularity");
    setSortOrder("asc");
  };
  const sortPopDesc = () => {
    setSortField("popularity");
    setSortOrder("desc");
  };

  // Genre list computed from watchList
  const genreList = useMemo(() => {
    const temp = new Set(["All Genres"]);
    watchList.forEach((movie) => {
      movie.genre_ids?.forEach((id) => {
        const name = genreIds.find((g) => g.id === id)?.name;
        if (name) temp.add(name);
      });
    });
    return Array.from(temp);
  }, [watchList]);

  // Reset invalid genre selection
  useEffect(() => {
    if (currGenre === "All Genres") return;

    const valid = watchList.some((movie) =>
      movie.genre_ids?.some((id) => {
        const name = genreIds.find((g) => g.id === id)?.name;
        return name === currGenre;
      })
    );

    if (!valid) setCurrGenre("All Genres");
  }, [watchList, currGenre]);

  // Filter language list
  const filteredLanguages = useMemo(() => {
    const s = languageSearchInput.toLowerCase();
    return languages.filter((l) => l.english_name.toLowerCase().includes(s));
  }, [languageSearchInput]);

  // Convert language code → full name
  const getLanguageName = useCallback((code) => {
    const lang = languages.find((l) => l.iso_639_1 === code);
    return lang ? lang.english_name : code.toUpperCase();
  }, []);

  // MAIN DATA PIPELINE
  const processedMovies = useMemo(() => {
    let data = [...watchList];

    // Sorting
    if (sortField && sortOrder) {
      data.sort((a, b) => {
        const aVal =
          sortField === "rating" ? a.vote_average ?? 0 : a.popularity ?? 0;
        const bVal =
          sortField === "rating" ? b.vote_average ?? 0 : b.popularity ?? 0;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    // Genre filter
    if (currGenre !== "All Genres") {
      data = data.filter((movie) =>
        movie.genre_ids?.some((id) => {
          const name = genreIds.find((g) => g.id === id)?.name;
          return name === currGenre;
        })
      );
    }

    // LANGUAGE FILTER
    if (languageFilter !== "All Languages") {
      data = data.filter((m) => m.original_language === languageFilter);
    }

    // Search filter
    const s = search.toLowerCase();
    return data.filter((movie) => movie.title.toLowerCase().includes(s));
  }, [watchList, currGenre, languageFilter, search, sortField, sortOrder]);

  // Banner should control the global background
  useEffect(() => {}, []);

  return (
    <>
      {/* ---------------- GENRE BUTTONS ---------------- */}
      <div className="flex justify-center flex-wrap m-4">
        {genreList.map((genre) => (
          <div
            key={genre}
            onClick={() => handleFilter(genre)}
            className={
              currGenre === genre
                ? "flex justify-center items-center h-12 px-6 md:px-12 bg-blue-400 rounded-xl font-bold text-white mx-2 my-2 cursor-pointer"
                : "flex justify-center items-center h-12 px-6 md:px-12 bg-gray-400/50 rounded-xl font-bold text-white mx-2 my-2 cursor-pointer"
            }
          >
            {genre}
          </div>
        ))}
      </div>

      {/* ---------------- Search + Language (Responsive) ---------------- */}
      <div className="w-full px-4 my-4 flex flex-col md:flex-row md:justify-center md:items-center gap-3 relative">
        {/* Search Input */}
        <input
          ref={searchInputRef}
          onChange={handleSearch}
          value={search}
          className="bg-white/10 text-gray-200 placeholder-gray-400 
             p-3 h-10 w-full md:w-96 outline-none rounded-lg 
             border border-white/10 backdrop-blur-md"
          type="text"
          placeholder="Search Movies"
        />

        {/* Language Filter */}
        <div className="relative" ref={langBoxRef}>
          <div
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="bg-white/10 text-gray-200 h-10 w-full md:w-44 
           p-2 rounded-lg border border-white/10 backdrop-blur-md 
           cursor-pointer flex items-center justify-between"
          >
            <span
              className={`text-sm truncate ${
                languageFilter === "All Languages"
                  ? "text-gray-400"
                  : "text-gray-700"
              }`}
            >
              {languageFilter === "All Languages"
                ? "Language filter"
                : getLanguageName(languageFilter)}
            </span>

            {/* Search ↔ Cross icon */}
            {languageFilter === "All Languages" ? (
              <i className="fa-solid fa-magnifying-glass text-sm text-gray-600" />
            ) : (
              <i
                className="fa-solid fa-xmark text-sm text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguageFilter("All Languages");
                  setLanguageSearchInput("");
                }}
              />
            )}
          </div>

          {/* Dropdown */}
          {showLangDropdown && (
            <div className="absolute mt-1 w-full md:w-48 bg-white border rounded shadow-xl max-h-64 overflow-auto z-50">
              {/* Search inside dropdown */}
              <div className="p-2 border-b bg-gray-50">
                <input
                  className="p-2 w-full outline-none bg-white text-sm border shadow-inner rounded"
                  placeholder="Search language..."
                  value={languageSearchInput}
                  onChange={(e) => setLanguageSearchInput(e.target.value)}
                />
              </div>

              {/* All languages */}
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  setLanguageFilter("All Languages");
                  setLanguageSearchInput("");
                  setShowLangDropdown(false);
                }}
              >
                All Languages
              </div>

              {/* Filtered languages */}
              {filteredLanguages.map((lang) => (
                <div
                  key={lang.iso_639_1}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setLanguageFilter(lang.iso_639_1);
                    setLanguageSearchInput("");
                    setShowLangDropdown(false);
                  }}
                >
                  {lang.english_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- MOVIE TABLE (Scrollable on mobile) ---------------- */}
      <div
        className="m-4 md:m-8 overflow-x-auto rounded-lg 
                backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl"
      >
        <table className="min-w-[700px] w-full text-gray-200 text-center">
          <thead className="border-b-2 bg-white/5 text-gray-100">
            <tr>
              <th className="p-3">Name</th>

              {/* Ratings */}
              <th className="p-3">
                <div className="flex justify-center items-center gap-2">
                  <i
                    onClick={sortRatingAsc}
                    className="fa-solid fa-angles-up cursor-pointer"
                  ></i>

                  <span>Ratings</span>

                  <i
                    onClick={sortRatingDesc}
                    className="fa-solid fa-angles-down cursor-pointer"
                  ></i>
                </div>
              </th>

              {/* Popularity */}
              <th className="p-3">
                <div className="flex justify-center items-center gap-2">
                  <i
                    onClick={sortPopAsc}
                    className="fa-solid fa-angles-up cursor-pointer"
                  ></i>

                  <span>Popularity</span>

                  <i
                    onClick={sortPopDesc}
                    className="fa-solid fa-angles-down cursor-pointer"
                  ></i>
                </div>
              </th>

              <th className="p-3">Genre</th>
              <th className="p-3">Language</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {processedMovies.map((movie) => (
              <tr
                key={movie.id}
                className="border-b border-gray-700 hover:bg-white/5"
              >
                <td className="flex items-center px-4 py-6">
                  <img
                    className="h-24 w-40 object-cover rounded"
                    src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
                    alt={movie.title}
                  />
                  <div className="mx-4">{movie.title}</div>
                </td>

                <td>{movie.vote_average}</td>
                <td>{movie.popularity}</td>

                <td className="whitespace-pre-line">
                  {movie.genre_ids
                    ?.map((id) => genreIds.find((g) => g.id === id)?.name)
                    .filter(Boolean)
                    .join("\n")}
                </td>

                <td>{getLanguageName(movie.original_language)}</td>

                <td
                  onClick={() => handleRemovefromWatchList(movie)}
                  className="text-red-800 p-4 cursor-pointer"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </td>
              </tr>
            ))}

            {processedMovies.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-gray-400">
                  No movies found in your watchlist.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Watchlist;
