from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

# Load API Key from environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

calendar_router = APIRouter()

# Define a request model
class ChatRequest(BaseModel):
    prompt: str
    max_tokens: int = 10000

@calendar_router.post("/getFreeTime")
async def ask_chatgpt_for_free_time(request: ChatRequest):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": request.prompt}],
            max_tokens=request.max_tokens
        )
        return {"response": response["choices"][0]["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# message = ChatRequest(prompt="""Here is the free time for three people: Claire: 11:00-13:00, 14:00-16:00, Jack: 14:00-14:30, Ennis: 14:00-15:00, 09:00-10:00", find the time slot where everyone is free""")


