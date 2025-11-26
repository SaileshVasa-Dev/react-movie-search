import React from "react";
import Logo from "../Images/Movielogo.png";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  // Detect which page is active
  const activePage = location.pathname;

  const linkBase = "text-2xl font-bold transition duration-200 cursor-pointer";
  const inactive = "text-gray-300 hover:text-white/90";
  const active = "text-white font-extrabold";

  return (
    <div className="flex items-center space-x-8 px-5 py-3 bg-black/40 backdrop-blur-lg border-b border-white/10">
      {/* Clickable Logo → Go to Movies */}
      <Link to="/" className="cursor-pointer">
        <img
          className="h-10 w-10 hover:opacity-80 transition"
          src={Logo}
          alt="Movies Logo"
        />
      </Link>

      {/* Movies Link */}
      <Link
        to="/"
        className={`${linkBase} ${activePage === "/" ? active : inactive}`}
      >
        Movies
      </Link>

      {/* Watchlist Link */}
      <Link
        to="/watchlist"
        className={`${linkBase} ${
          activePage === "/watchlist" ? active : inactive
        }`}
      >
        Watchlist
      </Link>
    </div>
  );
}

export default React.memo(Navbar);
