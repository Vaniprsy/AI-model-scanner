const BASE_URL = "http://localhost:8000/api";

export interface Issue {
  id: string;
  type: string;
  severity: string;
  category: string;
  owasp?: string;
  cve?: string;
  cvss?: number;
  confidence?: number;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  affected?: string;
  // New attacker-perspective fields
  attacker_perspective?: string;
  attack_prompt?: string;
  simulated_response?: string;
  why_problem?: string;
  fix_recommendation?: string;
  fixed_response?: string;
  fix_applied?: boolean;
}

export interface ComplianceCheck {
  name: string;
  status: "pass" | "fail" | "warning";
  details: string;
}

export interface Recommendation {
  priority: string;
  action: string;
  effort: string;
  impact: string;
  steps: string[];
}

export interface ScanResult {
  id: string;
  model_name: string;
  scan_date: string;
  risk_score: number;
  severity: string;
  status: string;
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  issues: Issue[];
  categories: Record<string, Issue[]>;
  security_metrics: { metric: string; score: number; fullMark: number }[];
  compliance_checks: ComplianceCheck[];
  recommendations: Recommendation[];
  summary: string;
}

export interface ReportSummary {
  id: string;
  model_name: string;
  scan_date: string;
  risk_score: number;
  status: string;
  vulnerabilities: ScanResult["vulnerabilities"];
}

export async function scanModel(params: {
  modelName: string;
  file?: File;
  text?: string;
  scanOptions: Record<string, boolean>;
}): Promise<ScanResult> {
  const form = new FormData();
  form.append("model_name", params.modelName);
  form.append("scan_options_json", JSON.stringify(params.scanOptions));
  if (params.file) form.append("file", params.file);
  else if (params.text) form.append("text", params.text);
  const res = await fetch(`${BASE_URL}/scan`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Scan failed: ${res.statusText}`);
  return res.json();
}

export async function scanHuggingFace(params: {
  modelId: string;
  modelName?: string;
  scanOptions: Record<string, boolean>;
}): Promise<ScanResult> {
  const res = await fetch(`${BASE_URL}/analyze/huggingface`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_id: params.modelId, model_name: params.modelName || params.modelId, scan_options: params.scanOptions }),
  });
  if (!res.ok) throw new Error(`HuggingFace scan failed: ${res.statusText}`);
  return res.json();
}

export async function scanApiEndpoint(params: {
  endpoint: string;
  modelName?: string;
  scanOptions: Record<string, boolean>;
}): Promise<ScanResult> {
  const res = await fetch(`${BASE_URL}/analyze/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: params.endpoint, model_name: params.modelName || params.endpoint, scan_options: params.scanOptions }),
  });
  if (!res.ok) throw new Error(`API scan failed: ${res.statusText}`);
  return res.json();
}

export async function getReport(scanId: string): Promise<ScanResult> {
  const res = await fetch(`${BASE_URL}/report/${scanId}`);
  if (!res.ok) throw new Error(`Report not found: ${res.statusText}`);
  return res.json();
}

export async function listReports(): Promise<ReportSummary[]> {
  const res = await fetch(`${BASE_URL}/reports`);
  if (!res.ok) throw new Error(`Failed to load reports: ${res.statusText}`);
  return res.json();
}
