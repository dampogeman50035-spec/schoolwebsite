import React, { useRef, useState, useEffect } from "react";
import { useToasts } from "./Toast";

function FaceLogin() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
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

      try {
        const response = await fetch("http://127.0.0.1:5000/face_login", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          showToast(`Welcome, ${data.name}!`, "success");
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
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Local Face Scanner</h2>
      <video
        ref={videoRef}
        autoPlay
        style={{
          width: "400px",
          borderRadius: "10px",
          transform: "scaleX(-1)",
        }}
      />
      <br />
      <button
        className="btn"
        onClick={handleScan}
        disabled={isScanning}
        style={{ marginTop: "15px" }}
      >
        {isScanning ? "Processing..." : "Verify Identity"}
      </button>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default FaceLogin;
