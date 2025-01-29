from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import json
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
        # Check if files are present in request
        files = request.files.to_dict()
        if not files:
            return jsonify({'error': 'No files provided'}), 400

        # Get boxes data
        boxes_data = request.form.get('boxes')
        if not boxes_data:
            return jsonify({'error': 'No boxes data provided'}), 400

        try:
            boxes = json.loads(boxes_data)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid boxes data format'}), 400

        results = []
        for file_key, file in files.items():
            if file.filename == '':
                continue

            if not allowed_file(file.filename):
                return jsonify({'error': f'Invalid file type for {file.filename}. Only PDF files are allowed'}), 400

            # Save the PDF file
            filepath, filename = save_pdf_file(file)

            # Get boxes for this file from the boxes data
            file_index = int(file_key.split('[')[1].split(']')[0])
            file_boxes = boxes.get(str(file_index), {})

            # Process boxes data for this file
            try:
                processed_boxes = process_boxes_data(
                    json.dumps(file_boxes), filepath)
                print(f"Processed boxes data for {filename}:",
                      processed_boxes, flush=True)
            except ValueError as e:
                return jsonify({'error': f'Error processing boxes for {filename}: {str(e)}'}), 400

            # Save the boxes data
            print(f"Processing boxes data to save for{filename}...",
                  flush=True)
            boxes_filepath = save_boxes_data(processed_boxes, filename)

            # Process PDF with camelot
            output_files = process_pdf_with_camelot(filepath, processed_boxes)

            results.append({
                'filename': filename,
                'pdf_path': filepath,
                'boxes_path': boxes_filepath,
                'output_files': output_files
            })

        print("Processing completed successfully for all files", flush=True)
        return jsonify({
            'message': 'All PDFs and boxes data processed successfully',
            'results': results
        }), 200

    except Exception as e:
        print(f"Error occurred: {str(e)}", file=sys.stderr, flush=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
