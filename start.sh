#!/bin/bash

# Start Flask backend server
cd ccc_python
source .venv/bin/activate
python server.py &

# Start React frontend development server
cd ../ccc_react
npm run dev &

# Wait for both processes
wait