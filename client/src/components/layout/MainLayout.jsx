import { Outlet } from "react-router-dom";
import Navbar  from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

/**
 * MainLayout — Shell for all authenticated pages.
 * Renders Sidebar (left) + Navbar (top) + page content (right).
 */
const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
