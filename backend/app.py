from flask import Flask, jsonify, send_from_directory
import os
import json
from processor import process_properties, OUTPUT_FILE

app = Flask(__name__, static_folder='../frontend', static_url_path='')

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)

@app.route('/api/properties')
def get_properties():
    if not os.path.exists(OUTPUT_FILE):
        process_properties()
    with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
        properties = json.load(f)
    return jsonify(properties)

if __name__ == '__main__':
    app.run(debug=True)