from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.middleware import validate_user_role
from app.routers import auth, users, requirements, resources, contracts, billing, dashboard, notifications, messages, subscriptions, analytics

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BenchAstra API", version="1.0.0", redirect_slashes=False)

# Configure CORS - Allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def role_validation_middleware(request: Request, call_next):
    return await validate_user_role(request, call_next)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(requirements.router)
app.include_router(resources.router)
app.include_router(contracts.router)
app.include_router(billing.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(messages.router)
app.include_router(subscriptions.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {"message": "BenchAstra API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}