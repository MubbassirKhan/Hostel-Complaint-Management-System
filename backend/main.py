# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from wardan import router as warden_router
from admin import router as admin_router
from db import get_db_connection  # ✅ make sure get_db_connection is importable



# Initialize FastAPI app
app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="your-very-secret-key")

# 👇 Mount the warden routes
app.include_router(warden_router)

# 👇 Mount the admin routes
app.include_router(admin_router)

# # CORS setup
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Change this for production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )



# Pydantic model for request
class UserAuthInput(BaseModel):
    shid: str
    pswd: str
from passlib.hash import bcrypt

@app.post("/userauth")
def create_user_auth(data: UserAuthInput):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # ✅ Check Student exists
        cursor.execute("SELECT SHID FROM Student WHERE SHID = %s", (data.shid,))
        if cursor.fetchone() is None:
            return {"status": "not_found", "message": "❌ SHID not found in Student table."}

        # ✅ Check if already registered
        cursor.execute("SELECT UID FROM UserAuth WHERE SHID = %s", (data.shid,))
        if cursor.fetchone() is not None:
            return {"status": "exists", "message": "⚠️ SHID already registered."}

        # ✅ Hash the password
        hashed_password = bcrypt.hash(data.pswd)

        # ✅ Insert hashed password
        cursor.execute(
            "INSERT INTO UserAuth (SHID, PSWD) VALUES (%s, %s)",
            (data.shid, hashed_password)
        )
        conn.commit()
        return {"status": "success", "message": "✅ User registered successfully."}

    except Exception as e:
        print("❌ Exception occurred:", str(e))
        return {"status": "error", "message": f"❌ Internal Server Error: {str(e)}"}

    finally:
        cursor.close()
        conn.close()

from fastapi import FastAPI, Request, Form
class UserLoginInput(BaseModel):
    shid: str
    pswd: str

@app.post("/login")
async def login(data: UserLoginInput, request: Request):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # ✅ Fetch hashed password from DB
        cursor.execute("SELECT SHID, PSWD FROM UserAuth WHERE SHID = %s", (data.shid,))
        result = cursor.fetchone()

        if result is None:
            return {"status": "not_found", "message": "❌ SHID not registered."}

        db_shid, hashed_pswd = result

        # ✅ Compare hash with entered password
        if not bcrypt.verify(data.pswd, hashed_pswd):
            return {"status": "invalid", "message": "❌ Incorrect password."}

        request.session["user"] = db_shid
        return {"status": "success", "message": "✅ Login successful."}

    except Exception as e:
        print("❌ Login error:", str(e))
        return {"status": "error", "message": f"❌ Server error: {str(e)}"}

    finally:
        cursor.close()
        conn.close()


@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"status": "success", "message": "🚪 Logged out successfully."}

@app.get("/session-check")
async def session_check(request: Request):
    user = request.session.get("user")
    if user:
        return {"logged_in": True, "shid": user}
    return {"logged_in": False}


