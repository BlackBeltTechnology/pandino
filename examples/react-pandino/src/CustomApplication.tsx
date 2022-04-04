import {HashRouter, Route, Routes, Link} from "react-router-dom";
import {Home} from "./Home";
import {About} from "./About";

export function CustomApplication() {
  return (
      <HashRouter>
          <nav>
              <li>
                  <Link to="/">Home</Link>
              </li>
              <li>
                  <Link to="/about">About</Link>
              </li>
          </nav>
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />}/>
          </Routes>
      </HashRouter>
  );
}
