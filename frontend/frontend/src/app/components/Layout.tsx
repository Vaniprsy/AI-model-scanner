import { Outlet, Link, useLocation } from "react-router";
import { Shield, ScanLine, FileBarChart, Github, Zap } from "lucide-react";

export function Layout() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-slate-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-all group-hover:scale-105">
                <Shield className="size-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-white text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Model Scanner</h1>
                  <Zap className="size-4 text-yellow-500" />
                </div>
                <p className="text-xs text-slate-400 font-medium">AI Security & Risk Detection</p>
              </div>
            </Link>
            
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/") && location.pathname === "/"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileBarChart className="size-4" />
                  Dashboard
                </div>
              </Link>
              <Link
                to="/scan"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/scan")
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ScanLine className="size-4" />
                  New Scan
                </div>
              </Link>
              <a
                href="https://genai.owasp.org/llm-top-10/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all border border-slate-700/50 hover:border-slate-600"
              >
                <div className="flex items-center gap-2">
                  <Github className="size-4" />
                  OWASP LLM Top 10
                </div>
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}