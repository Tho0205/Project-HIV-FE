import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import { routes } from "./routes";
import "./App.css"; // <-- nếu bạn chưa import CSS

function App() {
  const location = useLocation();
  const hideHeaderFooter = [
    "/login",
    "/register",
    "/Staff-ManagerPatient",
    "/arv",
    "/arv-protocol",
  ].includes(location.pathname);

  return (
    <div className="app-wrapper">
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
    </div>
  );
}

export default App;
