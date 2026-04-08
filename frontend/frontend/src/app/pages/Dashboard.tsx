import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, Shield, Activity, TrendingUp, TrendingDown, Clock, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { listReports, type ReportSummary } from "../api/client";

const STATUS_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

export function Dashboard() {
  const [scans, setScans] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReports();
      setScans(data);
    } catch (e: any) {
      setError(e.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const totalVulnerabilities = scans.reduce(
    (acc, s) =>
      acc +
      (s.vulnerabilities?.critical || 0) +
      (s.vulnerabilities?.high || 0) +
      (s.vulnerabilities?.medium || 0) +
      (s.vulnerabilities?.low || 0),
    0
  );

  const avgRiskScore =
    scans.length > 0
      ? Math.round(scans.reduce((acc, s) => acc + (s.risk_score || 0), 0) / scans.length)
      : 0;

  const criticalCount = scans.filter((s) => s.status === "Critical").length;

  const riskDistribution = ["Critical", "High", "Medium", "Low"].map((level) => ({
    name: level,
    value: scans.filter((s) => s.status === level).length,
    color: STATUS_COLORS[level],
  }));

  // Build weekly activity from scan_dates
  const weeklyMap: Record<string, { scans: number; issues: number }> = {};
  scans.forEach((s) => {
    const day = s.scan_date ? new Date(s.scan_date).toLocaleDateString("en", { weekday: "short" }) : "?";
    if (!weeklyMap[day]) weeklyMap[day] = { scans: 0, issues: 0 };
    weeklyMap[day].scans += 1;
    weeklyMap[day].issues +=
      (s.vulnerabilities?.critical || 0) +
      (s.vulnerabilities?.high || 0) +
      (s.vulnerabilities?.medium || 0) +
      (s.vulnerabilities?.low || 0);
  });
  const weeklyScans = Object.entries(weeklyMap).map(([day, v]) => ({ day, ...v }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl opacity-30 rounded-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Security Dashboard
              </h2>
              <Sparkles className="size-6 text-yellow-500 animate-pulse" />
            </div>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={fetchScans}
              disabled={loading}
            >
              <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <p className="text-slate-300 text-lg">Overview of your AI/ML model security posture</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="size-4" />
              <strong>Backend not reachable:</strong> {error}. Make sure the FastAPI server is running on{" "}
              <code className="bg-red-500/20 px-1 rounded">http://localhost:8000</code>.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/20 transition-all hover:scale-105 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-300">Total Scans</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold text-white">{loading ? "—" : scans.length}</div>
              <Activity className="size-10 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <TrendingUp className="size-3 text-green-400" />
              <span className="text-green-400 font-semibold">Live from backend</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-orange-500/20 transition-all hover:scale-105 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Risk Score</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                {loading ? "—" : avgRiskScore}
              </div>
              <AlertTriangle className="size-10 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <TrendingDown className="size-3 text-green-400" />
              <span className="text-green-400 font-semibold">Across all models</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/20 transition-all hover:scale-105 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-300">Total Vulnerabilities</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold text-white">{loading ? "—" : totalVulnerabilities}</div>
              <Shield className="size-10 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xs text-slate-400 mt-2">Across all models</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/30 transition-all hover:scale-105 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-300">Critical Models</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                {loading ? "—" : criticalCount}
              </div>
              <AlertTriangle className="size-10 text-red-400 group-hover:scale-110 group-hover:animate-pulse transition-transform" />
            </div>
            <p className="text-xs text-red-400 mt-2 font-semibold">
              {criticalCount > 0 ? "⚡ Requires immediate action" : "✓ No critical issues"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              Risk Distribution
            </CardTitle>
            <CardDescription className="text-slate-300">Models by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            {scans.length === 0 && !loading ? (
              <div className="h-[250px] flex items-center justify-center text-slate-500">
                No scans yet — run your first scan!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              Scan Activity
            </CardTitle>
            <CardDescription className="text-slate-300">Scans and issues detected</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyScans.length === 0 && !loading ? (
              <div className="h-[250px] flex items-center justify-center text-slate-500">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyScans}>
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Bar dataKey="scans" fill="#3b82f6" name="Scans" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="issues" fill="#ef4444" name="Issues" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full" />
              Recent Scans
            </CardTitle>
            <CardDescription className="text-slate-300 mt-1">Latest model security assessments</CardDescription>
          </div>
          <Link to="/scan">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105">
              <Sparkles className="size-4 mr-2" />
              New Scan
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="relative z-10">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : scans.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Shield className="size-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No scans yet.</p>
              <p className="text-sm mt-1">
                <Link to="/scan" className="text-blue-400 hover:underline">Run your first scan</Link> to see results here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scans.map((scan) => (
                <Link
                  key={scan.id}
                  to={`/report/${scan.id}`}
                  className="block p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${
                              scan.status === "Critical"
                                ? "bg-red-500 shadow-red-500/50"
                                : scan.status === "High"
                                ? "bg-orange-500 shadow-orange-500/50"
                                : scan.status === "Medium"
                                ? "bg-yellow-500 shadow-yellow-500/50"
                                : "bg-green-500 shadow-green-500/50"
                            }`}
                          />
                          <div>
                            <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">
                              {scan.model_name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                              <Clock className="size-3.5" />
                              {scan.scan_date}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              {scan.risk_score}
                            </div>
                            <div className="text-xs text-slate-400 font-semibold">Risk Score</div>
                          </div>
                          <Badge
                            className={
                              scan.status === "Critical"
                                ? "bg-red-500/20 text-red-400 border-red-500/50 px-3 py-1"
                                : scan.status === "High"
                                ? "bg-orange-500/20 text-orange-400 border-orange-500/50 px-3 py-1"
                                : scan.status === "Medium"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 px-3 py-1"
                                : "bg-green-500/20 text-green-400 border-green-500/50 px-3 py-1"
                            }
                          >
                            {scan.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm font-semibold flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          Critical: {scan.vulnerabilities?.critical ?? 0}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          High: {scan.vulnerabilities?.high ?? 0}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          Medium: {scan.vulnerabilities?.medium ?? 0}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Low: {scan.vulnerabilities?.low ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
