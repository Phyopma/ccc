import pdfplumber
import os
import sys
from datetime import datetime
from db import db


def process_pdf_with_pdfplumber(filepath, boxes):
    """Process PDF with pdfplumber using the provided boxes coordinates"""
    if not boxes:
        raise ValueError("No boxes provided for processing")

    results = []
    for page_num in boxes:
        if not boxes[page_num]:
            continue

        try:
            # Convert page number to zero-based index
            page_index = int(page_num) - 1
            # Convert target areas to list of tuples
            target_areas = [tuple(map(float, area.split(',')))
                            for area in boxes[page_num]]
            print(f"""Processing page {
                  page_num} with target areas: {target_areas}""")

            with pdfplumber.open(filepath) as pdf:
                if page_index < 0 or page_index >= len(pdf.pages):
                    print(f"Invalid page number {page_num}")
                    continue

                page = pdf.pages[page_index]
                # Process each box area individually
                page_texts = []
                for bbox in target_areas:
                    text = page.within_bbox(bbox).extract_text(
                        layout=True, y_density=9, x_density=9)
                    if text:
                        page_texts.append(text.strip())

                if page_texts:
                    text = '\n'.join(page_texts)
                    page_result = f"Page {page_num}:\n{text}"
                    result_doc = {
                        "text": page_result,
                        "page_number": int(page_num),
                        "file_path": filepath
                    }
                    results.append(result_doc)

        except (KeyError, IndexError) as e:
            print(f"Error processing page {page_num}: {str(e)}")
            continue
        except Exception as e:
            print(f"Unexpected error processing page {page_num}: {str(e)}")
            continue

    if not results:
        raise ValueError("No text was successfully extracted from the PDF")

    return results
