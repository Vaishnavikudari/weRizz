import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

if "HF_HUB_OFFLINE" not in os.environ:
    os.environ["HF_HUB_OFFLINE"] = "0"
if "TRANSFORMERS_OFFLINE" not in os.environ:
    os.environ["TRANSFORMERS_OFFLINE"] = "0"

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from app.core.config import settings

from app.api.endpoints import router as api_router 
from app.api import chat_endpoint 

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (for reports / audio / icons)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# Include API routers FIRST
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(chat_endpoint.router, prefix=settings.API_V1_STR)

# 1. Health check endpoints (essential for Render health check ping)
@app.get('/health')
def root_health():
    return {'status': 'ok', 'app': settings.PROJECT_NAME}

@app.get('/api/health')
def api_health_check():
    return {'status': 'ok', 'app': settings.PROJECT_NAME}

# 2. Report page
@app.get("/report", response_class=HTMLResponse)
async def get_report_page():
    if os.path.exists("app/templates/report.html"):
        with open("app/templates/report.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Mavora AI Report</h1><p>Report template not found.</p>")

# 3. Root Endpoint
@app.get("/")
def root():
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")
    return {"message": "Mavora AI / WeRizz API is running (Dev Mode)", "status": "ok"}

# 4. Frontend SPA Serving (Catch-all placed LAST to avoid intercepting API or health checks)
if os.path.exists("frontend/dist"):
    if os.path.exists("frontend/dist/assets"):
        app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Never swallow API routes
        if full_path.startswith("api/") or full_path == "api":
            return JSONResponse(status_code=404, content={"error": "API route not found"})
        if full_path == "health":
            return {'status': 'ok', 'app': settings.PROJECT_NAME}
            
        file_path = f"frontend/dist/{full_path}"
        if os.path.exists(file_path) and not os.path.isdir(file_path):
            return FileResponse(file_path)
            
        return FileResponse("frontend/dist/index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
