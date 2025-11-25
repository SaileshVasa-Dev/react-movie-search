import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import MoviesCard from "./MoviesCard";
import Pagenation from "./Pagenation";
import languages from "../Utilities/Languages";
import months from "../Utilities/Months";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const currentYear = new Date().getFullYear();
const PAGE_SIZE = 20;

// Upper safety caps (not directly used for dynamic logic, just hard limits)
const MAX_SEARCH_PAGES = 50;
const MAX_DISCOVER_PAGES = 10;

/* ----------------------------------------------- */
/*        Helper: dynamic search pages             */
/* ----------------------------------------------- */
function resolveSearchPageCount(len) {
  if (len <= 0) return 0;
  if (len === 1) return 25; // 1-letter: up to 25 pages
  if (len === 2) return 20;
  if (len === 3) return 15;
  if (len <= 5) return 10;
  // 6+ letters: start with 10, deep fallback can go to 50
  return 10;
}

/* -------- STRICT SEARCH HELPERS (unchanged behavior) -------- */
const strictTitleMatch = (movie, words) => {
  const title = (movie.title || "").toLowerCase();
  return words.every((w) => title.includes(w));
};

const strictTitleOverviewMatch = (movie, words) => {
  const text = `${movie.title || ""} ${
    movie.original_title || ""
  }`.toLowerCase();
  return words.every((w) => text.includes(w));
};

/* ----------------------------------------------- */
/*             COMPONENT START                     */
/* ----------------------------------------------- */

