import "./App.css";
import Navbar from "./Components/Navbar";
import Movies from "./Components/Movies";
import Banner from "./Components/Banner";
import Watchlist from "./Components/Watchlist";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WatchListProvider } from "./Context/WatchListContext";

function App() {
  return (
    <WatchListProvider>
      <BrowserRouter>
        <div>
          <Navbar />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Banner />
                  <Movies />
                </>
              }
            />
            <Route path="/watchlist" element={<Watchlist />} />
          </Routes>
        </div>
      </BrowserRouter>
    </WatchListProvider>
  );
}

export default App;
