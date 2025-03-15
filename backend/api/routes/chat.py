from fastapi import WebSocket, WebSocketDisconnect, APIRouter, HTTPException, status,Depends
from db.database import chat_collection
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from api.utils import get_current_user
chat_router = APIRouter()

active_connections = {}

class SendMessageQuery(BaseModel):
    chat_id : str
    sender: str
    message : str
    
class CreateChatQuery(BaseModel):
    participants : list[str]
    
    
@chat_router.get("/{group_id}")
async def get_groupchat(group_id : str, current_user: dict = Depends(get_current_user)):
    
    chat = chat_collection.find_one({"group_id": ObjectId(group_id)})
    
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    
    if current_user["email"] not in chat["participants"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    
    chat["_id"] = str(chat["_id"])
    chat["group_id"] = str(chat["group_id"])
    return {"data": chat, "message": "Successful!"}
        
    

# REST API: Send a message (Stored in DB)
@chat_router.post("/messages")
async def send_message(req: SendMessageQuery, current_user: dict = Depends(get_current_user)):
    
    chat = chat_collection.find_one({"_id" : ObjectId(req.chat_id)})
    
    if req.sender != current_user["email"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sender emails does not match")
    
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    
    if req.sender not in chat["participants"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not in the chat")
    
    msg = {
        "sender": req.sender,
        "message": req.message,
        "delivered_time": datetime.now()
    }
    
    
    updated_chat = chat_collection.find_one_and_update(
        {"_id": ObjectId(chat["_id"])}, # find by user email
        {
            "$addToSet": {"chat_history": msg},
        }
        , return_document=True)    

    
    updated_chat["_id"] = str(updated_chat["_id"])
    updated_chat["group_id"] = str(updated_chat["group_id"])
    # if msg.chat_id in active_connections:
    #     # Send message in real-time via WebSocket if users are connected
    #     for ws in active_connections[msg.chat_id]:
    #         await ws.send_json(msg.dict())
    return {"Message": "Message sent", "data":updated_chat}

# # REST API: Get chat history
# @chat_router.get("/messages/{chat_id}")
# async def get_messages(chat_id: str):
#     return [msg for msg in messages if msg["chat_id"] == chat_id]

# # WebSocket: Handle real-time chat
# @chat_router.websocket("/ws/chat/{chat_id}")
# async def websocket_chat(chat_id: str, websocket: WebSocket):
#     await websocket.accept()

#     if chat_id not in active_connections:
#         active_connections[chat_id] = []
    
#     active_connections[chat_id].append(websocket)

#     try:
#         while True:
#             message = await websocket.receive_text()
#             # Store message in "DB"
#             messages.append({"chat_id": chat_id, "sender": "unknown", "message": message})
#             # Broadcast to all clients in this chat
#             for ws in active_connections[chat_id]:
#                 await ws.send_text(message)
#     except WebSocketDisconnect:
#         active_connections[chat_id].remove(websocket)
