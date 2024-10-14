import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactGA from "react-ga4";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import CenterLayout from "./layouts/CenterLayout.tsx";
import Error404 from "./pages/Error404.tsx";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";

import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./index.css";

ReactGA.initialize(import.meta.env.VITE_GA_ID);

const router = createBrowserRouter([
  {
    path: "/",
    element: <CenterLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />,
      },
    ],
  },
  {
    path: "*",
    element: <Error404 />,
  },
]);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
