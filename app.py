# app.py

import numpy as np
import sounddevice as sd
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import threading
import time

# --- Configuration ---
CHUNK = 1024        # Audio buffer size
SAMPLE_RATE = 44100 # Standard sampling rate (Hz)
RMS_REF = 1.0       # Reference amplitude for dBFS

# --- Real-World dBA Scaling Constants ---
# DBA_OFFSET (approx. 90 dB) maps dBFS to a dBA sound level.
DBA_OFFSET = 90.0 
MAX_DISPLAY_DBA = 120 # Upper bound remains the same (e.g., maximum loud reading)
MIN_DISPLAY_DBA = 0   # <--- MODIFIED: Minimum bound is now 0 for display
DBA_RANGE = MAX_DISPLAY_DBA - MIN_DISPLAY_DBA # 120

# --- Flask & SocketIO Setup ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# --- Global Variables ---
mic_stream = None
audio_thread = None
running = False
MAX_SESSION_DBA = 0 

# --- Audio Processing Function (Accurate dBA Approximation) ---

def calculate_dba(indata):
    """
    Calculates RMS, converts to dBFS, and then approximates dBA, clipping output at 0 dBA.
    """
    global MAX_SESSION_DBA
    
    # 1. Calculate RMS and dBFS
    audio_data = np.frombuffer(indata, dtype=np.int16).astype(np.float64)
    audio_data /= (2**15)
    rms = np.sqrt(np.mean(audio_data**2))
    
    db_fs = 20 * np.log10(rms / RMS_REF) if rms >= 1e-10 else -120 
    
    # 2. Convert dBFS to approximate dBA
    dba_raw = db_fs + DBA_OFFSET
    
    # 3. Clip and Round for Integer Display
    dba_integer = int(round(dba_raw))
    
    # Ensure the result is clipped between 0 and MAX_DISPLAY_DBA (120)
    dba_integer = max(MIN_DISPLAY_DBA, min(MAX_DISPLAY_DBA, dba_integer)) 
    
    # Update MAX_SESSION_DBA
    if dba_integer > MAX_SESSION_DBA:
        MAX_SESSION_DBA = dba_integer

    # 4. Classification based on STANDARD dBA limits (unchanged)
    if dba_integer >= 100:
        level = "EXTREME DANGER" 
    elif dba_integer >= 85:
        level = "High Risk (Loud)"
    elif dba_integer >= 60:
        level = "Moderate Noise"
    else:
        level = "Quiet / Low"
        
    return dba_integer, MAX_SESSION_DBA, level

# --- SoundDevice Callback for Real-time Processing ---

def audio_callback(indata, frames, time_info, status):
    if status:
        pass
        
    dba_integer, max_dba, classification = calculate_dba(indata)
    
    socketio.emit('db_update', {
        'db': dba_integer,
        'max_db': max_dba,
        'classification': classification
    })

# --- Streaming Control Functions (Unchanged) ---
def start_streaming():
    global running, mic_stream
    if not running:
        print("Starting audio stream...")
        try:
            mic_stream = sd.InputStream(
                samplerate=SAMPLE_RATE,
                blocksize=CHUNK,
                dtype='int16',
                channels=1,
                callback=audio_callback
            )
            mic_stream.start()
            running = True
            
            while running:
                time.sleep(0.05)
                
        except Exception as e:
            print(f"Error starting audio stream: {e}", flush=True)
            running = False
            
def stop_streaming():
    global running, mic_stream
    if running and mic_stream:
        print("Stopping audio stream...")
        mic_stream.stop()
        mic_stream.close()
        running = False

# --- Flask Routes and SocketIO Handlers ---

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    global audio_thread
    print('Client connected:', request.sid)
    
    if audio_thread is None or not audio_thread.is_alive():
        audio_thread = threading.Thread(target=start_streaming)
        audio_thread.daemon = True
        audio_thread.start()

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected:', request.sid)

# --- Main Execution Block ---

if __name__ == '__main__':
    try:
        print("Starting server...")
        socketio.run(app, debug=False, port=5000)
    except KeyboardInterrupt:
        stop_streaming()
        print("Server shut down.")