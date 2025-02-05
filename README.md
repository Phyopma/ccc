# CCC - PDF Processing and Loan Application System

A full-stack web application that combines PDF processing capabilities with loan application functionality. The system consists of a React frontend and a Flask backend.

## Project Structure

```
├── ccc_python/     # Backend Flask application
├── ccc_react/      # Frontend React application
├── uploads/        # PDF upload directory
└── start.sh        # Script to start both frontend and backend
```

## Features

- PDF Processing

  - Upload and process PDF documents
  - Extract text from specific regions of PDF files
  - Save and manage processed PDF data

- Loan Application System
  - User authentication
  - Loan application form with real-time validation
  - Credit score assessment
  - Automated loan approval decision

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd ccc_python
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd ccc_react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Option 1: Using the Start Script

Run both frontend and backend servers using the provided start script:

```bash
./start.sh
```

### Option 2: Manual Start

1. Start the backend server:

   ```bash
   cd ccc_python
   source .venv/bin/activate
   python server.py
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd ccc_react
   npm run dev
   ```

## Environment Configuration

### Backend Configuration

The backend configuration is managed in `ccc_python/config.py`:

- MongoDB connection settings
- JWT secret key
- Upload folder path
- Allowed file extensions

### Frontend Configuration

The frontend environment variables are managed in `.env` files:

- API endpoint configuration
- Development server settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