function Movies() {
  const [movies, setMovies] = useState([]);
  const [pageNo, setPageNo] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [languageFilter, setLanguageFilter] = useState("All Languages");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [langSearchInput, setLangSearchInput] = useState("");

  const [showCalendar, setShowCalendar] = useState(false);
  const [showYearList, setShowYearList] = useState(false);
  const [calendarYear, setCalendarYear] = useState(currentYear);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const langRef = useRef(null);
  const calendarRef = useRef(null);

  /* ------------ Debounce Search ------------ */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPageNo(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  /* ------------ Outside Click ------------ */
  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target))
        setShowLangDropdown(false);

      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
        setShowYearList(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ------------ Generic Multi-Page Fetch ------------ */
  const fetchPages = useCallback(async (url, params, pages, controller) => {
    const all = [];
    const cappedPages = Math.min(pages, MAX_SEARCH_PAGES);

    for (let page = 1; page <= cappedPages; page++) {
      const res = await axios.get(url, {
        params: { ...params, api_key: API_KEY, page },
        signal: controller.signal,
      });

      all.push(...(res.data.results || []));
      if (page >= (res.data.total_pages || 1)) break;
    }
    return all;
  }, []);

  /* ----------------------------------------------- */
  /*           MAIN TMDB FETCH LOGIC                 */
  /* ----------------------------------------------- */

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    async function loadMovies() {
      try {
        const hasSearch = debouncedSearch.length > 0;
        const hasLang = languageFilter !== "All Languages";
        const hasYear = selectedYear !== null;
        const hasMonth = selectedMonth !== null;
        const hasFilters = hasLang || hasYear || hasMonth;

        let candidates = [];

        /* -------- Case 1: No filters + no search => Trending -------- */
        if (!hasSearch && !hasFilters) {
          const trending = await fetchPages(
            "https://api.themoviedb.org/3/movie/popular",
            { include_adult: false },
            3,
            controller
          );
          if (!isCancelled) setMovies(trending);
          return;
        }

        /* -------- Case 2: DISCOVER based on language/date -------- */
        const discoverLang =
          languageFilter === "All Languages" ? "te" : languageFilter;

        let discoverParams = {
          include_adult: false,
          sort_by: "popularity.desc",
          with_original_language: discoverLang,
        };

        if (hasYear) {
          discoverParams["primary_release_date.gte"] = `${selectedYear}-01-01`;
          discoverParams["primary_release_date.lte"] = `${selectedYear}-12-31`;

          if (hasMonth) {
            discoverParams[
              "primary_release_date.gte"
            ] = `${selectedYear}-${selectedMonth}-01`;
            discoverParams[
              "primary_release_date.lte"
            ] = `${selectedYear}-${selectedMonth}-31`;
          }
        }

        // Always pull some base discover data to help filters
        const discoverResults = await fetchPages(
          "https://api.themoviedb.org/3/discover/movie",
          discoverParams,
          MAX_DISCOVER_PAGES,
          controller
        );
        candidates.push(...discoverResults);

        /* -------- Case 3: SEARCH results (dynamic pages) -------- */
        const searchLen = debouncedSearch.length;
        if (hasSearch) {
          const searchPages = resolveSearchPageCount(searchLen);

          // Initial, length-based search depth
          const searchRes = await fetchPages(
            "https://api.themoviedb.org/3/search/movie",
            { include_adult: false, query: debouncedSearch },
            searchPages,
            controller
          );

          candidates.push(...searchRes);
        }

        /* -------- Remove duplicates -------- */
        const map = new Map();
        candidates.forEach((m) => map.set(m.id, m));
        let unique = Array.from(map.values());

        /* -------- Deep fallback for 6+ letters if strict matches = 0 -------- */
        if (hasSearch && debouncedSearch.length >= 6) {
          const words = debouncedSearch
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);

          const strictInUnique = unique.filter((m) => {
            const title = (m.title || "").toLowerCase();
            return words.every((w) => title.includes(w));
          });

          if (strictInUnique.length === 0) {
            // Deep re-search: up to 50 pages on search/movie
            const deepSearchRes = await fetchPages(
              "https://api.themoviedb.org/3/search/movie",
              { include_adult: false, query: debouncedSearch },
              MAX_SEARCH_PAGES,
              controller
            );

            deepSearchRes.forEach((m) => map.set(m.id, m));
            unique = Array.from(map.values());
          }
        }

        if (!isCancelled) setMovies(unique);
      } catch (err) {
        if (!isCancelled && !axios.isCancel(err)) {
          console.error(err);
          setMovies([]);
        }
      }
    }

    loadMovies();
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [
    debouncedSearch,
    languageFilter,
    selectedYear,
    selectedMonth,
    fetchPages,
  ]);

  /* ----------------------------------------------- */
  /*       STRICT FINAL FILTERING                    */
  /* ----------------------------------------------- */

  const processedMovies = useMemo(() => {
    let data = [...movies];

    const hasSearch = debouncedSearch.length > 0;
    const hasYear = selectedYear !== null;
    const hasMonth = selectedMonth !== null;

    if (hasSearch) {
      const words = debouncedSearch.toLowerCase().split(/\s+/).filter(Boolean);

      let strict = data.filter((m) => strictTitleMatch(m, words));

      if (strict.length > 0) {
        data = strict;
      } else {
        data = data.filter((m) => strictTitleOverviewMatch(m, words));
      }
    }

    /* Language filter */
    if (languageFilter !== "All Languages") {
      data = data.filter((m) => m.original_language === languageFilter);
    }

    /* Year/month filter */
    if (hasYear) {
      data = data.filter((m) => {
        if (!m.release_date) return false;
        const [yStr, mStr] = m.release_date.split("-");
        if (Number(yStr) !== selectedYear) return false;
        if (hasMonth) return mStr === selectedMonth;
        return true;
      });
    }

    return data;
  }, [movies, debouncedSearch, languageFilter, selectedYear, selectedMonth]);

  /* ----------------------------------------------- */
  /*                Pagination                        */
  /* ----------------------------------------------- */

  const totalPages = Math.max(1, Math.ceil(processedMovies.length / PAGE_SIZE));

  const paginatedMovies = useMemo(() => {
    const start = (pageNo - 1) * PAGE_SIZE;
    return processedMovies.slice(start, start + PAGE_SIZE);
  }, [processedMovies, pageNo]);

  //Background movie for blur effect
  const backgroundMovie =
    paginatedMovies.length > 0 ? paginatedMovies[0] : null;

  useEffect(() => {
    const bg = document.getElementById("page-blur-bg");

    if (!bg) return;

    if (backgroundMovie?.backdrop_path || backgroundMovie?.poster_path) {
      bg.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${
        backgroundMovie.backdrop_path || backgroundMovie.poster_path
      })`;
    } else {
      bg.style.backgroundImage = "none";
    }
  }, [backgroundMovie]);

  const handleNext = () =>
    setPageNo((prev) => (prev >= totalPages ? prev : prev + 1));

  const handlePrev = () => setPageNo((prev) => (prev <= 1 ? 1 : prev - 1));

  /* ----------------------------------------------- */
  /*                Calendar/Language UI             */
  /* ----------------------------------------------- */

  const selectedMonthName =
    months.find((m) => m.num === selectedMonth)?.short || "";

  const calendarLabel = !selectedYear
    ? "Release Month"
    : !selectedMonth
    ? `${selectedYear}`
    : `${selectedYear} - ${selectedMonthName}`;

  const clearDateFilter = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setCalendarYear(currentYear);
  };

  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  /* ----------------------------------------------- */
  /*                 UI Rendering                     */
  /* ----------------------------------------------- */

  return (
    <div className="p-5">
      {/* SEARCH + FILTER ROW */}
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-center gap-3 my-4 px-3">
        {/* SEARCH */}
        <input
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          className="bg-gray-200 p-3 h-10 w-full md:w-88 outline-none rounded shadow-sm"
          type="text"
          placeholder="Search Movies"
        />

        {/* LANGUAGE FILTER */}
        <div className="relative w-full md:w-44" ref={langRef}>
          <div
            onClick={() => setShowLangDropdown((prev) => !prev)}
            className="bg-white p-2 h-10 w-full border rounded cursor-pointer flex items-center justify-between shadow-sm"
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

            {languageFilter === "All Languages" ? (
              <i className="fa-solid fa-magnifying-glass text-sm text-gray-600" />
            ) : (
              <i
                className="fa-solid fa-xmark text-sm text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguageFilter("All Languages");
                  setLangSearchInput("");
                  setPageNo(1);
                }}
              />
            )}
          </div>

          {showLangDropdown && (
            <div className="absolute left-0 mt-1 w-full bg-white border rounded shadow-xl max-h-64 overflow-auto z-50">
              <div className="p-2 border-b bg-gray-50">
                <input
                  className="p-2 w-full outline-none bg-white text-sm border shadow-inner rounded"
                  placeholder="Search language..."
                  value={langSearchInput}
                  onChange={(e) => setLangSearchInput(e.target.value)}
                />
              </div>

              <div
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  setLanguageFilter("All Languages");
                  setLangSearchInput("");
                  setShowLangDropdown(false);
                  setPageNo(1);
                }}
              >
                All Languages
              </div>

              {filteredLanguages.map((lang) => (
                <div
                  key={lang.iso_639_1}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setLanguageFilter(lang.iso_639_1);
                    setLangSearchInput("");
                    setShowLangDropdown(false);
                    setPageNo(1);
                  }}
                >
                  {lang.english_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CALENDAR FILTER */}
        <div className="relative w-full md:w-44" ref={calendarRef}>
          <div
            onClick={() =>
              setShowCalendar((prev) => {
                const next = !prev;
                if (next) {
                  setShowYearList(false);
                  setCalendarYear(selectedYear || currentYear);
                }
                return next;
              })
            }
            className="bg-white p-2 h-10 w-full border rounded cursor-pointer flex items-center justify-between shadow-sm"
          >
            <span
              className={`text-sm truncate ${
                !selectedYear ? "text-gray-400" : "text-gray-700"
              }`}
            >
              {calendarLabel}
            </span>

            {selectedYear ? (
              <i
                className="fa-solid fa-xmark text-sm text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  clearDateFilter();
                }}
              />
            ) : (
              <i className="fa-solid fa-calendar text-sm text-gray-600" />
            )}
          </div>

          {showCalendar && (
            <div className="absolute left-0 mt-1 w-full bg-white border rounded shadow-xl z-50 p-3">
              {/* YEAR HEADER */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-semibold text-base cursor-pointer"
                  onClick={() => setShowYearList((prev) => !prev)}
                >
                  {calendarYear}
                </span>
              </div>

              {/* YEAR DROPDOWN */}
              {showYearList && (
                <div className="grid grid-cols-3 gap-2 mb-3 max-h-40 overflow-auto">
                  {years.map((yr) => (
                    <div
                      key={yr}
                      onClick={() => {
                        setCalendarYear(yr);
                        setSelectedYear(yr);
                        setSelectedMonth(null);
                        setShowYearList(false);
                        setPageNo(1);
                      }}
                      className={`p-2 text-center rounded cursor-pointer text-sm ${
                        selectedYear === yr
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {yr}
                    </div>
                  ))}
                </div>
              )}

              {/* MONTH GRID */}
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-auto">
                {months.map((m) => {
                  const isActive =
                    selectedYear === calendarYear && selectedMonth === m.num;

                  return (
                    <div
                      key={m.num}
                      onClick={() => {
                        if (isActive) {
                          setSelectedMonth(null);
                          setShowCalendar(false);
                          setShowYearList(false);
                          setPageNo(1);
                          return;
                        }

                        setSelectedYear(calendarYear);
                        setSelectedMonth(m.num);
                        setShowCalendar(false);
                        setShowYearList(false);
                        setPageNo(1);
                      }}
                      className={`p-2 text-center rounded cursor-pointer text-sm ${
                        isActive
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {m.short}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-center my-5">Trending Movies</h2>

      {/* Movies Grid */}
      <div className="flex flex-row flex-wrap justify-around gap-8">
        {paginatedMovies.map((m) => (
          <MoviesCard key={m.id} movie={m} />
        ))}
      </div>

      {/* Pagination */}
      <Pagenation
        handlePrev={handlePrev}
        handleNext={handleNext}
        pageNo={pageNo}
      />
    </div>
  );
}

export default Movies;
