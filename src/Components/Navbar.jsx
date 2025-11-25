import React from "react";
import Logo from "../Images/Movielogo.png";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="flex border h-[50px] items-center space-x-8 pl-3 py-4">
      <img className="w-10" src={Logo} alt="Movies Logo" />
      <Link to="/" className="text-blue-500 text-2xl font-bold">
        Movies
      </Link>
      <Link to="/watchlist" className="text-blue-500 text-2xl font-bold">
        Watchlist
      </Link>
    </div>
  );
}

export default React.memo(Navbar);
