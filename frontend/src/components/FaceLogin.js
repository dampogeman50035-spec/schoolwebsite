import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js"; // Make sure to npm install face-api.js
import { useToasts } from "./Toast";

function FaceLogin() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isProcessing = useRef(false); // Ref prevents overlapping scans
  const lastScanTime = useRef(0); // Ref for cooldown tracking
  
  const [isScanning, setIsScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [location, setLocation] = useState("Main");
  
  const { showToast } = useToasts();

  // 1. Load Models and Start Camera
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load only the lightweight detector
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        showToast("Error loading camera/models", "error");
      }
    };
    loadModels();
  }, []);

  // 2. Automatic Detection Loop
  useEffect(() => {
    let requestID;
    
    const detectFace = async () => {
      // Don't run if models aren't ready or we are currently logging someone in
      if (!modelsLoaded || isScanning || isProcessing.current) {
        requestID = requestAnimationFrame(detectFace);
        return;
      }

      if (videoRef.current && videoRef.current.readyState === 4) {
        isProcessing.current = true;
        
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
        );

        // If a face is found and 3 seconds have passed since the last scan
        if (detections.length > 0 && Date.now() - lastScanTime.current > 3000) {
          handleAutoLogin();
        } else {
          isProcessing.current = false;
        }
      }
      requestID = requestAnimationFrame(detectFace);
    };

    if (modelsLoaded) requestID = requestAnimationFrame(detectFace);
    return () => cancelAnimationFrame(requestID);
  }, [modelsLoaded, isScanning]);

  const handleAutoLogin = () => {
    setIsScanning(true);
    lastScanTime.current = Date.now();
    
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("image", blob, "login.jpg");
      formData.append("location", location);

      try {
        const response = await fetch("https://keshia-hyperemic-jamison.ngrok-free.dev/face_login", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          showToast(`Welcome, ${data.name}!`, "success");
        } else {
          // Shows "Already timed in" or "Unauthorized" from your Python server
          showToast(data.message || "Recognition failed", "error");
        }
      } catch (error) {
        showToast("Server error", "error");
      } finally {
        // Wait 2 seconds before allowing the loop to look for faces again
        setTimeout(() => {
          setIsScanning(false);
          isProcessing.current = false;
        }, 2000);
      }
    }, "image/jpeg", 0.7);
  };

  return (
    <div className="animate-in" style={{ textAlign: "center", padding: "20px" }}>
      <div className="card" style={{ maxWidth: "450px", margin: "0 auto" }}>
        <header style={{ marginBottom: "20px" }}>
          <span className="brand-tag">Authentication</span>
          <h2 style={{ fontSize: "1.5rem", marginTop: "10px" }}>Automatic Attendance</h2>
          <p style={{ color: "#888", fontSize: "0.8rem" }}>Look at the camera to sign in</p>
        </header>

        <div style={{ marginBottom: "20px" }}>
          <select 
            className="input" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)}
            style={{ padding: "10px", borderRadius: "8px", width: "100%", maxWidth: "280px" }}
          >
            <option value="Main">Main Campus</option>
            <option value="Annex 1">Annex 1</option>
            <option value="Annex 2">Annex 2</option>
          </select>
        </div>

        <div style={{
          width: "280px", height: "280px", margin: "0 auto",
          borderRadius: "15px", overflow: "hidden",
          border: isScanning ? "4px solid #f59e0b" : "4px solid #10b981",
          background: "#000", transition: "all 0.3s ease"
        }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
        </div>

        <div style={{ marginTop: "20px", fontWeight: "600", color: isScanning ? "#f59e0b" : "#10b981" }}>
          {isScanning ? "Processing Identity..." : "Scanner Active - Looking for Face"}
        </div>
      </div>
    </div>
  );
}

export default FaceLogin;