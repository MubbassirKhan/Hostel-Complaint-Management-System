from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
import bcrypt
from db import get_db_connection  # ✅ Your DB connection utility

router = APIRouter()

# -------------------- SCHEMAS --------------------
class WardenSignup(BaseModel):
    name: str
    mail: str
    phone: str
    password: str
    hid: int

class WardenLogin(BaseModel):
    mail: str
    password: str

# -------------------- SIGNUP --------------------
@router.post("/auth/warden/signup")
def warden_signup(details: WardenSignup):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM Warden WHERE Mail = %s", (details.mail,))
    if cur.fetchone():
        raise HTTPException(status_code=400, detail="Warden with this email already exists")

    hashed_pw = bcrypt.hashpw(details.password.encode(), bcrypt.gensalt()).decode()

    cur.execute("""
        INSERT INTO Warden (Name, Mail, Phone, Password, HID)
        VALUES (%s, %s, %s, %s, %s)
    """, (details.name, details.mail, details.phone, hashed_pw, details.hid))

    conn.commit()
    cur.close()
    conn.close()

    return {"status": "success", "message": "Warden registered successfully"}

# -------------------- LOGIN --------------------
@router.post("/auth/warden/login")
def warden_login(credentials: WardenLogin, request: Request, response: Response):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT WID, Name, Phone, HID, Password FROM Warden 
        WHERE Mail = %s
    """, (credentials.mail,))
    warden = cur.fetchone()
    cur.close()
    conn.close()

    if not warden:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    wid, name, phone, hid, hashed_password = warden

    if not bcrypt.checkpw(credentials.password.encode(), hashed_password.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # ✅ Store session
    request.session["warden"] = {
        "wid": wid,
        "name": name,
        "phone": phone,
        "hid": hid
    }

    return {
        "status": "success",
        "message": "Login successful",
        "warden": request.session["warden"]
    }

# -------------------- LOGOUT --------------------
@router.post("/auth/warden/logout")
def logout_warden(request: Request):
    request.session.clear()
    return {"status": "success", "message": "Logged out"}

# -------------------- PROFILE --------------------
@router.get("/warden/profile")
def get_profile(request: Request):
    warden = request.session.get("warden")
    if not warden:
        raise HTTPException(status_code=401, detail="Not logged in")
    return {"warden": warden}
