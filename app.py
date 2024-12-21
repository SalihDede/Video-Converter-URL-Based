from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO
import os
import subprocess

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
        text=True
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
            return jsonify({'error': 'Invalid parameters. Only mp3 and mp4 formats are allowed.'}), 400

        output_file = os.path.join(DOWNLOAD_FOLDER, f"%(title)s.{'mp3' if format == 'mp3' else 'mp4'}")
        
        process = run_yt_dlp(url, format, output_file)

        total_size = 0
        downloaded_size = 0

        for line in process.stdout:
            print(f"YT-DLP Output: {line.strip()}")
            if "[download]" in line and "of" in line:
                try:
                    # Extract the total size and downloaded size from the output
                    size_parts = line.split("of")
                    downloaded_size_str = size_parts[0].split()[-1]
                    total_size_str = size_parts[1].split()[0]
                    
                    # Convert sizes to bytes if possible
                    def convert_to_bytes(size_str):
                        size_str = size_str.strip()
                        if size_str.endswith('KiB'):
                            return float(size_str[:-3]) * 1024
                        elif size_str.endswith('MiB'):
                            return float(size_str[:-3]) * 1024 * 1024
                        elif size_str.endswith('GiB'):
                            return float(size_str[:-3]) * 1024 * 1024 * 1024
                        elif size_str.endswith('B'):
                            return float(size_str[:-1])
                        else:
                            return 0
                    
                    downloaded_size = convert_to_bytes(downloaded_size_str)
                    total_size = convert_to_bytes(total_size_str)
                    
                    if total_size > 0:
                        progress = downloaded_size / total_size
                        socketio.emit('progress', {'progress': progress})
                except Exception as e:
                    print(f"Error parsing download progress: {e}")

        process.wait()
        if process.returncode != 0:
            return jsonify({'error': 'Download failed.'}), 500

        return jsonify({'message': 'Download completed successfully.'})

    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True)
