import React, { useRef, useState, useEffect } from "react";
import { useToasts } from "./Toast";

function FaceLogin() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Updated default location and options
  const [location, setLocation] = useState("Main");
  
  const { showToast } = useToasts();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("image", blob, "login.jpg");
      formData.append("location", location); // Sends "Main", "Annex 1", or "Annex 2"

      try {
        const response = await fetch("http://127.0.0.1:5000/face_login", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          showToast(`Welcome, ${data.name}! Logged at ${data.location}`, "success");
        } else {
          showToast(data.message || "Face not recognized", "error");
        }
      } catch (error) {
        showToast("Backend connection error", "error");
      } finally {
        setIsScanning(false);
      }
    }, "image/jpeg");
  };

  return (
    <div className="animate-in" style={{ textAlign: "center", padding: "20px" }}>
      <div className="card" style={{ maxWidth: "450px", margin: "0 auto" }}>
        <header style={{ marginBottom: "20px" }}>
          <span className="brand-tag">Authentication</span>
          <h2 style={{ fontSize: "1.5rem", marginTop: "10px" }}>Biometric Attendance</h2>
        </header>

        {/* Updated Location Dropdown */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#555", display: "block", marginBottom: "8px" }}>
            Select Campus Location:
          </label>
          <select 
            className="input" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)}
            style={{ 
                padding: "10px", 
                borderRadius: "8px", 
                width: "100%", 
                maxWidth: "280px",
                border: "1px solid #ddd",
                cursor: "pointer"
            }}
          >
            <option value="Main">Main Campus</option>
            <option value="Annex 1">Annex 1</option>
            <option value="Annex 2">Annex 2</option>
          </select>
        </div>

        <div style={{
          width: "280px",
          height: "280px",
          margin: "0 auto",
          borderRadius: "15px",
          overflow: "hidden",
          border: "4px solid var(--primary)",
          background: "#000"
        }}>
          <video
            ref={videoRef}
            autoPlay
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />
        </div>

        <button
          className="btn"
          onClick={handleScan}
          disabled={isScanning}
          style={{ marginTop: "25px", width: "100%", maxWidth: "280px", height: "50px" }}
        >
          {isScanning ? "Processing..." : "Verify Identity"}
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default FaceLogin;