import cv2

# Open the webcam (camera index 0, try 1 if 0 doesn't work)
cap = cv2.VideoCapture(0)

# Check if the webcam is opened correctly
if not cap.isOpened():
    print("Error: Unable to access the camera.")
else:
    print("Camera is working")

# Capture frames from the webcam
while True:
    ret, frame = cap.read()
    if not ret:
        print("Error: Couldn't read frame")
        break

    # Display the frame
    cv2.imshow("Webcam Feed", frame)

    # Break the loop if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
