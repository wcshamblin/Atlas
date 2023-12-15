tmux new-session -d -n "Atlas-API" python3 -m uvicorn --reload --workers 4 --port 5001 api:app
#python3 -m uvicorn --reload --workers 4 --port 5001 api:app
