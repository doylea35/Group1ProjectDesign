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


# wscat -c ws://localhost:8000/api/chat/ws/chat/67d5cf2f40c6349bfba2112d



import asyncio
# Active WebSocket connections
active_connections = {}

@chat_router.websocket("/ws/chat/{user_email}/{chat_id}")
async def websocket_chat(user_email: str, chat_id: str, websocket: WebSocket):
    print("Waiting to accept WebSocket connection...")
    await websocket.accept()

    # Add WebSocket to active connections
    if chat_id not in active_connections:
        active_connections[chat_id] = []
    
    active_connections[chat_id].append(websocket)
    print(f"Added WebSocket to chat: {chat_id}")

    try:
        while True:
            try:
                # Set a timeout of 30 seconds for receiving messages
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)

                # Create message object
                new_msg_obj = {
                    "sender": user_email, 
                    "message": message,
                    "delivered_time": datetime.utcnow()  # Use UTC time for consistency
                }
                
                # Save to MongoDB chat history
                chat_collection.find_one_and_update(
                    {"_id": ObjectId(chat_id)},
                    {"$addToSet": {"chat_history": new_msg_obj}},
                    return_document=True
                )    

                # Broadcast to all clients in this chat
                for ws in active_connections[chat_id]:
                    await ws.send_text(message)

            except asyncio.TimeoutError:
                print(f"WebSocket for chat {chat_id} inactive for 30s. Closing connection.")
                
                break  # Exit the loop to close the connection

    except WebSocketDisconnect:
        print(f"WebSocket disconnected from chat {chat_id}")

    finally:
        # Cleanup: Remove WebSocket connection
        active_connections[chat_id].remove(websocket)
        if len(active_connections[chat_id]) == 0:
            del active_connections[chat_id]
        await websocket.close()
        print(f"WebSocket connection for chat {chat_id} closed")
