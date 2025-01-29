from flask import Flask, request, jsonify
from flask_cors import CORS
import sys

from config import Config, CORSConfig
from utils import allowed_file, save_pdf_file, process_boxes_data, save_boxes_data
from pdf_processor import process_pdf_with_camelot

app = Flask(__name__)
CORS(app, resources=CORSConfig.RESOURCES)

# Initialize application configuration
Config.init_app()
app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER


@app.route('/api/submit', methods=['POST'])
def submit_pdf():
    try:
        print("Received request", flush=True)
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
        filepath, filename = save_pdf_file(file)

        # Process boxes data
        try:
            boxes = process_boxes_data(boxes_data, filepath)
            print("Processed boxes data:", boxes, flush=True)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        # Save the boxes data
        print("Processing boxes data to save...", flush=True)
        boxes_filepath = save_boxes_data(boxes, filename)

        # Process PDF with camelot
        output_files = process_pdf_with_camelot(filepath, boxes)

        print("Processing completed successfully", flush=True)
        return jsonify({
            'message': 'PDF and boxes data received successfully',
            'pdf_path': filepath,
            'boxes_path': boxes_filepath,
            'output_files': output_files
        }), 200

    except Exception as e:
        print(f"Error occurred: {str(e)}", file=sys.stderr, flush=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
