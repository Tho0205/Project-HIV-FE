import Home from "../pages/Home/Home";
import Blog from "../pages/Blog/Blog";
import BlogDetail from "../pages/Blog/BlogDetail";
import StaffLayout from "../components/StaffLayout/StaffLayout";
import TestResults from "../pages/Staff/TestResults/TestResults";

export const routes = [
  { path: "/", element: <Home /> },
  {path : "/blog", element: <Blog /> },
  { path: "/blog/:id", element: <BlogDetail /> },
  {
    path: "/staff",
    element: <StaffLayout />,
    children: [
      { path: "test-results", element: <TestResults /> },
      // Thêm các route khác cho staff ở đây
      // { path: "appointments", element: <Appointments /> },
      // { path: "patients", element: <Patients /> },
      // { path: "help", element: <Help /> },
    ]
  }
];
