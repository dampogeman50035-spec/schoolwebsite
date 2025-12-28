import React, { useRef, useState, useEffect } from "react";
import { useToasts } from "./Toast";

function Register() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [name, setName] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const { showToast } = useToasts();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => showToast("Please enable camera access", "error"));
  }, [showToast]);

  const handleRegister = async () => {
    if (!name.trim()) return showToast("Student name is required", "error");

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", blob, "face.jpg");

    try {
      // Pointing to your LOCAL backend
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully enrolled ${name}`, "success");
        setName("");
      } else {
        showToast(data.message || "Registration failed", "error");
      }
    } catch (err) {
      showToast("Connection to server failed", "error");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="animate-in" style={{ padding: "20px" }}>
      <div className="card" style={{ maxWidth: "450px", margin: "0 auto", textAlign: "center" }}>
        <header style={{ marginBottom: "24px" }}>
          <span className="brand-tag" style={{ color: "var(--primary)" }}>Enrollment</span>
          <h1 style={{ fontSize: "1.8rem", margin: "10px 0" }}>New Student</h1>
        </header>

        {/* Circular Viewfinder */}
        <div style={{
          width: "200px",
          height: "200px",
          margin: "0 auto 24px",
          borderRadius: "50%",
          border: "4px solid var(--primary)",
          overflow: "hidden",
          background: "#000",
          boxShadow: "var(--shadow-md)"
        }}>
          <video
            ref={videoRef}
            autoPlay
            style={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
          <input
            className="input"
            placeholder="Student Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCapturing}
            style={{ 
              width: "100%", 
              maxWidth: "320px", // Limits the width of the input
              padding: "12px",
              textAlign: "center"
            }}
          />

          <button
            className="btn"
            style={{ width: "100%", maxWidth: "320px", height: "50px" }}
            onClick={handleRegister}
            disabled={isCapturing}
          >
            {isCapturing ? "Processing..." : "Create Biometric Profile"}
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default Register;