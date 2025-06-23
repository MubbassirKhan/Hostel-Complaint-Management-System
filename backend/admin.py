from fastapi import APIRouter, Request, Response, HTTPException
from pydantic import BaseModel

router = APIRouter()

# ----------------- SCHEMA -----------------
class AdminLogin(BaseModel):
    email: str
    password: str

# ----------------- HARDCODED CREDENTIALS -----------------
HARDCODED_ADMIN = {
    "email": "admin@hostel.com",
    "password": "admin123"  # You can change this
}

# ----------------- LOGIN ENDPOINT -----------------
@router.post("/auth/admin/login")
def admin_login(credentials: AdminLogin, request: Request):
    if (
        credentials.email == HARDCODED_ADMIN["email"] and
        credentials.password == HARDCODED_ADMIN["password"]
    ):
        request.session["admin"] = {
            "email": credentials.email,
            "role": "admin"
        }
        return {
            "status": "success",
            "message": "Admin logged in",
            "admin": request.session["admin"]
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

# ----------------- LOGOUT ENDPOINT -----------------
@router.post("/auth/admin/logout")
def admin_logout(request: Request):
    request.session.clear()
    return {"status": "success", "message": "Logged out"}

# ----------------- PROFILE ENDPOINT -----------------
@router.get("/admin/profile")
def get_admin_profile(request: Request):
    admin = request.session.get("admin")
    if not admin:
        raise HTTPException(status_code=401, detail="Not logged in")
    return {"admin": admin}
