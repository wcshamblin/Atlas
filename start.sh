#tmux new-session -d -n "Atlas-API" python3 -m uvicorn --workers 4 --port 5000 api.api:app
python3 -m uvicorn --reload --workers 4 --port 5001 api.api:app
