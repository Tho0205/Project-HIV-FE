import Home from "../pages/Home/Home";
import Blog from "../pages/Blog/Blog";
import BlogDetail from "../pages/Blog/BlogDetail";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Profile from "../pages/Profile/Profile";
import ManagerPatient from "../pages/Staff/ManagerPatient";
import ARVPage from "../pages/ARV/ARVPage";
import ARVProtocol from "../pages/ARVProtocol/ARVProtocol"; 

export const routes = [
  { path: "/", element: <Home /> },
  { path: "/blog", element: <Blog /> },
  { path: "/blog/:id", element: <BlogDetail /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/Profile-Patient", element: <Profile /> },
  { path: "/Staff-ManagerPatient", element: <ManagerPatient /> },
  { path: "/arv", element: <ARVPage /> },
  { path:"/arv-protocol", element: <ARVProtocol />},
];
