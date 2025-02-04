from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import sys
import json
import os
from datetime import datetime, timedelta
from config import Config, CORSConfig
from utils import allowed_file, save_pdf_file, process_boxes_data, save_boxes_data, cleanup_uploads_folder
from pdf_processor import process_pdf_with_pdfplumber
from transaction_processor import process_transaction_text
from db import db
from auth import create_user, verify_user


app = Flask(__name__)
CORS(app, resources=CORSConfig.RESOURCES, supports_credentials=True)


# Initialize application configuration
Config.init_app()
app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER


@app.route('/api/auth/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin',
                             request.headers.get('Origin'))
        response.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400

        user = create_user(data['email'], data['password'])
        return jsonify({
            'message': 'User created successfully',
            'user': user
        }), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin',
                             request.headers.get('Origin'))
        response.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400

        user = verify_user(data['email'], data['password'])
        return jsonify({
            'message': 'Login successful',
            'user': user
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/submit', methods=['POST'])
def submit_pdf():
    # Get user ID from request
    user_id = request.form.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
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
        # Process each file sequentially
        for file_key, file in files.items():
            if file.filename == '':
                continue

            if not allowed_file(file.filename):
                return jsonify({'error': f'Invalid file type for {file.filename}. Only PDF files are allowed'}), 400

            print(f"Processing file: {file.filename}", flush=True)
            # Save the PDF file
            filepath, filename = save_pdf_file(file)

            try:
                # Get boxes for this file from the boxes data
                file_index = int(file_key.split('[')[1].split(']')[0])
                file_boxes = boxes.get(str(file_index), {})
                if not file_boxes:
                    print(f"No boxes found for file {filename}", flush=True)
                    continue

                # Process boxes data for this file
                processed_boxes = process_boxes_data(
                    json.dumps(file_boxes), filepath)
                print(f"""Processed boxes data for {
                      filename}:""", processed_boxes, flush=True)

                # Save the boxes data
                boxes_filepath = save_boxes_data(processed_boxes, filename)
                print(f"""Saved boxes data for {filename} to {
                      boxes_filepath}""", flush=True)

                # Process PDF with pdfplumber
                output_files = process_pdf_with_pdfplumber(
                    filepath, processed_boxes)

                # Process extracted text page by page
                file_results = []
                for page_data in output_files:
                    page_number = page_data['page_number']
                    print(f"""Processing page {page_number} of {
                          filename}""", flush=True)

                    try:
                        # Process transactions for this page
                        transactions = process_transaction_text(
                            page_data['text'], user_id)

                        print(f"""Processed transactions for page {
                              page_number} of {filename}""", flush=True)

                        file_results.append({
                            'page_number': page_number,
                            'transactions': transactions.model_dump()
                        })
                    except Exception as process_error:
                        print(f"""Error processing page {page_number} of {
                              filename}: {str(process_error)}""", flush=True)
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
