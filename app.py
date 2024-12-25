from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO
import os
import subprocess
import re

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

DOWNLOAD_FOLDER = os.path.normpath(os.path.join(os.path.expanduser("~"), "Downloads", "Youtube Converter"))

if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

def run_yt_dlp(url, format, output_file):
    command = ['yt-dlp', '-f', 'bestaudio' if format == 'mp3' else 'best']
    
    if format == 'mp3':
        command += ['--extract-audio', '--audio-format', 'mp3']
    
    command += ['--output', output_file, url]

    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    return process

@app.route('/download', methods=['POST', 'OPTIONS'])
@cross_origin()
def download():
    try:
        data = request.get_json()
        url = data.get('url')
        format = data.get('format')

        if not url or format not in ['mp3', 'mp4']:
            return jsonify({'error': 'Geçersiz parametreler.'}), 400

        output_file = os.path.join(DOWNLOAD_FOLDER, f"%(title)s.{'mp3' if format == 'mp3' else 'mp4'}")
        
        process = run_yt_dlp(url, format, output_file)

        for line in process.stdout:
            if "[download]" in line:
                # Progress bilgisini çıkarmak için regex kullan
                progress_match = re.search(r'(\d+\.\d+)%', line)
                if progress_match:
                    progress = float(progress_match.group(1)) / 100
                    socketio.emit('progress', {'progress': progress})
                    print(f"Progress: {progress * 100}%")

        process.wait()
        if process.returncode != 0:
            return jsonify({'error': 'İndirme başarısız oldu.'}), 500

        return jsonify({'message': 'İndirme başarıyla tamamlandı.'})

    except Exception as e:
        print(f"Hata: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
