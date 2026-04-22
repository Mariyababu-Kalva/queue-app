from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional

app = FastAPI(title="Queue Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Updated State Management ---
# tokens: list of {"id": str, "status": str}
# status options: "waiting", "serving", "completed"
state = {
    "tokens": [], 
    "current_token": None,
    "total_issued": 0,
    "counter_number": 1
}

DIGIT_FORMAT = 3

@app.post("/api/token")
def generate_token():
    state["total_issued"] += 1

    token_number = str(state["total_issued"]).zfill(DIGIT_FORMAT)
    new_id = f"{token_number}"
    
    # Create token object
    new_token = {"id": new_id, "status": "waiting"}
    state["tokens"].append(new_token)
    
    return {
        "token": new_id, 
        "position": len([t for t in state["tokens"] if t["status"] == "waiting"])
    }

@app.post("/api/next")
def next_token():
    """Moves current to completed and finds the next waiting token."""
    # 1. Mark existing serving token as completed
    if state["current_token"]:
        for t in state["tokens"]:
            if t["id"] == state["current_token"]:
                t["status"] = "completed"

    # 2. Find next waiting token
    next_up = next((t for t in state["tokens"] if t["status"] == "waiting"), None)
    
    if next_up:
        next_up["status"] = "serving"
        state["current_token"] = next_up["id"]
        return {"current": next_up["id"], "status": "serving"}
    
    state["current_token"] = None
    return {"current": None, "message": "Queue Empty"}

@app.post("/api/complete")
def complete_service():
    # 1. Find the token that is currently 'serving'
    for t in state["tokens"]:
        if t["status"] == "serving":
            t["status"] = "completed"  # Update the status in the master list
            state["current_token"] = None    # Clear the desk display
            return {"message": "Service completed"}
            
    return {"message": "No active service to complete"}

@app.get("/api/admin/status")
def get_admin_status():
    return {
        "all_tokens": state["tokens"], # Sends entire history
        "current": state["current_token"],
        "total": state["total_issued"],
        "waiting_count": len([t for t in state["tokens"] if t["status"] == "waiting"])
    }

@app.get("/api/track/{token_id}")
def track_token(token_id: str):
    token_obj = next((t for t in state["tokens"] if t["id"] == token_id), None)
    if not token_obj:
        raise HTTPException(status_code=404, detail="Token not found")
    
    # Calculate position only among those waiting
    waiting_list = [t for t in state["tokens"] if t["status"] == "waiting"]
    position = 0
    if token_obj in waiting_list:
        position = waiting_list.index(token_obj)

    return {
        "token": token_id,
        "status": token_obj["status"],
        "peopleAhead": position,
        "waitTime": position * 10,
        "current": state["current_token"],
        "counter": state["counter_number"]
    }

@app.delete("/api/token/last")
def delete_last_token():
    # Find the last token issued
    if not state["tokens"]:
        raise HTTPException(status_code=400, detail="No tokens to delete")
    
    last_token = state["tokens"][-1]
    
    # Safety Check: Only delete if it hasn't been called yet
    if last_token["status"] == "waiting":
        state["tokens"].pop()
        state["total_issued"] -= 1
        return {"success": True, "message": f"Deleted {last_token['id']}"}
    
    return {"success": False, "message": "Cannot delete a token already in service"}

@app.post("/api/reset")
def reset_system():
    state["tokens"] = []
    state["current_token"] = None
    state["total_issued"] = 0
    return {"message": "System reset successfully"}