import bson.errors
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, HTTPException, status,Depends
from db.database import chat_collection
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from api.utils import get_current_user
import asyncio
import bson
chat_router = APIRouter()

active_connections = {}

class SendMessageQuery(BaseModel):
    chat_id : str
    sender: str
    message : str
    
class CreateChatQuery(BaseModel):
    participants : list[str]
    
    
@chat_router.get("/api/chat/{group_id}")
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
# @chat_router.post("/api/chat/messages")
# async def send_message(req: SendMessageQuery, current_user: dict = Depends(get_current_user)):
    
#     chat = chat_collection.find_one({"_id" : ObjectId(req.chat_id)})
    
#     if req.sender != current_user["email"]:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sender emails does not match")
    
#     if chat is None:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    
#     if req.sender not in chat["participants"]:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not in the chat")
    
#     msg = {
#         "sender": req.sender,
#         "message": req.message,
#         "delivered_time": datetime.now()
#     }
    
    
#     updated_chat = chat_collection.find_one_and_update(
#         {"_id": ObjectId(chat["_id"])}, # find by user email
#         {
#             "$addToSet": {"chat_history": msg},
#         }
#         , return_document=True)    

    
#     updated_chat["_id"] = str(updated_chat["_id"])
#     updated_chat["group_id"] = str(updated_chat["group_id"])
#     if req.chat_id in active_connections:
#         msg["delivered_time"] = msg["delivered_time"].isoformat()
#         # Send message in real-time via WebSocket if users are connected
#         for ws in active_connections[req.chat_id]:
#             await ws.send_json(msg)
#     return {"Message": "Message sent", "data":updated_chat}


# wscat -c ws://localhost:8000/api/chat/ws/chat/67d5cf2f40c6349bfba2112d

# Active WebSocket connections
active_connections = {}

# guide for frontend:
# The frontend should send a heatbeat message to the websock every 50 seconds
# We are going to keep the socket connection open all the time after the user open the "Chat" until the user close the chat
# Conditions where the conection ends:
#   User close the browser (no longer sending heatbeat message and the server will disconnect automaticallu ) OR
#   Or When the frontend send in a message with "close_connection" as True

# message format from frontend:
# {
#     "message": str
#     "close_connection" : bool
#     "is_heartbeat_msg" : bool
# }

@chat_router.websocket("/ws/chat/{chat_id}/{sender_email}")
async def websocket_chat(chat_id: str, sender_email : str, websocket: WebSocket):
    print(f"New WebSocket connection request for chat: {chat_id}")
    await websocket.accept()
    print(f"WebSocket connection accepted for chat: {chat_id}")
    
    try:
        chat = chat_collection.find_one({"_id": ObjectId(chat_id)})
    except bson.errors.BSONError:
        await websocket.send_json({"message":f"Chat {chat_id} does not exist"})
        await websocket.close()
        return  # Exit the function
    
    if not chat:
        await websocket.send_json({"message":f"Chat {chat_id} does not exist"})
        await websocket.close()
        return  # Exit the function
    # print(chat)
    # print("participants", chat["participants"])
    if sender_email not in chat["participants"]:
        await websocket.send_json({"message" : "You are not authorized to join this chat"})
        await websocket.close()
        return

    # Add WebSocket to active connections
    if chat_id not in active_connections:
        active_connections[chat_id] = []
    print(f"Added websocket to chat: {chat_id}")
    active_connections[chat_id].append(websocket)

    try:
        while True:
            try:
                # Set a timeout of 30 seconds for receiving messages
                message = await asyncio.wait_for(websocket.receive_json(), timeout=50)
                # print("message", message)
                if "close_connection" in message:
                    if message["close_connection"] == True or message["close_connection"] == "True":
                        print(f"Received close request from {message["sender_email"]} in chat {chat_id}")
                        await websocket.send_json({"message":"Close Connection request is successful"})
                        break
                    
                if "is_heartbeat_msg" in message:
                    if message["is_heartbeat_msg"] == True or message["is_heartbeat_msg"] == "True":
                        await websocket.send_json({"message": "Health ping received!", "live_users": len(active_connections[chat_id])})
                        continue
                
                # Create message object
                new_msg_obj = {
                    "sender": sender_email, 
                    "message": message["message"],
                    "delivered_time": datetime.now()  # Use UTC time for consistency
                }
            
                # Save to MongoDB chat history
                chat_collection.find_one_and_update(
                    {"_id": ObjectId(chat_id)},
                    {"$addToSet": {"chat_history": new_msg_obj}},
                    return_document=True
                )
                new_msg_obj["delivered_time"] = new_msg_obj["delivered_time"].isoformat()
                new_msg_obj["live_users"] = len(active_connections[chat_id])
                # Broadcast to all clients in this chat
                for ws  in active_connections[chat_id]:
                    await ws.send_json(new_msg_obj)

            except asyncio.TimeoutError:
                print(f"WebSocket for chat {chat_id} inactive for 30s. Closing connection.")
                
                break  # Exit the loop to close the connection

    except WebSocketDisconnect:
        print(f"WebSocket disconnected from chat {chat_id}")

    finally:
        # Cleanup: Remove WebSocket connection
        if websocket in active_connections[chat_id]:
            active_connections[chat_id].remove(websocket)
        
        if not active_connections[chat_id]:
            del active_connections[chat_id]

        await websocket.close()
        print(f"WebSocket connection for chat {chat_id} closed")



# '{"message": "test 3", "close_connection" : "True", "is_heartbeat_msg" : "False"}'