from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routers import debate

app = FastAPI(title="agAInst API")

# --- RATE LIMITING ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please slow down and try again shortly."},
    )
# ----------------------

# --- UPTIME ROBOT HEAD REQUEST FIX ---


@app.middleware("http")
async def handle_head_requests(request: Request, call_next):
    if request.method == "HEAD":
        # Remap the method to GET so FastAPI routes it to your /health check
        request.scope["method"] = "GET"
        response = await call_next(request)
        # HEAD responses must have headers but NO body content
        return Response(headers=dict(response.headers), status_code=response.status_code)

    return await call_next(request)
# -------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://against-debate.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(debate.router, prefix="/debate", tags=["debate"])


@app.get("/health")
def health():
    return {"status": "ok"}
