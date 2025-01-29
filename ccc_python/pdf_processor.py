import camelot


def process_pdf_with_camelot(filepath, boxes):
    """Process PDF with camelot using the provided boxes coordinates"""
    if not boxes:
        raise ValueError("No boxes provided for processing")

    results = []
    for page_num in boxes:
        if not boxes[page_num]:
            continue

        try:
            target_areas = [box for box in boxes[page_num]]

            tables = camelot.read_pdf(filepath, pages=str(page_num),
                                      flavor='stream', table_areas=target_areas, row_tol=10, strip_text='\n', edge_tol=500)

            if len(tables) > 0:
                output_path = f'{filepath}_page{page_num}.csv'
                tables.export(output_path, f='csv')
                results.append(output_path)
        except (KeyError, IndexError) as e:
            print(f"Error processing page {page_num}: {str(e)}")
            continue
        except Exception as e:
            print(f"Unexpected error processing page {page_num}: {str(e)}")
            continue

    if not results:
        raise ValueError("No tables were successfully extracted from the PDF")

    return results
