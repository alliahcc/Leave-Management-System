// src/pages/EmployeeApplyLeave.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/employee.css";

const STEPS = ["Type", "Details", "Review"];

// ✅ Values aligned with backend schema
const OPTIONS = [
  { label: "Vacation leave", value: "vacation" },
  { label: "Sick leave", value: "sick" },
  { label: "Emergency leave", value: "personal" },
  { label: "Other leave", value: "other" },
];

export default function ApplyLeavePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [leaveType, setLeaveType] = useState("vacation"); // ✅ default aligned
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function next() {
    setError("");
    if (step === 1) {
      if (!startDate || !endDate || !reason.trim()) {
        setError("Please fill in dates and reason.");
        return;
      }
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e < s) {
        setError("End date must be on or after start date.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setError("");
    setLoading(true);
    const token = localStorage.getItem("token");
    const finalReason = urgent ? `[URGENT] ${reason.trim()}` : reason.trim();

    if (!startDate || !endDate || !reason.trim()) {
      setError("Please fill in all fields before submitting.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/v1/employee/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveType,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          reason: finalReason,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not submit leave request");
      }

      // Save new leave for dashboard
      localStorage.setItem("newLeave", JSON.stringify(data.leave));

      navigate("/employee/dashboard");
    } catch (e) {
      setError(e.message || "Could not submit leave request");
    } finally {
      setLoading(false);
    }
  }

  const selected = OPTIONS.find((o) => o.value === leaveType);

  return (
    <div className="page apply-page">
      <div className="page-intro apply-header">
        <h1>Apply for leave</h1>
        <div className="stepper">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
            >
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Back to Dashboard button */}
      <div className="apply-actions" style={{ marginBottom: "20px" }}>
        <Link to="/employee/dashboard" className="btn btn-ghost">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Step 0: Type */}
      {step === 0 && (
        <section className="apply-section">
          <h2>Select leave type</h2>
          <p className="muted">Choose the type that matches your Leave schema.</p>
          <div className="option-list">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`option-card ${leaveType === opt.value ? "selected" : ""}`}
                onClick={() => setLeaveType(opt.value)}
              >
                <strong>{opt.label}</strong>
                <span className="muted small">{opt.value}</span>
              </button>
            ))}
          </div>
          <div className="apply-actions">
            <button type="button" className="btn btn-dark" onClick={next}>
              Continue
            </button>
          </div>
        </section>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <section className="apply-section">
          <h2>Leave details</h2>
          <div className="form-row">
            <label className="field">
              <span>Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span>End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>Reason</span>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for your leave…"
            />
          </label>
          <label className="urgent-toggle">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            <span>
              <strong>Mark as urgent</strong>
              <span className="muted small"> Prepends [URGENT] to the reason stored in the database.</span>
            </span>
          </label>
          {error ? <p className="error-msg">{error}</p> : null}
          <div className="apply-actions">
            <button type="button" className="btn btn-ghost" onClick={back}>
              Back
            </button>
            <button type="button" className="btn btn-dark" onClick={next}>
              Continue
            </button>
          </div>
        </section>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <section className="apply-section">
          <h2>Review</h2>
          <div className="review-card">
            <div className="review-row">
              <strong>{selected?.label}</strong>
              {urgent ? <span className="badge badge-urgent">Urgent</span> : null}
            </div>
            <p>
              <span className="muted">Duration</span>
              <br />
              {startDate} – {endDate}
            </p>
            <p>
              <span className="muted">Reason</span>
              <br />
              {urgent ? `[URGENT] ${reason}` : reason}
            </p>
          </div>
          <div className="notice-box">
            <strong>Important</strong>
            <p className="muted small">
              Your request is saved with status Pending. An admin can approve or reject it and add remarks.
            </p>
          </div>
          {error ? <p className="error-msg">{error}</p> : null}
          <div className="apply-actions">
            <button type="button" className="btn btn-ghost" onClick={back}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-dark"
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
