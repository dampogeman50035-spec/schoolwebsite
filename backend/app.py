from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import sqlite3
import os
import pickle
from datetime import datetime

app = Flask(__name__)
CORS(app) 

DB_PATH = "database/students.db"
ENCODINGS_PATH = "database/encodings.pkl"

if not os.path.exists("database"):
    os.makedirs("database")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 1. Initialize Students Table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id_number TEXT UNIQUE, 
            name TEXT NOT NULL,
            section TEXT,
            grade_level TEXT
        )
    """)
    
    # 2. Initialize Attendance Table - Using Localtime default
    cur.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id_internal INTEGER,
            name TEXT,
            location TEXT,
            timestamp DATETIME DEFAULT (datetime('now', 'localtime'))
        )
    """)

    # --- COLUMN SYNC ---
    cur.execute("PRAGMA table_info(students)")
    s_cols = [col[1] for col in cur.fetchall()]
    for col_name in ["student_id_number", "section", "grade_level"]:
        if col_name not in s_cols:
            cur.execute(f"ALTER TABLE students ADD COLUMN {col_name} TEXT")

    cur.execute("PRAGMA table_info(attendance)")
    a_cols = [col[1] for col in cur.fetchall()]
    if "student_id_internal" not in a_cols:
        print("Mismatched database detected. Fixing attendance table...")
        cur.execute("DROP TABLE IF EXISTS attendance")
        cur.execute("""
            CREATE TABLE attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id_internal INTEGER,
                name TEXT,
                location TEXT,
                timestamp DATETIME DEFAULT (datetime('now', 'localtime'))
            )
        """)
    
    conn.commit()
    conn.close()

init_db()

def load_encodings():
    if not os.path.exists(ENCODINGS_PATH):
        return []
    with open(ENCODINGS_PATH, "rb") as f:
        return pickle.load(f)

def save_encodings(data):
    with open(ENCODINGS_PATH, "wb") as f:
        pickle.dump(data, f)

@app.route("/register", methods=["POST"])
def register():
    student_id_num = request.form.get("student_id")
    name = request.form.get("name")
    section = request.form.get("section")
    grade = request.form.get("grade")
    file = request.files.get("image")

    if not all([student_id_num, name, file]):
        return jsonify({"success": False, "message": "Missing required fields"})

    image = face_recognition.load_image_file(file)
    # Using num_jitters=1 here ensures the 'master' encoding is high quality
    encodings = face_recognition.face_encodings(image, num_jitters=1)

    if len(encodings) == 0:
        return jsonify({"success": False, "message": "No face detected"})

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
        return jsonify({"success": False, "message": "Student ID already exists"})

@app.route("/face_login", methods=["POST"])
def face_login():
    file = request.files.get("image")
    location = request.form.get("location", "Main") 
    
    if not file:
        return jsonify({"success": False, "message": "No image provided"})

    image = face_recognition.load_image_file(file)
    # num_jitters=1 makes it scan more carefully to increase accuracy
    encodings = face_recognition.face_encodings(image, num_jitters=1)

    if len(encodings) == 0:
        return jsonify({"success": False, "message": "No face detected"})

    input_encoding = encodings[0]
    students = load_encodings()

    for student in students:
        # tolerance=0.5 makes it stricter (0.6 is default). 
        # Lower this to 0.45 if you still get false positives.
        match = face_recognition.compare_faces([student["encoding"]], input_encoding, tolerance=0.5)[0]
        
        if match:
            # Generate exact local time for the log
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
                "location": location,
                "time": local_now
            })
    return jsonify({"success": False, "message": "Face not recognized"})

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

# ... (stats and students routes remain the same) ...

@app.route("/stats")
def get_stats():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM students")
    total_students = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM attendance")
    total_logs = cur.fetchone()[0]
    conn.close()
    return jsonify({"total_students": total_students, "total_logs": total_logs})

@app.route("/students")
def get_students():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT student_id_number, name, section, grade_level FROM students")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"student_id": r[0], "name": r[1], "section": r[2], "grade": r[3]} for r in rows])

if __name__ == "__main__":
    app.run(debug=True, port=5000)