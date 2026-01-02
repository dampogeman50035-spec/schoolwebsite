import React, { useRef, useState, useEffect } from "react";
import { useToasts } from "./Toast";

function Register() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // NEW STATE FIELDS
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [section, setSection] = useState("");
  const [grade, setGrade] = useState("");
  
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
    // Validation for required fields
    if (!name.trim() || !studentId.trim()) {
      return showToast("Name and Student ID are required", "error");
    }

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    
    // UPDATED FORMDATA
    const formData = new FormData();
    formData.append("name", name);
    formData.append("student_id", studentId); // Matches request.form.get("student_id")
    formData.append("section", section);     // Matches request.form.get("section")
    formData.append("grade", grade);         // Matches request.form.get("grade")
    formData.append("image", blob, "face.jpg");

    try {
      // Remember to change this to your NGROK URL when deploying!
      const res = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(`Successfully enrolled ${name}`, "success");
        // Clear all fields on success
        setName("");
        setStudentId("");
        setSection("");
        setGrade("");
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

        <div style={{
          width: "180px",
          height: "180px",
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

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {/* NEW INPUT FIELDS */}
          <input
            className="input"
            placeholder="Student ID Number"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={isCapturing}
            style={inputStyle}
          />
          <input
            className="input"
            placeholder="Student Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCapturing}
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "320px" }}>
            <input
              className="input"
              placeholder="Grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              disabled={isCapturing}
              style={{ flex: 1, padding: "12px", textAlign: "center" }}
            />
            <input
              className="input"
              placeholder="Section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={isCapturing}
              style={{ flex: 1, padding: "12px", textAlign: "center" }}
            />
          </div>

          <button
            className="btn"
            style={{ width: "100%", maxWidth: "320px", height: "50px", marginTop: "10px" }}
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

// Simple constant for shared styles
const inputStyle = { 
  width: "100%", 
  maxWidth: "320px", 
  padding: "12px",
  textAlign: "center"
};

export default Register;