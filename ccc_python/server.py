from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import camelot

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type", "Authorization"]
    }
})

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
        print("Received request")
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

        # Save the PDF file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Get PDF height
        pdf_reader = PdfReader(filepath)

        # Process boxes data
        boxes_data = request.form.get('boxes')
        if not boxes_data:
            return jsonify({'error': 'No boxes data provided'}), 400

        try:
            boxes = json.loads(boxes_data)
            for page_num in boxes:
                pdf_height = float(pdf_reader.pages[int(page_num)].mediabox[3])
                for box in boxes[page_num]:
                    box['x1'] = box['x']
                    box['y1'] = pdf_height - box['y']
                    box['x2'] = box['x'] + box['width']
                    box['y2'] = pdf_height - (box['y'] + box['height'])
                    del box['width']
                    del box['x']
                    del box['y']
                    del box['height']
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid boxes data format'}), 400

        # Save the boxes data
        boxes_filename = f"{filename}_boxes.json"
        boxes_filepath = os.path.join(
            app.config['UPLOAD_FOLDER'], boxes_filename)
        with open(boxes_filepath, 'w') as f:
            json.dump(boxes, f)

        for page_num in boxes:
            # want in the form of "x1, x2, x3,x4"
            target_areas = [f"{box['x1']}, {box['y1']}, {
                box['x2']}, {box['y2']}"
                for box in boxes[page_num]]

            tables = camelot.read_pdf(filepath, pages=str(page_num),
                                      flavor='stream', table_areas=target_areas)
            tables.export(f'{filepath}_page{page_num}.csv', f='csv')
        print("done processing")
        return jsonify({
            'message': 'PDF and boxes data received successfully',
            'pdf_path': filepath,
            'boxes_path': boxes_filepath
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
