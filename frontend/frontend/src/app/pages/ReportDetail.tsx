import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  AlertTriangle, Shield, CheckCircle2, XCircle, Info, Download, Share2,
  ArrowLeft, Database, Zap, FileWarning, TrendingUp, Check, Copy, Loader2,
  ChevronDown, ChevronUp, Eye, Crosshair, HelpCircle, Wrench, Play, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { getReport, type ScanResult, type Issue } from "../api/client";

// ─── helpers ────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/30" :
    severity === "High"     ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
    severity === "Medium"   ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                              "bg-green-500/10 text-green-400 border-green-500/30";
  return <Badge className={cls}>{severity}</Badge>;
}

function SeverityIcon({ severity, className = "size-5" }: { severity: string; className?: string }) {
  if (severity === "Critical") return <XCircle className={`${className} text-red-500`} />;
  if (severity === "High")     return <AlertTriangle className={`${className} text-orange-500`} />;
  if (severity === "Medium")   return <Info className={`${className} text-yellow-500`} />;
  return <CheckCircle2 className={`${className} text-green-500`} />;
}

function ConfidencePip({ value }: { value: number }) {
  const color = value >= 85 ? "text-red-400" : value >= 70 ? "text-orange-400" : "text-yellow-400";
  return (
    <span className={`text-xs font-mono font-semibold ${color}`}>
      {value}% confidence
    </span>
  );
}

// ─── VulnerabilityCard ───────────────────────────────────────────────────────

