from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import sqlite3
import os
import pickle

app = Flask(__name__)
CORS(app) # Allows local React to talk to local Flask

DB_PATH = "database/students.db"
ENCODINGS_PATH = "database/encodings.pkl"

if not os.path.exists("database"):
    os.makedirs("database")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            name TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
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
@app.route("/")
def home():
    return "Backend is Online!"

@app.route("/register", methods=["POST"])
def register():
    name = request.form.get("name")
    file = request.files.get("image")

    if not name or not file:
        return jsonify({"success": False, "message": "Name and image required"})

    image = face_recognition.load_image_file(file)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        return jsonify({"success": False, "message": "No face detected"})

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT INTO students (name) VALUES (?)", (name,))
    student_id = cur.lastrowid
    conn.commit()
    conn.close()

    data = load_encodings()
    data.append({"id": student_id, "name": name, "encoding": encodings[0]})
    save_encodings(data)

    return jsonify({"success": True, "student_id": student_id})

@app.route("/face_login", methods=["POST"])
def face_login():
    file = request.files.get("image")
    if not file:
        return jsonify({"success": False, "message": "No image provided"})

    image = face_recognition.load_image_file(file)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        return jsonify({"success": False, "message": "No face detected"})

    input_encoding = encodings[0]
    students = load_encodings()

    for student in students:
        match = face_recognition.compare_faces([student["encoding"]], input_encoding)[0]
        if match:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO attendance (student_id, name) VALUES (?, ?)",
                (student["id"], student["name"])
            )
            conn.commit()
            conn.close()
            return jsonify({"success": True, "name": student["name"]})

    return jsonify({"success": False, "message": "Face not recognized"})

@app.route("/attendance")
def get_attendance():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT name, timestamp FROM attendance ORDER BY timestamp DESC")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"name": r[0], "timestamp": r[1]} for r in rows])

@app.route("/stats")
def get_stats():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM students")
    total_students = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM attendance")
    total_logs = cur.fetchone()[0]
    conn.close()
    return jsonify({
        "total_students": total_students,
        "total_logs": total_logs
    })

@app.route("/students")
def get_students():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM students")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "name": r[1]} for r in rows])

if __name__ == "__main__":
    app.run(debug=True, port=5000)