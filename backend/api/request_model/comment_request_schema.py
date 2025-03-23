from pydantic import BaseModel

class AddCommentRequest(BaseModel):
    content: str  # comment text to add to the task