function VulnerabilityCard({ vuln, index }: { vuln: Issue; index: number }) {
  const [expanded, setExpanded] = useState(index === 0); // first one open by default
  const [fixApplied, setFixApplied] = useState(false);
  const [showFixed, setShowFixed] = useState(false);

  const handleApplyFix = () => {
    setFixApplied(true);
    setShowFixed(true);
    toast.success("Fix simulation applied! Showing patched response.");
  };

  const handleReset = () => {
    setFixApplied(false);
    setShowFixed(false);
    toast("Fix simulation reset.");
  };

  const severityIconBg =
    vuln.severity === "Critical" ? "bg-red-500/20 text-red-400" :
    vuln.severity === "High"     ? "bg-orange-500/20 text-orange-400" :
    vuln.severity === "Medium"   ? "bg-yellow-500/20 text-yellow-400" :
                                   "bg-green-500/20 text-green-400";

  const borderColor =
    vuln.severity === "Critical" ? "border-red-500/20 hover:border-red-500/40" :
    vuln.severity === "High"     ? "border-orange-500/20 hover:border-orange-500/40" :
    vuln.severity === "Medium"   ? "border-yellow-500/20 hover:border-yellow-500/40" :
                                   "border-green-500/20 hover:border-green-500/40";

  return (
    <div className={`rounded-xl border ${borderColor} bg-slate-900/80 overflow-hidden transition-all`}>
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${severityIconBg}`}>
          <Zap className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-bold text-white">{vuln.title}</span>
            <SeverityBadge severity={vuln.severity} />
            {vuln.confidence != null && <ConfidencePip value={vuln.confidence} />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {vuln.owasp && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                ⊙ {vuln.owasp} — {vuln.type}
              </span>
            )}
            {vuln.cvss != null && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                CVSS {vuln.cvss}
              </span>
            )}
            {fixApplied && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400">
                ✓ Fix Applied
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-slate-500">
          {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-800 divide-y divide-slate-800/60">

          {/* Attacker Perspective */}
          {vuln.attacker_perspective && (
            <div className="p-5 bg-red-950/20">
              <div className="flex items-center gap-2 mb-2">
                <Crosshair className="size-4 text-red-400" />
                <span className="text-xs font-bold tracking-widest text-red-400 uppercase">Attacker Perspective</span>
              </div>
              <p className="text-sm text-slate-300">{vuln.attacker_perspective}</p>
            </div>
          )}

          {/* Attack Prompt + Model Response */}
          {(vuln.attack_prompt || vuln.simulated_response) && (
            <div className="p-5 space-y-4">
              {vuln.attack_prompt && (
                <div>
                  <span className="text-xs font-bold tracking-widest text-slate-500 uppercase block mb-2">Attack Prompt</span>
                  <div className="font-mono text-sm text-slate-200 bg-slate-950 border border-slate-700 rounded-lg p-4 leading-relaxed">
                    {vuln.attack_prompt}
                  </div>
                </div>
              )}

              {vuln.simulated_response && !showFixed && (
                <div>
                  <span className="text-xs font-bold tracking-widest text-slate-500 uppercase block mb-2">Model Response</span>
                  <div className="font-mono text-sm text-red-300 bg-red-950/30 border border-red-500/20 rounded-lg p-4 leading-relaxed">
                    {vuln.simulated_response}
                  </div>
                </div>
              )}

              {showFixed && vuln.fixed_response && (
                <div>
                  <span className="text-xs font-bold tracking-widest text-green-500 uppercase block mb-2">✓ Patched Model Response</span>
                  <div className="font-mono text-sm text-green-300 bg-green-950/30 border border-green-500/20 rounded-lg p-4 leading-relaxed">
                    {vuln.fixed_response}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Why This Is A Problem */}
          {vuln.why_problem && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="size-4 text-orange-400" />
                <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">Why This Is A Problem</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{vuln.why_problem}</p>
            </div>
          )}

          {/* Fix Recommendation */}
          {vuln.fix_recommendation && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="size-4 text-blue-400" />
                <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Fix Recommendation</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{vuln.fix_recommendation}</p>
            </div>
          )}

          {/* Affected component + Impact */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {vuln.affected && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="size-4 text-purple-400" />
                  <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Affected Component</span>
                </div>
                <p className="text-sm text-slate-400">{vuln.affected}</p>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-yellow-400" />
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Impact</span>
              </div>
              <p className="text-sm text-slate-400">{vuln.impact}</p>
            </div>
          </div>

          {/* Apply Fix Simulation button */}
          {vuln.fixed_response && (
            <div className="p-5 bg-slate-800/30 flex items-center gap-3">
              {!fixApplied ? (
                <Button
                  onClick={handleApplyFix}
                  className="bg-green-600 hover:bg-green-500 text-white gap-2 shadow-lg shadow-green-500/20"
                >
                  <Play className="size-4" />
                  Apply Fix Simulation
                </Button>
              ) : (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
                >
                  <RotateCcw className="size-4" />
                  Reset Simulation
                </Button>
              )}
              <span className="text-xs text-slate-500">
                {fixApplied
                  ? "Showing patched model response above"
                  : "Simulate the model's response after the fix is applied"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ReportDetail ────────────────────────────────────────────────────────────

export function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getReport(id)
      .then(setReport)
      .catch((e) => setError(e.message || "Failed to load report"))
      .finally(() => setLoading(false));
  }, [id]);

  const shareUrl = `${window.location.origin}/report/${id}`;

  const handleExportReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `model-security-report-${id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully!");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy link"); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Model Security Report", url: shareUrl })
        .then(() => toast.success("Shared!"))
        .catch((err) => { if (err.name !== "AbortError") setShareDialogOpen(true); });
    } else {
      setShareDialogOpen(true);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-10 text-blue-500 animate-spin" />
    </div>
  );

  if (error || !report) return (
    <div className="space-y-4">
      <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="py-12 text-center">
          <XCircle className="size-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error || "Report not found"}</p>
          <p className="text-slate-500 text-sm mt-2">Make sure the backend is running and this scan ID exists.</p>
        </CardContent>
      </Card>
    </div>
  );

  const vulns = report.vulnerabilities;
  const riskColorBorder = report.severity === "Critical" ? "border-red-500" : report.severity === "High" ? "border-orange-500" : report.severity === "Medium" ? "border-yellow-500" : "border-green-500";
  const riskColorText = report.severity === "Critical" ? "text-red-500" : report.severity === "High" ? "text-orange-500" : report.severity === "Medium" ? "text-yellow-500" : "text-green-500";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 w-fit">
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Security Scan Report</h2>
          <p className="text-slate-400">{report.model_name} • Scanned on {report.scan_date}</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={handleShare}>
            <Share2 className="size-4 mr-2" /> Share
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportReport}>
            <Download className="size-4 mr-2" /> Export
          </Button>
        </div>
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Share Report</DialogTitle>
              <DialogDescription className="text-slate-400">Share this security report with your team</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="bg-slate-800 border-slate-700 text-white" />
                <Button onClick={handleCopyLink} className="bg-blue-600 hover:bg-blue-700 flex-shrink-0">
                  {copied ? <><Check className="size-4 mr-2" />Copied</> : <><Copy className="size-4 mr-2" />Copy</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Risk Score + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-2 ${riskColorBorder} lg:col-span-1`}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${riskColorBorder} bg-slate-900`}>
                <div className={`text-5xl font-bold ${riskColorText}`}>{report.risk_score}</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Overall Risk Score</h3>
                <SeverityBadge severity={report.severity} />
              </div>
              <p className="text-sm text-slate-400">{report.summary}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Security Posture</CardTitle>
            <CardDescription>Multi-dimensional risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={report.security_metrics}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vuln Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Critical", count: vulns.critical, color: "text-red-500", icon: <XCircle className="size-10 text-red-500" /> },
          { label: "High",     count: vulns.high,     color: "text-orange-500", icon: <AlertTriangle className="size-10 text-orange-500" /> },
          { label: "Medium",   count: vulns.medium,   color: "text-yellow-500", icon: <Info className="size-10 text-yellow-500" /> },
          { label: "Low",      count: vulns.low,      color: "text-green-500",  icon: <CheckCircle2 className="size-10 text-green-500" /> },
        ].map(({ label, count, color, icon }) => (
          <Card key={label} className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{count}</p>
                </div>
                {icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vulnerabilities" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="vulnerabilities" className="data-[state=active]:bg-slate-800">
            <Shield className="size-4 mr-2" />
            Vulnerabilities Detected ({report.issues.length})
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-slate-800">
            <FileWarning className="size-4 mr-2" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-slate-800">
            <TrendingUp className="size-4 mr-2" /> Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Vulnerabilities Tab */}
        <TabsContent value="vulnerabilities" className="space-y-3">
          {report.issues.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="size-12 text-green-500 mx-auto mb-4" />
                <p className="text-white text-lg font-semibold">No vulnerabilities detected</p>
                <p className="text-slate-400 text-sm mt-2">This model passed all configured security checks.</p>
              </CardContent>
            </Card>
          ) : (
            report.issues.map((vuln, i) => (
              <VulnerabilityCard key={vuln.id} vuln={vuln} index={i} />
            ))
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Compliance Status</CardTitle>
              <CardDescription>Regulatory and best practice compliance checks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.compliance_checks.map((check, index) => (
                <div key={index} className="flex items-start justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/30">
                  <div className="flex items-start gap-3 flex-1">
                    {check.status === "pass" ? <CheckCircle2 className="size-5 text-green-500 mt-0.5 flex-shrink-0" /> :
                     check.status === "fail" ? <XCircle className="size-5 text-red-500 mt-0.5 flex-shrink-0" /> :
                     <AlertTriangle className="size-5 text-yellow-500 mt-0.5 flex-shrink-0" />}
                    <div>
                      <h4 className="font-semibold text-white mb-1">{check.name}</h4>
                      <p className="text-sm text-slate-400">{check.details}</p>
                    </div>
                  </div>
                  <Badge className={
                    check.status === "pass" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                    check.status === "fail" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                  }>
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {report.recommendations.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="size-12 text-green-500 mx-auto mb-4" />
                <p className="text-white">No critical recommendations — model looks clean!</p>
              </CardContent>
            </Card>
          ) : report.recommendations.map((rec, index) => (
            <Card key={index} className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <SeverityBadge severity={rec.priority} />
                  <Badge variant="outline" className="border-slate-700 text-slate-400">Effort: {rec.effort}</Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-400">Impact: {rec.impact}</Badge>
                </div>
                <CardTitle className="text-white">{rec.action}</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-semibold text-white mb-3">Implementation Steps:</h4>
                <ol className="space-y-2">
                  {rec.steps.map((step, si) => (
                    <li key={si} className="flex items-start gap-3 text-sm text-slate-400">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex-shrink-0">{si + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
