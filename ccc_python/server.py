from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/submit', methods=['POST'])
def submit_pdf():
    try:
        # Check if PDF file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF files are allowed'}), 400

        # Get boxes data
        boxes_data = request.form.get('boxes')
        if not boxes_data:
            return jsonify({'error': 'No boxes data provided'}), 400

        try:
            boxes = json.loads(boxes_data)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid boxes data format'}), 400

        # Save the PDF file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Save the boxes data
        boxes_filename = f"{filename}_boxes.json"
        boxes_filepath = os.path.join(
            app.config['UPLOAD_FOLDER'], boxes_filename)
        with open(boxes_filepath, 'w') as f:
            json.dump(boxes, f)

        return jsonify({
            'message': 'PDF and boxes data received successfully',
            'pdf_path': filepath,
            'boxes_path': boxes_filepath
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
