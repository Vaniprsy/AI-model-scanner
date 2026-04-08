import { useState } from "react";
import { useNavigate } from "react-router";
import { Upload, FileCode, Database, Settings, Loader2, CheckCircle2, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Checkbox } from "../components/ui/checkbox";
import { scanModel, scanHuggingFace, scanApiEndpoint } from "../api/client";

const SCAN_STEPS = [
  "Analyzing model architecture...",
  "Checking for vulnerabilities...",
  "Running OWASP LLM checks...",
  "Scanning for sensitive data...",
  "Evaluating bias & fairness...",
  "Generating report...",
];

export function NewScan() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState(0);
  const [modelSource, setModelSource] = useState("upload");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modelName, setModelName] = useState("");
  const [hfModelId, setHfModelId] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanOptions, setScanOptions] = useState({
    dataLeakage: true,
    promptInjection: true,
    dependencies: true,
    bias: true,
    compliance: true,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const tickProgress = async () => {
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      setScanStep(i);
      setScanProgress(Math.round(((i + 1) / SCAN_STEPS.length) * 90));
    }
  };

  const handleScan = async () => {
    setError(null);
    setIsScanning(true);
    setScanProgress(0);
    setScanStep(0);

    // Run fake progress ticks in parallel with the real API call
    const progressPromise = tickProgress();

    try {
      let result;
      const resolvedModelName =
        modelName ||
        (modelSource === "huggingface" ? hfModelId : modelSource === "api" ? apiEndpoint : "custom-upload");

      if (modelSource === "upload") {
        const text = description || undefined;
        const file = selectedFiles[0] || undefined;
        result = await scanModel({
          modelName: resolvedModelName,
          file,
          text: !file ? text || "No content provided" : undefined,
          scanOptions,
        });
      } else if (modelSource === "huggingface") {
        if (!hfModelId.trim()) {
          setError("Please enter a HuggingFace model ID (e.g. bert-base-uncased)");
          setIsScanning(false);
          return;
        }
        result = await scanHuggingFace({
          modelId: hfModelId.trim(),
          modelName: resolvedModelName,
          scanOptions,
        });
      } else {
        if (!apiEndpoint.trim()) {
          setError("Please enter an API endpoint URL");
          setIsScanning(false);
          return;
        }
        result = await scanApiEndpoint({
          endpoint: apiEndpoint.trim(),
          modelName: resolvedModelName,
          scanOptions,
        });
      }

      await progressPromise;
      setScanProgress(100);

      setTimeout(() => {
        navigate(`/report/${result.id}`);
      }, 600);
    } catch (e: any) {
      setIsScanning(false);
      setError(e.message || "Scan failed. Make sure the backend is running on http://localhost:8000");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">New Model Scan</h2>
        <p className="text-slate-400">Upload or connect your AI/ML model for security analysis</p>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertCircle className="size-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isScanning ? (
        <div className="space-y-6">
          {/* Model Source Selection */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Model Source</CardTitle>
              <CardDescription>Choose how you want to provide your model</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={modelSource} onValueChange={setModelSource}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <RadioGroupItem value="upload" id="upload" />
                    <Label htmlFor="upload" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Upload className="size-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-white">Upload Model File</div>
                        <div className="text-sm text-slate-400">Upload model files, configs, or paste text content</div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <RadioGroupItem value="huggingface" id="huggingface" />
                    <Label htmlFor="huggingface" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Database className="size-5 text-purple-500" />
                      <div>
                        <div className="font-medium text-white">Hugging Face Model Hub</div>
                        <div className="text-sm text-slate-400">Scan any public model from HuggingFace</div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <RadioGroupItem value="api" id="api" />
                    <Label htmlFor="api" className="flex items-center gap-3 cursor-pointer flex-1">
                      <FileCode className="size-5 text-green-500" />
                      <div>
                        <div className="font-medium text-white">API Endpoint</div>
                        <div className="text-sm text-slate-400">Connect to a model via API endpoint</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Model Details */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Model Details</CardTitle>
              <CardDescription>Provide information about your model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {modelSource === "upload" && (
                <div className="space-y-2">
                  <Label className="text-white">Model Files</Label>
                  <label htmlFor="file" className="block">
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-slate-600 transition-colors cursor-pointer">
                      <Upload className="size-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">Drop your model files here or click to browse</p>
                      <p className="text-sm text-slate-500">Supports .h5, .pkl, .pt, .onnx, .safetensors and more</p>
                    </div>
                  </label>
                  <Input
                    id="file"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    accept=".h5,.pkl,.pt,.pth,.onnx,.safetensors,.pb,.tflite,.ckpt,.bin,.txt,.json,.yaml,.yml"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-white">Selected Files:</p>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-3">
                            <FileCode className="size-4 text-blue-400" />
                            <div>
                              <p className="text-sm text-white">{file.name}</p>
                              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <button onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {modelSource === "huggingface" && (
                <div className="space-y-2">
                  <Label htmlFor="hf-model" className="text-white">Model ID</Label>
                  <Input
                    id="hf-model"
                    value={hfModelId}
                    onChange={(e) => setHfModelId(e.target.value)}
                    placeholder="e.g., bert-base-uncased, gpt2, mistralai/Mistral-7B-v0.1"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500">Enter the exact model ID from huggingface.co/models</p>
                </div>
              )}

              {modelSource === "api" && (
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint" className="text-white">API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="https://api.example.com/model"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="model-name" className="text-white">Model Name</Label>
                <Input
                  id="model-name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Enter a descriptive name for your model"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  {modelSource === "upload" && selectedFiles.length === 0
                    ? "Paste model content / config to scan"
                    : "Description (Optional)"}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    modelSource === "upload" && selectedFiles.length === 0
                      ? "Paste your model config, prompt templates, or any text to scan for vulnerabilities..."
                      : "Describe the model's purpose, training data, and use case"
                  }
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Scan Options */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="size-5" />
                Scan Configuration
              </CardTitle>
              <CardDescription>Select security checks to perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "dataLeakage", label: "Data Leakage Detection", desc: "Identifies sensitive data exposure in training data or outputs" },
                { key: "promptInjection", label: "Prompt Injection Vulnerability", desc: "Tests for susceptibility to prompt injection attacks (OWASP LLM01)" },
                { key: "dependencies", label: "Insecure Dependencies", desc: "Scans for vulnerable packages and outdated dependencies" },
                { key: "bias", label: "Bias & Fairness Analysis", desc: "Evaluates model for potential bias and fairness issues" },
                { key: "compliance", label: "Compliance Checks", desc: "Verifies compliance with GDPR, AI Act, and other regulations" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start space-x-3">
                  <Checkbox
                    id={key}
                    checked={scanOptions[key as keyof typeof scanOptions]}
                    onCheckedChange={(checked) =>
                      setScanOptions({ ...scanOptions, [key]: checked as boolean })
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor={key} className="text-white font-medium cursor-pointer">{label}</Label>
                    <p className="text-sm text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button onClick={handleScan} className="bg-blue-600 hover:bg-blue-700">
              Start Scan
            </Button>
          </div>
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="inline-block">
                {scanProgress < 100 ? (
                  <Loader2 className="size-16 text-blue-500 animate-spin mx-auto" />
                ) : (
                  <CheckCircle2 className="size-16 text-green-500 mx-auto" />
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {scanProgress < 100 ? "Scanning Model..." : "Scan Complete!"}
                </h3>
                <p className="text-slate-400">
                  {scanProgress < 100 ? SCAN_STEPS[scanStep] : "Redirecting to report..."}
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-500 mt-2">{scanProgress}% Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
