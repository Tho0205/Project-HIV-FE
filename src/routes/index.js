import Home from "../pages/Home/Home";
import Blog from "../pages/Blog/Blog";
import BlogDetail from "../pages/Blog/BlogDetail";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Profile from "../pages/Profile/Profile";
import ManagerPatient from "../pages/Staff/ManagerPatient";
import Appointment from "../pages/Appointment/Appointment";
import ARV from "../pages/ARV/ARV";
import ARVProtocol from "../pages/ARVProtocol/ARVProtocol";
import HIVExaminationManagement from "../pages/Staff/HIVExaminationManagement";

export const routes = [
  { path: "/", element: <Home /> },
  { path: "/blog", element: <Blog /> },
  { path: "/blog/:id", element: <BlogDetail /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/Profile-Patient", element: <Profile /> },
  { path: "/Staff-ManagerPatient", element: <ManagerPatient /> },
  { path: "/appointment", element: <Appointment /> },
  { path: "/arv", element: <ARV /> },
  { path: "/arv-protocol", element: <ARVProtocol /> },
  { path: "/HIV-ExaminationManagement", element: <HIVExaminationManagement /> },
];
