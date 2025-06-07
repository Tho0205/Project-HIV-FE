import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import { routes } from './routes';
import './App.css'; // <-- nếu bạn chưa import CSS

function App() {
  return (
    <div className="app-wrapper">
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            {routes.map((route, idx) => (
              <Route key={idx} path={route.path} element={route.element} />
            ))}
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