@app.get("/dashboard/{shid}")
def get_student_dashboard(shid: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch Student Info
        cursor.execute("""
            SELECT S.SID, S.Name, S.Phone, S.Mail, S.DOB, S.SHID,
                   H.HID, H.Name AS HostelName, H.Location,
                   W.Name AS WardenName, W.Mail AS WardenMail, W.Phone AS WardenPhone
            FROM Student S
            JOIN Hostel H ON S.HID = H.HID
            LEFT JOIN Warden W ON H.HID = W.HID
            WHERE S.SHID = %s
        """, (shid,))
        student_row = cursor.fetchone()

        if not student_row:
            raise HTTPException(status_code=404, detail="Student not found")

        student_info = {
            "sid": student_row[0],
            "name": student_row[1],
            "phone": student_row[2],
            "mail": student_row[3],
            "dob": student_row[4],
            "shid": student_row[5],
            "hostel": {
                "hid": student_row[6],
                "name": student_row[7],
                "location": student_row[8]
            },
            "warden": {
                "name": student_row[9],
                "mail": student_row[10],
                "phone": student_row[11]
            }
        }

        # Complaint Stats
        cursor.execute("SELECT COUNT(*) FROM Complaint WHERE SID = %s", (student_info["sid"],))
        total_complaints = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM Complaint WHERE SID = %s AND Status = 'Pending'", (student_info["sid"],))
        pending = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM Complaint WHERE SID = %s AND Status = 'Resolved'", (student_info["sid"],))
        resolved = cursor.fetchone()[0]

        # Last 5 complaints
        cursor.execute("""
            SELECT Type, Status, Description, Created_at
            FROM Complaint
            WHERE SID = %s
            ORDER BY Created_at DESC
            LIMIT 5
        """, (student_info["sid"],))
        recent_complaints = cursor.fetchall()

        recent = [
            {
                "type": row[0],
                "status": row[1],
                "description": row[2],
                "created_at": row[3]
            }
            for row in recent_complaints
        ]

        cursor.close()
        conn.close()

        return {
            "student": student_info,
            "complaints": {
                "total": total_complaints,
                "pending": pending,
                "resolved": resolved,
                "recent": recent
            }
        }

    except Exception as e:
        print("❌ Dashboard Error:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

class ComplaintRequest(BaseModel):
    shid: str
    type: str
    description: str
    proof_image: str  # base64 (without prefix)

@app.post("/complaint/add")
def add_complaint(complaint: ComplaintRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT SID FROM Student WHERE SHID = %s", (complaint.shid,))
        student = cursor.fetchone()

        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        sid = student[0]

        cursor.execute("""
            INSERT INTO Complaint (SID, Type, Description, Status, ProofImage)
            VALUES (%s, %s, %s, %s, %s)
        """, (sid, complaint.type, complaint.description, "Pending", complaint.proof_image))

        conn.commit()
        cursor.close()
        conn.close()

        return {"status": "success", "message": "Complaint added successfully"}

    except Exception as e:
        print("❌ Error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/analytics/student/complaint-trend/{shid}")
def complaint_trend(shid: str, days: int = 7):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT SID FROM Student WHERE SHID = %s", (shid,))
    student = cur.fetchone()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    sid = student["sid"]

    cur.execute("""
        SELECT 
            TO_CHAR(d::date, 'YYYY-MM-DD') AS day,
            COUNT(c.cid) AS total,
            COUNT(CASE WHEN c.iswithdrawn THEN 1 END) AS withdrawn
        FROM generate_series(
            CURRENT_DATE - %s + 1,
            CURRENT_DATE,
            '1 day'
        ) AS d
        LEFT JOIN complaint c ON DATE_TRUNC('day', c.created_at) = d::date AND c.sid = %s
        GROUP BY day ORDER BY day
    """, (days, sid))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return {
        "labels": [r["day"] for r in rows],
        "totalComplaints": [r["total"] for r in rows],
        "withdrawnComplaints": [r["withdrawn"] for r in rows]
    }

# ✅ Route that returns complaints with base64 image + prefix
@app.get("/dashboard/{shid}")
def get_dashboard(shid: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get student info
        cursor.execute("""
            SELECT SID, SHID, Name, Mail, Phone, DOB, HostelID 
            FROM Student 
            WHERE SHID = %s
        """, (shid,))
        student = cursor.fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        sid = student[0]
        student_info = {
            "sid": student[0],
            "shid": student[1],
            "name": student[2],
            "mail": student[3],
            "phone": student[4],
            "dob": student[5],
        }

        # Hostel & Warden info (optional)
        cursor.execute("""
            SELECT H.Name, H.Location, W.Name, W.Phone 
            FROM Hostel H
            JOIN Warden W ON H.WID = W.WID
            WHERE H.HID = %s
        """, (student[6],))
        hostel = cursor.fetchone()
        student_info["hostel"] = {
            "name": hostel[0],
            "location": hostel[1]
        }
        student_info["warden"] = {
            "name": hostel[2],
            "phone": hostel[3]
        }

        # Complaints info
        cursor.execute("""
            SELECT Type, Description, Status, Created_at, ProofImage 
            FROM Complaint 
            WHERE SID = %s
            ORDER BY Created_at DESC
            LIMIT 5
        """, (sid,))
        complaints = cursor.fetchall()

        recent_complaints = []
        for c in complaints:
            image_data = c[4]
            if image_data:
                # Add proper prefix for frontend display
                image_src = f"data:image/png;base64,{image_data}"
            else:
                image_src = None
            recent_complaints.append({
                "type": c[0],
                "description": c[1],
                "status": c[2],
                "created_at": c[3],
                "proof_image": image_src
            })

        # Count totals
        cursor.execute("SELECT COUNT(*) FROM Complaint WHERE SID = %s", (sid,))
        total = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Complaint WHERE SID = %s AND Status = 'Pending'", (sid,))
        pending = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Complaint WHERE SID = %s AND Status = 'Resolved'", (sid,))
        resolved = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return {
            "student": student_info,
            "complaints": {
                "recent": recent_complaints,
                "total": total,
                "pending": pending,
                "resolved": resolved
            }
        }

    except Exception as e:
        print("❌ Error fetching dashboard:", e)
        raise HTTPException(status_code=500, detail="Internal server error")
from fastapi import APIRouter, HTTPException
import base64

@app.get("/fetch_complaint/{shid}")
def fetch_complaints_by_shid(shid: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get SID from SHID
        cursor.execute("SELECT SID FROM Student WHERE SHID = %s", (shid,))
        student = cursor.fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        sid = student[0]

        # Fetch complaints with necessary fields
        cursor.execute("""
            SELECT CID, Type, Description, Status, Created_at, ProofImage, 
                   COALESCE(WithdrawCount, 0), COALESCE(IsWithdrawn, FALSE)
            FROM Complaint 
            WHERE SID = %s 
            ORDER BY Created_at DESC
        """, (sid,))

        complaints = []
        for row in cursor.fetchall():
            cid, type_, desc, status, created_at, proof_image, withdraw_count, is_withdrawn = row

            # Convert binary image to base64 data URL if exists
            image_data = None
            if proof_image:
                image_data = f"data:image/png;base64,{proof_image.strip()}"

            complaints.append({
                "cid": cid,
                "type": type_,
                "description": desc,
                "status": status,
                "created_at": created_at,
                "proof_image": image_data,
                "withdraw_count": withdraw_count,
                "is_withdrawn": is_withdrawn,
            })

        return {"complaints": complaints}

    except Exception as e:
        print("❌ Error in fetch_complaints_by_shid:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

    finally:
        cursor.close()
        conn.close()


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi import Request, HTTPException
from pydantic import BaseModel

class WithdrawRequest(BaseModel):
    shid: str
    cid: int

@app.post("/complaint/withdraw")
async def withdraw_complaint(req: Request):
    body = await req.json()
    print("📦 Raw JSON Received:", body)

    # Parse and validate using Pydantic
    try:
        data = WithdrawRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid input format")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT SID FROM Student WHERE SHID = %s", (data.shid,))
        student = cursor.fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        sid = student[0]

        cursor.execute("""
            SELECT WithdrawCount, IsWithdrawn 
            FROM Complaint 
            WHERE CID = %s AND SID = %s
        """, (data.cid, sid))
        complaint = cursor.fetchone()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")

        withdraw_count, is_withdrawn = complaint

        if is_withdrawn:
            raise HTTPException(status_code=400, detail="Complaint already withdrawn")

        if withdraw_count >= 3:
            raise HTTPException(status_code=400, detail="Withdraw limit exceeded (Max 3 times)")

        cursor.execute("""
            UPDATE Complaint
            SET Status = 'Withdrawn',
                WithdrawCount = WithdrawCount + 1,
                IsWithdrawn = TRUE
            WHERE CID = %s AND SID = %s
        """, (data.cid, sid))

        conn.commit()

        return {"status": "success", "message": "Complaint withdrawn successfully"}

    finally:
        cursor.close()
        conn.close()





# Mail Sending to reset PSWD
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from email.message import EmailMessage
import psycopg2
from psycopg2.extras import RealDictCursor
import smtplib
import ssl
import os
from dotenv import load_dotenv
from passlib.hash import bcrypt  # for password hashing

# ✅ Load environment variables
load_dotenv()


# ✅ CORS middleware (must be before any routes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=["*"],  # Allow all headers including Content-Type
)


# ✅ Models
class ForgetPasswordRequest(BaseModel):
    shid: str

class ResetPasswordRequest(BaseModel):
    shid: str
    new_password: str

# ✅ Endpoint: Forgot Password (send email)
from fastapi import HTTPException
import traceback  # Optional: for debugging

@app.post("/auth/forgot-password")
def forgot_password(request: ForgetPasswordRequest, preview: bool = False):
    shid = request.shid

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Check SHID exists in both tables
        cur.execute("""
            SELECT s.name, s.mail
            FROM student s
            INNER JOIN userauth u ON s.shid = u.shid
            WHERE s.shid = %s
        """, (shid,))
        result = cur.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="❌ SHID not found or not registered.")

        user_email = result["mail"]
        user_name = result["name"]

        if preview:
            return {"name": user_name, "email": user_email}

        # Email sending
        reset_link = f"{os.environ.get('VITE_API_BASE_URL', 'http://localhost:5173')}/reset-password/{shid}"

        msg = EmailMessage()
        msg["Subject"] = "🔐 Password Reset Request – Hostel Management System"
        msg["From"] = "khanmkj96@gmail.com"
        msg["To"] = user_email
        msg.set_content(
            f"""
Dear {user_name},

We received a request to reset the password for your Hostel Management System account (SHID: {shid}).

To reset your password, click below:
{reset_link}

If this wasn't you, ignore this message.

Regards,  
Hostel Management System Team
"""
        )

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as smtp:
            smtp.login("khanmkj96@gmail.com", "axid glzi nbmi eloy")
            smtp.send_message(msg)

        return {"message": f"📨 Reset link sent to {user_email}"}

    except HTTPException as e:
        # Let FastAPI handle the 404 properly
        raise e

    except Exception as e:
        print("Internal server error:", traceback.format_exc())  # Optional for debugging
        raise HTTPException(status_code=500, detail="❌ Something went wrong. Please try again.")
        
    finally:
        if conn:
            conn.close()



# ✅ Endpoint: Reset Password
@app.post("/auth/reset-password")
def reset_password(request: ResetPasswordRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if SHID exists
        cur.execute("SELECT 1 FROM userauth WHERE shid = %s", (request.shid,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        # Hash password
        hashed_pw = bcrypt.hash(request.new_password)

        # Update password
        cur.execute("UPDATE userauth SET pswd = %s WHERE shid = %s", (hashed_pw, request.shid))
        conn.commit()

        return {"message": "Password reset successful"}

    except Exception as e:
        print("Password reset error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

    finally:
        if conn:
            conn.close()
