import { HashRouter, Route, Routes, Link } from "react-router-dom";

import { Dashboard } from "./Dashboard";
import { Pokemon } from "./Pokemon";

export function Application() {
    return (
        <HashRouter>
            <header className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
                <a className="navbar-brand col-md-3 col-lg-2 me-0 px-3" href="#">Pokédex</a>
                <button className="navbar-toggler position-absolute d-md-none collapsed" type="button"
                        data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu"
                        aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon" />
                </button>
            </header>
            <div className="container-fluid">
                <div className="row">
                    <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
                        <div className="position-sticky pt-3">
                            <ul className="nav flex-column">
                                <li className="nav-item">
                                    <Link to="/" className="nav-link">
                                        <i className="fa fa-home" /> Dashboard
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/pokemon" className="nav-link">
                                        <i className="fa fa-paw" /> Pokémon
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/pokemon" element={<Pokemon />}/>
                        </Routes>
                    </main>
                </div>
            </div>
        </HashRouter>
    );
}
