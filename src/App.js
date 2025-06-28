import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import { routes } from "./routes";
import FloatingChat from "./components/ChatBox/FloatingChat";
import LoadingOverlay from "./components/Loading/Loading";
import "./App.css";

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  const hideHeaderFooter = [
    "/login",
    "/register",
    "/Staff-ManagerPatient",
    "/Staff-Blog",
    "/arv",
    "/arv-protocol",
    "/HIV-ExaminationManagement",
    "/Admin-AccountManagement",
  ].includes(location.pathname);

  return (
    <div className="app-wrapper">
      <LoadingOverlay isLoading={loading} />

      {!hideHeaderFooter && <Navbar />}
      <main className="main-content">
        <Routes>
          {routes.map((route, idx) => (
            <Route key={idx} path={route.path} element={route.element} />
          ))}
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
      <ToastContainer />
      <FloatingChat />
    </div>
  );
}

export default App;
