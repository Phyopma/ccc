from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import json
import os

from config import Config


def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS


def save_pdf_file(file):
    """Save the uploaded PDF file and return the filepath"""
    filename = secure_filename(file.filename)
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)
    return filepath, filename


def process_boxes_data(boxes_data, filepath):
    """Process and transform the boxes data according to PDF dimensions"""
    try:
        boxes = json.loads(boxes_data)
        print("Input boxes:", boxes)

        pdf_reader = PdfReader(filepath)

        for page_num in boxes.keys():
            # nga loe ma AI nk -1
            pdf_height = float(pdf_reader.pages[int(page_num)-1].mediabox[3])
            print(pdf_reader.pages[int(page_num)-1])
            print(f"Processing page {page_num}, PDF height: {pdf_height}")
            for box in boxes[page_num]:
                # Convert coordinates with decimal precision
                x = float(box['x'])
                y = float(box['y'])
                width = float(box['width'])
                height = float(box['height'])

                # Create coordinate string with proper rounding
                x1 = round(x, 2)
                y1 = round(pdf_height - y, 2)  # Bottom Y coordinate
                x2 = round(x + width, 2)
                y2 = round(pdf_height - y - height, 2)  # Top Y coordinate

                # Format coordinates as string
                coord_str = f"{x1},{y1},{x2},{y2}"
                boxes[page_num][boxes[page_num].index(box)] = coord_str
                print(f"Transformed box: {coord_str}")

        return boxes
    except json.JSONDecodeError:
        raise ValueError('Invalid boxes data format')
    except Exception as e:
        raise ValueError(f'Error processing boxes data: {str(e)}')


def save_boxes_data(boxes, filename):
    """Save the processed boxes data to a JSON file"""
    boxes_filename = f"{filename}_boxes.json"
    boxes_filepath = os.path.join(Config.UPLOAD_FOLDER, boxes_filename)
    with open(boxes_filepath, 'w') as f:
        json.dump(boxes, f)
    return boxes_filepath
