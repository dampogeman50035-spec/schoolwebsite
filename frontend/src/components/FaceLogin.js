import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { useToasts } from "./Toast";

function FaceLogin() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastScanTimeRef = useRef(0);

  const [isScanning, setIsScanning] = useState(false);
  const [location, setLocation] = useState("Main");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const { showToast } = useToasts();

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        // ONLY loading the detector to ensure no shard errors
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log("✅ Face Detector Active");
        setModelsLoaded(true);
        startVideo();
      } catch (err) {
        console.error("Model load fail:", err);
      }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => showToast("Camera access denied", "error"));
  };

  useEffect(() => {
    let interval;
    if (modelsLoaded && !isScanning) {
      interval = setInterval(async () => {
        if (isProcessingRef.current) return;
        if (videoRef.current && canvasRef.current) {
          isProcessingRef.current = true;
          try {
            const detections = await faceapi.detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
            );

            const displaySize = { width: videoRef.current.offsetWidth, height: videoRef.current.offsetHeight };
            faceapi.matchDimensions(canvasRef.current, displaySize);
            const resized = faceapi.resizeResults(detections, displaySize);
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            if (resized.length > 0) {
              resized.forEach(det => {
                const { x, y, width, height } = det.box;
                const right = x + width;
                const bottom = y + height;

                // 1. Draw Tech Brackets (Cyberpunk Style)
                ctx.strokeStyle = "#10b981"; 
                ctx.lineWidth = 4;
                const len = 25;
                
                // Top Left
                ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
                // Top Right
                ctx.beginPath(); ctx.moveTo(right - len, y); ctx.lineTo(right, y); ctx.lineTo(right, y + len); ctx.stroke();
                // Bottom Left
                ctx.beginPath(); ctx.moveTo(x, bottom - len); ctx.lineTo(x, bottom); ctx.lineTo(x + len, bottom); ctx.stroke();
                // Bottom Right
                ctx.beginPath(); ctx.moveTo(right - len, bottom); ctx.lineTo(right, bottom); ctx.lineTo(right, bottom - len); ctx.stroke();

                // 2. Draw Moving Laser Scan Line
                const time = Date.now() * 0.003;
                const scanLineY = y + (Math.sin(time) * 0.5 + 0.5) * height;
                
                ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, scanLineY);
                ctx.lineTo(right, scanLineY);
                ctx.stroke();

                // Add "Glow" effect to laser
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#10b981";
                ctx.stroke();
                ctx.shadowBlur = 0;

                // 3. Auto-Trigger Login
                if (Date.now() - lastScanTimeRef.current > 3000) {
                  handleCaptureAndLogin();
                }
              });
            }
          } catch (e) { console.error("Inference skip:", e); }
          isProcessingRef.current = false;
        }
      }, 150);
    }
    return () => clearInterval(interval);
  }, [modelsLoaded, isScanning]);

  const handleCaptureAndLogin = () => {
    setIsScanning(true);
    lastScanTimeRef.current = Date.now();
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("image", blob, "scan.jpg");
      formData.append("location", location);

      try {
        const res = await fetch("http://127.0.0.1:5000/face_login", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          showToast(`Welcome, ${data.name}!`, "success");
          setTimeout(() => setIsScanning(false), 5000);
        } else {
          setTimeout(() => setIsScanning(false), 2000);
        }
      } catch (err) { setIsScanning(false); }
    }, "image/jpeg", 0.6);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div className="card" style={{ maxWidth: "450px", margin: "0 auto", padding: "30px", background: "white", borderRadius: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <h2 style={{ color: "#10b981", marginBottom: "20px" }}>GIST Biometric Scanner</h2>
        
        <select className="input" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "8px" }}>
          <option value="Main">Main Campus</option>
          <option value="Annex 1">Annex 1</option>
        </select>

        <div style={{ position: "relative", width: "320px", height: "320px", margin: "0 auto", borderRadius: "20px", overflow: "hidden", border: "5px solid #10b981", background: "#000" }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)", pointerEvents: "none" }} />
        </div>

        <p style={{ marginTop: "20px", fontWeight: "bold", color: isScanning ? "#f59e0b" : "#10b981" }}>
          {isScanning ? "VERIFYING IDENTITY..." : "SCANNER ACTIVE"}
        </p>
      </div>
    </div>
  );
}

export default FaceLogin;