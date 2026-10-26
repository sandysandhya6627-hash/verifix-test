"use client";

import { ChangeEvent, useState } from "react";

type Check = { name: string; status: string; details: string };
type Report = {
  filename: string;
  size_bytes: number;
  sha256: string;
  overall: string;
  checks: Check[];
  limitations: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] || null);
    setReport(null);
    setError("");
  }

  async function verify() {
    if (!file) {
      setError("Choose a PDF or DOCX file first.");
      return;
    }
    if (!API_URL) {
      setError("The VeriFix API is not configured yet. Set NEXT_PUBLIC_API_URL to your deployed backend URL.");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch(`${API_URL}/api/verify`, { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof data.detail === "string" ? data.detail : "Verification request failed.";
        throw new Error(message);
      }
      setReport(data as Report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to VeriFix API. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <nav className="nav">
        <a className="brand" href="#"><span className="brandMark">V</span> VeriFix</a>
        <span className="navTag">DOCUMENT CHECKS · MVP</span>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span className="dot" /> DOCUMENT VERIFICATION WORKSPACE</div>
        <h1>Clarity for every<br /><span>document.</span></h1>
        <p className="lead">Run basic file checks and get a transparent report in seconds. Simple, explainable, and designed to grow.</p>
      </section>

      <section className="workspace">
        <div className="uploadCard">
          <div className="sectionHeading"><div><span className="step">01</span><h2>Upload a document</h2></div><span className="quiet">PDF or DOCX · Max 10 MB</span></div>
          <label className="dropZone">
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFile} />
            <span className="fileIcon">↥</span>
            <strong>{file ? file.name : "Choose a file to inspect"}</strong>
            <span className="quiet">{file ? `${(file.size / 1024).toFixed(1)} KB selected` : "Click here to browse your device"}</span>
          </label>
          <button className="primaryButton" onClick={verify} disabled={loading}>{loading ? "Checking document…" : "Run document checks"} <span>→</span></button>
          {error && <p className="error" role="alert">{error}</p>}
          <p className="privacyNote"><span>◇</span> This prototype processes the file in memory and does not save it permanently.</p>
        </div>

        <aside className="sideCard">
          <span className="sideIcon">✓</span>
          <h3>What gets checked?</h3>
          <ul>
            <li><span className="listTick">✓</span><span><b>File format</b><small>Basic signature or document structure</small></span></li>
            <li><span className="listTick">✓</span><span><b>File fingerprint</b><small>SHA-256 for comparing copies</small></span></li>
            <li><span className="listTick muted">i</span><span><b>Clear limitations</b><small>Know what the checks cannot prove</small></span></li>
          </ul>
          <div className="sideFoot">Built for transparent, explainable checks.</div>
        </aside>
      </section>

      {report && <section className="reportCard">
        <div className="sectionHeading"><div><span className="step">02</span><h2>Verification report</h2></div><span className={`statusPill ${report.overall === "format checks passed" ? "good" : "warn"}`}>{report.overall}</span></div>
        <div className="reportMeta"><div><small>FILE</small><b>{report.filename}</b></div><div><small>SIZE</small><b>{(report.size_bytes / 1024).toFixed(1)} KB</b></div></div>
        <div className="checks">{report.checks.map((check) => <div className="checkRow" key={check.name}><span className={`checkStatus ${check.status}`}>{check.status === "passed" ? "✓" : check.status === "failed" ? "!" : "i"}</span><div><b>{check.name}</b><p>{check.details}</p></div><span className="checkLabel">{check.status}</span></div>)}</div>
        <div className="fingerprint"><small>SHA-256 FINGERPRINT</small><code>{report.sha256}</code></div>
        <div className="limitations"><b>Important limitations</b><ul>{report.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>}

      <footer><span>VeriFix © College project prototype</span><span>Format checks are not proof of authenticity.</span></footer>
    </main>
  );
}
