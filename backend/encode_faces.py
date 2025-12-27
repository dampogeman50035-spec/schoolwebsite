import os
import sqlite3
import face_recognition
import pickle

# Path to dataset and database
DATASET_PATH = "dataset"
DB_PATH = "database/students.db"

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Loop through each student folder
for student_name in os.listdir(DATASET_PATH):
    student_folder = os.path.join(DATASET_PATH, student_name)
    
    if not os.path.isdir(student_folder):
        continue  # Skip files, only folders

    # Loop through each image of the student
    for img_name in os.listdir(student_folder):
        img_path = os.path.join(student_folder, img_name)

        # Load image
        image = face_recognition.load_image_file(img_path)

        # Get face encodings
        encodings = face_recognition.face_encodings(image)
        if not encodings:
            print(f"No face found in {img_path}, skipping...")
            continue

        encoding = encodings[0]

        # Convert encoding to bytes for database storage
        encoding_bytes = pickle.dumps(encoding)

        # Insert student into database (ignore if already exists)
        cursor.execute("""
            INSERT OR IGNORE INTO students (name, face_encoding)
            VALUES (?, ?)
        """, (student_name, encoding_bytes))

        print(f"Saved encoding for {student_name} from {img_name}")

# Commit and close
conn.commit()
conn.close()
print("All face encodings saved to database!")
