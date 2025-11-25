import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const WatchListContext = createContext(null);

export const useWatchList = () => {
  const ctx = useContext(WatchListContext);
  if (!ctx) {
    throw new Error("useWatchList must be used within a WatchListProvider");
  }
  return ctx;
};

export const WatchListProvider = ({ children }) => {
  const [watchList, setWatchList] = useState([]);

  // Load from localStorage once
  useEffect(() => {
    const moviesFromLocal = localStorage.getItem("MoviesApp");
    if (moviesFromLocal) {
      try {
        setWatchList(JSON.parse(moviesFromLocal));
      } catch {
        // corrupt local storage – ignore
        setWatchList([]);
      }
    }
  }, []);

  // Persist to localStorage on any change
  useEffect(() => {
    localStorage.setItem("MoviesApp", JSON.stringify(watchList));
  }, [watchList]);

  const handleAddtoWatchList = useCallback((movie) => {
    setWatchList((prev) => {
      const alreadyExists = prev.some((m) => m.id === movie.id);
      if (alreadyExists) return prev;
      return [...prev, movie];
    });
  }, []);

  const handleRemovefromWatchList = useCallback((movie) => {
    setWatchList((prev) => prev.filter((m) => m.id !== movie.id));
  }, []);

  const value = useMemo(
    () => ({
      watchList,
      handleAddtoWatchList,
      handleRemovefromWatchList,
    }),
    [watchList, handleAddtoWatchList, handleRemovefromWatchList]
  );

  return (
    <WatchListContext.Provider value={value}>
      {children}
    </WatchListContext.Provider>
  );
};
