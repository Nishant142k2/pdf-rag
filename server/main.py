from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  
from middlewares.exception_handlers import catch_exception_middleware
from routes.upload import router as upload_router
from routes.chat import router as chat_router
from dotenv import load_dotenv
import os
import uvicorn
load_dotenv()
app = FastAPI(title= "RAG API", description= "RAG API for PDF Reader", version= "1.0.0") 

#CORS Setup

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


#Middleware exception handler
app.middleware("http")(catch_exception_middleware)  
#routers
#1 Upload PDF documents
app.include_router(upload_router)
#2 Asking 
app.include_router(chat_router)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

