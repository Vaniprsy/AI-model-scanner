import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { NewScan } from "./pages/NewScan";
import { ReportDetail } from "./pages/ReportDetail";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "scan", Component: NewScan },
      { path: "report/:id", Component: ReportDetail },
    ],
  },
]);
