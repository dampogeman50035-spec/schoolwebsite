from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import sqlite3
import os
import pickle
import cv2
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app) 

# --- CONFIGURATION ---
DB_PATH = "database/students.db"
ENCODINGS_PATH = "database/encodings.pkl"

if not os.path.exists("database"):
    os.makedirs("database")

# --- DATABASE INITIALIZATION ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Students Table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id_number TEXT UNIQUE, 
            name TEXT NOT NULL,
            section TEXT,
            grade_level TEXT
        )
    """)
    
    # Attendance Table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id_internal INTEGER,
            name TEXT,
            location TEXT,
            timestamp DATETIME DEFAULT (datetime('now', 'localtime'))
        )
    """)

    # Ensure columns exist (Sync)
    cur.execute("PRAGMA table_info(students)")
    s_cols = [col[1] for col in cur.fetchall()]
    for col_name in ["student_id_number", "section", "grade_level"]:
        if col_name not in s_cols:
            cur.execute(f"ALTER TABLE students ADD COLUMN {col_name} TEXT")

    conn.commit()
    conn.close()

init_db()

# --- HELPER FUNCTIONS ---
def load_encodings():
    if not os.path.exists(ENCODINGS_PATH):
        return []
    with open(ENCODINGS_PATH, "rb") as f:
        return pickle.load(f)

def save_encodings(data):
    with open(ENCODINGS_PATH, "wb") as f:
        pickle.dump(data, f)

# --- ROUTES ---

@app.route("/register", methods=["POST"])
def register():
    student_id_num = request.form.get("student_id")
    name = request.form.get("name")
    section = request.form.get("section")
    grade = request.form.get("grade")
    file = request.files.get("image")

    if not all([student_id_num, name, file]):
        return jsonify({"success": False, "message": "Missing fields"}), 400

    image = face_recognition.load_image_file(file)
    encodings = face_recognition.face_encodings(image, num_jitters=1)

    if len(encodings) == 0:
        return jsonify({"success": False, "message": "No face detected"}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO students (student_id_number, name, section, grade_level) VALUES (?, ?, ?, ?)", 
            (student_id_num, name, section, grade)
        )
        internal_id = cur.lastrowid
        conn.commit()
        conn.close()

        data = load_encodings()
        data.append({
            "id": internal_id, 
            "student_id_num": student_id_num,
            "name": name, 
            "section": section,
            "encoding": encodings[0]
        })
        save_encodings(data)
        return jsonify({"success": True, "student_id": internal_id})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Student ID already exists"}), 400

@app.route("/face_login", methods=["POST"])
def face_login():
    file = request.files.get("image")
    location = request.form.get("location", "Main") 
    
    if not file:
        return jsonify({"success": False, "message": "No image"}), 400

    # 1. Convert file to numpy array and decode via OpenCV
    filestr = file.read()
    npimg = np.frombuffer(filestr, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    
    # Convert BGR (OpenCV default) to RGB (face_recognition default)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 2. Optimization: Resize to 1/4 size for 4x faster processing
    small_frame = cv2.resize(rgb_img, (0, 0), fx=0.25, fy=0.25)
    
    # 3. Detect and Encode
    face_locations = face_recognition.face_locations(small_frame)
    encodings = face_recognition.face_encodings(small_frame, face_locations)

    if not encodings:
        return jsonify({"success": False, "message": "No face detected"}), 200

    input_encoding = encodings[0]
    students = load_encodings()

    for student in students:
        # Tolerance 0.5 is stricter and more accurate for automatic systems
        match = face_recognition.compare_faces([student["encoding"]], input_encoding, tolerance=0.5)[0]
        
        if match:
            local_now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO attendance (student_id_internal, name, location, timestamp) VALUES (?, ?, ?, ?)",
                (student["id"], student["name"], location, local_now)
            )
            conn.commit()
            conn.close()
            return jsonify({
                "success": True, 
                "name": student["name"],
                "student_id": student.get("student_id_num"),
                "location": location
            })
            
    return jsonify({"success": False, "message": "Unauthorized Face"})

@app.route("/attendance")
def get_attendance():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT a.name, s.student_id_number, s.section, a.location, a.timestamp 
        FROM attendance a
        LEFT JOIN students s ON a.student_id_internal = s.id
        ORDER BY a.timestamp DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return jsonify([{
        "name": r[0], "student_id": r[1], "section": r[2], "location": r[3], "timestamp": r[4]
    } for r in rows])

@app.route("/dashboard-data")
def dashboard_data():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Attendance per location
    cur.execute("SELECT location, COUNT(*) FROM attendance GROUP BY location")
    location_data = dict(cur.fetchall())

    # Attendance by hour
    cur.execute("SELECT strftime('%H:00', timestamp) as hour, COUNT(*) FROM attendance GROUP BY hour ORDER BY hour ASC")
    hour_data = dict(cur.fetchall())
    
    # Total student count
    cur.execute("SELECT COUNT(*) FROM students")
    total_students = cur.fetchone()[0]
    
    conn.close()
    return jsonify({
        "locations": location_data,
        "hours": hour_data,
        "total_students": total_students
    })

@app.route("/students")
def get_students():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT student_id_number, name, section, grade_level FROM students")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"student_id": r[0], "name": r[1], "section": r[2], "grade": r[3]} for r in rows])

if __name__ == "__main__":
    # Ensure you have pip install opencv-python numpy face-recognition flask-cors
    app.run(debug=True, port=5000)