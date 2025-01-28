#!/bin/bash

# Start React frontend development server
cd ccc_react
npm run dev &

# Start Flask backend server
cd ../ccc_python
source .venv/bin/activate
python server.py 



# Wait for both processes