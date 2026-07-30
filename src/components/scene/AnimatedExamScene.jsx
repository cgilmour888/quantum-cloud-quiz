import { useEffect } from "react";

export default function AnimatedExamScene() {
  useEffect(() => {
    document.title = "Neon Storm Exam Lab — Preview";
    return () => {
      document.title = "Quantum Cloud";
    };
  }, []);

  return (
    <div
      role="img"
      aria-label="Neon Storm Cloud Exam Dashboard"
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="/images/neon-storm-cloud-exam-dashboard.png"
        alt="Neon Storm Cloud Exam Dashboard"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
}
