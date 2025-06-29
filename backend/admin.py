# backend/admin.py
from datetime import datetime
from typing import Any, Dict, Optional

import psycopg
from psycopg.rows import dict_row
from fastapi import APIRouter, Depends, HTTPException, Request, Path
from pydantic import BaseModel

from db import get_db_connection  # helper that returns a psycopg.Connection

router = APIRouter(tags=["Admin"])

# ───────────────────────── SCHEMAS ──────────────────────────
class AdminLogin(BaseModel):
    email: str
    password: str


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    mail: Optional[str] = None
    dob: Optional[str] = None  # "YYYY-MM-DD"
    hid: Optional[int] = None


# ─── NEW: Warden schemas ───────────────────────────────────
class WardenCreate(BaseModel):
    name: str
    mail: str
    phone: str
    hid: int  # hostel id


class WardenUpdate(BaseModel):
    name: Optional[str] = None
    mail: Optional[str] = None
    phone: Optional[str] = None
    hid: Optional[int] = None
    # password may be set by warden later; admin cannot read it

# ─────────────────────── AUTH ROUTES ───────────────────────
@router.post("/auth/admin/login")
def admin_login(
    credentials: AdminLogin,
    request: Request,
    conn=Depends(get_db_connection)            # ⬅ DB connection injected
):
    """
    Verify the supplied e‑mail / password against the Admin table.
    On success store a session; otherwise 401.
    """
    from psycopg2.extras import RealDictCursor

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT name, email
            FROM   Admin
            WHERE  email    = %s
              AND  password = %s
            """,
            (credentials.email, credentials.password),
        )
        admin = cur.fetchone()

    if admin:
        request.session["admin"] = {
            "email": admin["email"],
            "name":  admin["name"],
            "role":  "admin",
        }
        return {
            "status": "success",
            "message": "Admin logged in",
            "admin":  request.session["admin"],
        }

    raise HTTPException(status_code=401, detail="Invalid admin credentials")

@router.post("/auth/admin/logout")
def admin_logout(request: Request):
    request.session.clear()
    return {"status": "success", "message": "Logged out"}


@router.get("/admin/profile")
def get_admin_profile(request: Request):
    admin = request.session.get("admin")
    if not admin:
        raise HTTPException(status_code=401, detail="Not logged in")
    return {"admin": admin}


# ───────────────────── ANALYTICS ROUTE ─────────────────────
import psycopg2
from psycopg2.extras import RealDictCursor


@router.get("/admin/analytics")
def admin_analytics(conn=Depends(get_db_connection)):
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM Hostel ORDER BY HID")
            hostels = cur.fetchall()

            cur.execute("SELECT * FROM Room ORDER BY RID")
            rooms = cur.fetchall()

            cur.execute("SELECT * FROM Warden ORDER BY WID")
            wardens = cur.fetchall()

            cur.execute(
                """
                SELECT s.*, h.Name AS hostel_name
                FROM Student s
                JOIN Hostel h ON s.HID = h.HID
                ORDER BY s.SID
                """
            )
            students = cur.fetchall()

            cur.execute(
                """
                SELECT c.*, s.SHID, s.Name AS student_name
                FROM Complaint c
                JOIN Student s ON s.SID = c.SID
                ORDER BY c.CID DESC
                """
            )
            complaints = cur.fetchall()

            cur.execute("SELECT COUNT(*) AS n FROM Student")
            student_count = cur.fetchone()["n"]

            cur.execute(
                "SELECT COUNT(*) AS n FROM Complaint WHERE Status = 'Pending'"
            )
            complaints_open = cur.fetchone()["n"]

        return {
            "hostels": hostels,
            "rooms": rooms,
            "wardens": wardens,
            "students": students,
            "complaints": complaints,
            "meta": {
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "student_count": student_count,
                "complaints_open": complaints_open,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ───────────────────── STUDENT MANAGEMENT ─────────────────────
@router.get("/admin/students")
def get_all_students(conn=Depends(get_db_connection)):
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT s.SID, s.Name, s.Phone, s.Mail, s.DOB, s.HID,
                       s.SHID, h.Name AS hostel_name
                FROM   Student s
                JOIN   Hostel  h ON s.HID = h.HID
                ORDER  BY s.SID
                """
            )
            return {"students": cur.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/student/{sid}")
def update_student(sid: int, payload: StudentUpdate, conn=Depends(get_db_connection)):
    fields, values = [], []

    if payload.name:
        fields.append("Name = %s")
        values.append(payload.name)
    if payload.phone:
        fields.append("Phone = %s")
        values.append(payload.phone)
    if payload.mail:
        fields.append("Mail = %s")
        values.append(payload.mail)
    if payload.dob:
        fields.append("DOB = %s")
        values.append(payload.dob)
    if payload.hid:
        fields.append("HID = %s")
        values.append(payload.hid)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided")

    values.append(sid)
    query = f"UPDATE Student SET {', '.join(fields)} WHERE SID = %s"

    try:
        with conn.cursor() as cur:
            cur.execute(query, values)
        conn.commit()
        return {"status": "success", "message": "Student updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/student/{sid}")
def delete_student(sid: int, conn=Depends(get_db_connection)):
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT SHID FROM Student WHERE SID = %s", (sid,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Student not found")

            shid = res[0]
            cur.execute("DELETE FROM UserAuth WHERE SHID = %s", (shid,))
            cur.execute("DELETE FROM Student WHERE SID = %s", (sid,))

        conn.commit()
        return {"status": "success", "message": "Student deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ───────────────────── WARDEN MANAGEMENT ─────────────────────

@router.get("/admin/wardens")
def get_all_wardens(conn=Depends(get_db_connection)):
    """List all wardens (password hidden)."""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT w.WID, w.Name, w.Mail, w.Phone,
                       h.Name AS hostel_name, w.HID
                FROM   Warden w
                JOIN   Hostel h ON w.HID = h.HID
                ORDER  BY w.WID
                """
            )
            return {"wardens": cur.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ───────────────────── WARDEN MANAGEMENT ─────────────────────

@router.post("/admin/warden")
def create_warden(payload: WardenCreate, conn=Depends(get_db_connection)):
    """
    Add a new warden with default password:
        first_name@123   (e.g.  "Priya" -> "priya@123")
    """
    # 1️⃣ derive first‑name password -----------------------------------------
    first_name = payload.name.strip().split()[0].lower()
    default_pwd = f"{first_name}@123"

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO Warden (Name, Mail, Phone, Password, HID)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING WID
                """,
                (
                    payload.name,
                    payload.mail,
                    payload.phone,
                    default_pwd,      # 2️⃣ store generated password
                    payload.hid,
                ),
            )
            wid = cur.fetchone()[0]
        conn.commit()

        # 3️⃣ return the password so the admin can share it
        return {
            "status": "success",
            "message": "Warden added",
            "wid": wid,
            "default_password": default_pwd,
        }

    except psycopg.errors.ForeignKeyViolation:
        raise HTTPException(status_code=400, detail="Invalid HID (hostel not found)")
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=400, detail="Duplicate e‑mail or phone")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.put("/admin/warden/{wid}")
def update_warden(
    wid: int, payload: WardenUpdate, conn=Depends(get_db_connection)
):
    """Admin can update warden contact/hostel (not password)."""
    fields, vals = [], []
    if payload.name:
        fields.append("Name = %s")
        vals.append(payload.name)
    if payload.mail:
        fields.append("Mail = %s")
        vals.append(payload.mail)
    if payload.phone:
        fields.append("Phone = %s")
        vals.append(payload.phone)
    if payload.hid:
        fields.append("HID = %s")
        vals.append(payload.hid)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided")

    vals.append(wid)
    q = f"UPDATE Warden SET {', '.join(fields)} WHERE WID = %s"

    try:
        with conn.cursor() as cur:
            cur.execute(q, vals)
        conn.commit()
        return {"status": "success", "message": "Warden updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/warden/{wid}")
