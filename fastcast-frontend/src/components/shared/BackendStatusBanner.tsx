/**
 * BackendStatusBanner
 *
 * Shows an unobtrusive banner when the EC2 backend is offline
 * and the app is running on mock/demo data.
 *
 * Usage: Drop <BackendStatusBanner /> near the top of your root layout.
 */
import { useEffect, useState } from "react";
import { checkBackendReachable, isBackendReachable, resetBackendStatus, USE_MOCKS } from "@/api/client";

export function BackendStatusBanner() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  async function probe() {
    setStatus("checking");
    const ok = await checkBackendReachable();
    setStatus(ok ? "online" : "offline");
  }  

  useEffect(() => {
    // If mocks are forced via env, skip probing entirely
    if (USE_MOCKS) {
      setStatus("offline");
      return;
    }
    probe();
  }, []);

  if (status === "checking" || status === "online") return null;

  return (
    <div
      style={{
        background: "#1a1a2e",
        borderBottom: "1px solid #ff6b35",
        color: "#ff6b35",
        textAlign: "center",
        padding: "6px 16px",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
      }}
    >
      <span>⚠️ EC2 backend offline — running in demo mode with sample data</span>
      <button
        onClick={() => {
          resetBackendStatus();
          probe();
        }}
        style={{
          background: "transparent",
          border: "1px solid #ff6b35",
          color: "#ff6b35",
          borderRadius: "4px",
          padding: "2px 10px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        Retry
      </button>
    </div>
  );
}
