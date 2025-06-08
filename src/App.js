import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import { routes } from './routes';
import './App.css'; // <-- nếu bạn chưa import CSS

function App() {
  return (
    <div className="app-wrapper">
      <Router>
        <Routes>
          {routes.map((route, idx) => {
            if (route.children) {
              return (
                <Route key={idx} path={route.path} element={route.element}>
                  {route.children.map((child, childIdx) => (
                    <Route
                      key={childIdx}
                      path={child.path}
                      element={child.element}
                    />
                  ))}
                </Route>
              );
            }
            return (
              <Route
                key={idx}
                path={route.path}
                element={
                  <>
                    <Navbar />
                    <main className="main-content">
                      {route.element}
                    </main>
                    <Footer />
                  </>
                }
              />
            );
          })}
        </Routes>
      </Router>
    </div>
  );
}

export default App;