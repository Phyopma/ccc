from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import json
import os
from datetime import datetime
from config import Config, CORSConfig
from utils import allowed_file, save_pdf_file, process_boxes_data, save_boxes_data, cleanup_uploads_folder
from pdf_processor import process_pdf_with_pdfplumber
from transaction_processor import process_transaction_text
from db import db


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

            try:
                # Get boxes for this file from the boxes data
                file_index = int(file_key.split('[')[1].split(']')[0])
                file_boxes = boxes.get(str(file_index), {})

                # Process boxes data for this file
                processed_boxes = process_boxes_data(
                    json.dumps(file_boxes), filepath)
                print(f"Processed boxes data for {filename}:",
                      processed_boxes, flush=True)

                # Save the boxes data
                print(f"Processing boxes data to save for {filename}...",
                      flush=True)
                boxes_filepath = save_boxes_data(processed_boxes, filename)

                # Process PDF with pdfplumber
                output_files = process_pdf_with_pdfplumber(
                    filepath, processed_boxes)

                # Process extracted text with OpenAI page by page
                file_results = []
                for page_data in output_files:
                    try:
                        transactions = process_transaction_text(
                            page_data['text'], filename, page_data['page_number'])

                        # Store processed data in MongoDB
                        try:
                            db['extracted_texts'].insert_one({
                                'text': page_data['text'],
                                'page_number': page_data['page_number'],
                                'file_path': filepath,
                                'transactions': transactions.model_dump(),
                                'created_at': datetime.now()
                            })
                        except Exception as db_error:
                            print(f"""MongoDB insertion error: {
                                  str(db_error)}""", flush=True)
                            # Continue processing even if database operation fails
                            pass

                        file_results.append({
                            'page_number': page_data['page_number'],
                            'transactions': transactions.model_dump()
                        })
                    except Exception as process_error:
                        print(f"""Error processing page {page_data['page_number']}: {
                              str(process_error)}""", flush=True)
                        # Continue processing other pages even if one fails
                        continue

                results.append({
                    'filename': filename,
                    'pdf_path': filepath,
                    'boxes_path': boxes_filepath,
                    'pages': file_results
                })

            except Exception as e:
                print(f"""Error processing file {
                      filename}: {str(e)}""", flush=True)
                results.append({
                    'filename': filename,
                    'error': str(e)
                })
                continue
            finally:
                # Clean up temporary files after processing
                cleanup_uploads_folder(filepath)

        if not results:
            return jsonify({'error': 'No files were successfully processed'}), 400

        print("Processing completed successfully for all files", flush=True)
        return jsonify({
            'message': 'PDFs and boxes data processed successfully',
            'results': results
        }), 200

    except Exception as e:
        print(f"Error occurred: {str(e)}", file=sys.stderr, flush=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
