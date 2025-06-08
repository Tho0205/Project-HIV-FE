import Home from "../pages/Home/Home";
import Blog from "../pages/Blog/Blog";
import BlogDetail from "../pages/Blog/BlogDetail";


export const routes = [
  { path: "/", element: <Home /> },
  {path : "/blog", element: <Blog /> },
  { path: "/blog/:id", element: <BlogDetail /> },
];