def delete_warden(wid: int, conn=Depends(get_db_connection)):
    """Remove a warden (cascade deletes handled by FK constraints)."""
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM Warden WHERE WID = %s", (wid,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Warden not found")
        conn.commit()
        return {"status": "success", "message": "Warden deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel, Field

# how many days until a complaint is considered “over‑due”
DEFAULT_OVERDUE_DAYS = 3


class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., examples=["Resolved", "In‑Progress", "Rejected"])


@router.get("/admin/complaints")
def list_complaints(conn=Depends(get_db_connection)):
    """
    Return every complaint with hostel & warden context + age (days since created).
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    c.*,
                    EXTRACT(EPOCH FROM (NOW() - c.Created_at))/86400 AS age_days,
                    s.Name       AS student_name,
                    s.SHID,
                    h.HID, h.Name AS hostel_name,
                    w.WID, w.Name AS warden_name
                FROM   Complaint  c
                JOIN   Student    s ON s.SID = c.SID
                JOIN   Hostel     h ON h.HID = s.HID
                JOIN   Warden     w ON w.HID = h.HID
                ORDER  BY c.CID DESC
                """
            )
            return {"complaints": cur.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/complaints/summary")
def complaint_summary(conn=Depends(get_db_connection)):
    """
    Aggregate counts (total / pending / resolved / overdue) **per hostel**.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"""
                WITH ages AS (
                    SELECT
                      h.HID,
                      h.Name AS hostel_name,
                      c.Status,
                      (NOW() - c.Created_at) > INTERVAL '{DEFAULT_OVERDUE_DAYS} day' AS is_overdue
                    FROM Complaint c
                    JOIN Student   s ON s.SID = c.SID
                    JOIN Hostel    h ON h.HID = s.HID
                )
                SELECT
                  HID,
                  hostel_name,
                  COUNT(*)                    AS total,
                  COUNT(*) FILTER (WHERE Status = 'Pending')  AS pending,
                  COUNT(*) FILTER (WHERE Status = 'Resolved') AS resolved,
                  COUNT(*) FILTER (WHERE is_overdue AND Status = 'Pending') AS overdue
                FROM ages
                GROUP BY HID, hostel_name
                ORDER BY HID;
                """
            )
            return {"summary": cur.fetchall(), "overdue_threshold_days": DEFAULT_OVERDUE_DAYS}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/complaints/overdue")
def overdue_complaints(
    days: int = DEFAULT_OVERDUE_DAYS, conn=Depends(get_db_connection)
):
    """
    List *pending* complaints older than `days` (default = 3).
    Also returns the linked warden so admin can warn / replace them.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    c.CID,
                    c.Type,
                    c.Created_at,
                    s.Name  AS student_name,
                    h.Name  AS hostel_name,
                    w.WID,
                    w.Name  AS warden_name,
                    EXTRACT(EPOCH FROM (NOW() - c.Created_at))/86400 AS age_days
                FROM   Complaint c
                JOIN   Student   s ON s.SID = c.SID
                JOIN   Hostel    h ON h.HID = s.HID
                JOIN   Warden    w ON w.HID = h.HID
                WHERE  c.Status = 'Pending'
                AND    NOW() - c.Created_at > INTERVAL %s
                ORDER  BY age_days DESC
                """,
                (f"{days} day",),
            )
            return {"overdue": cur.fetchall(), "threshold_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/complaint/{cid}/status")
def update_complaint_status(
    cid: int, payload: ComplaintStatusUpdate, conn=Depends(get_db_connection)
):
    """
    Admin (or warden) marks a complaint with a new status.
    Allowed statuses are free‑form; UI should standardize values.
    """
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE Complaint SET Status = %s WHERE CID = %s RETURNING CID",
                (payload.status, cid),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Complaint not found")
        conn.commit()
        return {"status": "success", "cid": cid, "new_status": payload.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ───────────────────── ADMIN‑MANAGEMENT ROUTES ─────────────────────
from pydantic import BaseModel, EmailStr
from typing import Optional
from psycopg2.extras import RealDictCursor


# incoming payloads
class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


def _require_admin(request: Request):
    """Helper to ensure the caller is an authenticated admin."""
    admin = request.session.get("admin")
    if not admin:
        raise HTTPException(status_code=401, detail="Not logged in")
    return admin


@router.post("/admin/admins", status_code=201)
def add_admin(payload: AdminCreate, request: Request, conn=Depends(get_db_connection)):
    """
    Add (assign) another admin.
    Only an authenticated admin may call this.
    """
    _require_admin(request)

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO Admin (Name, Email, Password)
                VALUES (%s, %s, %s)
                RETURNING AID
                """,
                (payload.name, payload.email, payload.password),
            )
            new_id = cur.fetchone()[0]
        conn.commit()
        return {"status": "success", "aid": new_id}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/admins/me")
def update_my_admin(payload: AdminUpdate, request: Request, conn=Depends(get_db_connection)):
    """
    Update the currently‑logged‑in admin's details.
    """
    curr = _require_admin(request)

    fields, vals = [], []
    if payload.name:
        fields.append("Name = %s")
        vals.append(payload.name)
    if payload.email:
        fields.append("Email = %s")
        vals.append(payload.email)
    if payload.password:
        fields.append("Password = %s")
        vals.append(payload.password)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided")

    vals.append(curr["email"])  # where‑clause value

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE Admin SET {', '.join(fields)} WHERE Email = %s",
                vals,
            )
        conn.commit()

        # refresh session info if e‑mail / name changed
        if payload.email:
            request.session["admin"]["email"] = payload.email
        if payload.name:
            request.session["admin"]["name"] = payload.name

        return {"status": "success", "message": "Profile updated"}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=400, detail="E‑mail already in use")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
