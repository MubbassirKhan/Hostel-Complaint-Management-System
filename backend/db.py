import random
from datetime import datetime, timedelta
import psycopg2
from fastapi import FastAPI


# # Database connection function
# def get_db_connection():
#     return psycopg2.connect(
#         database="HostelDB",
#         user="postgres",
#         password="Khan@123",
#         host="localhost",
#         port="5433"
#     )
    
    
# # PostgreSQL connection
# conn = psycopg2.connect(
#     database="HostelDB",
#     user="postgres",
#     password="Khan@123",
#     host="localhost",
#     port="5433"
# )
# conn.autocommit = True
# cursor = conn.cursor()

# # Drop old tables
# cursor.execute("DROP TABLE IF EXISTS Complaint, UserAuth, Student, Room, Warden, Hostel CASCADE")


import psycopg2

# Database connection function for Render
def get_db_connection():
    return psycopg2.connect(
        database="hosteldb_bw4x",
        user="khan",
        password="OEqqvJAghwAIs9laObfPpTcDO7mNGVHt",
        host="dpg-d1d3koqdbo4c73cc1uv0-a.oregon-postgres.render.com",
        port="5432"  # default PostgreSQL port
    )

# PostgreSQL connection to Render
conn = psycopg2.connect(
    database="hosteldb_bw4x",
    user="khan",
    password="OEqqvJAghwAIs9laObfPpTcDO7mNGVHt",
    host="dpg-d1d3koqdbo4c73cc1uv0-a.oregon-postgres.render.com",
    port="5432"
)
conn.autocommit = True
cursor = conn.cursor()

# Drop old tables
cursor.execute("DROP TABLE IF EXISTS Complaint, UserAuth, Student, Room, Warden, Hostel CASCADE")

# Create tables

cursor.execute("""
CREATE TABLE Hostel (
    HID SERIAL PRIMARY KEY,
    Name VARCHAR(100),
    Location VARCHAR(100),
    NumberOfRooms INT
)
""")

cursor.execute("""
CREATE TABLE Warden (
    WID SERIAL PRIMARY KEY,
    Name VARCHAR(100),
    Mail VARCHAR(100),
    Phone VARCHAR(20),
    Password VARCHAR(100),
    HID INT REFERENCES Hostel(HID) ON DELETE CASCADE
)
""")


cursor.execute("""
CREATE TABLE Room (
    RID SERIAL PRIMARY KEY,
    RoomNumber VARCHAR(20),
    Capacity INT,
    HID INT REFERENCES Hostel(HID)
)
""")

cursor.execute("""
CREATE TABLE Student (
    SID SERIAL PRIMARY KEY,
    Name VARCHAR(100),
    Phone VARCHAR(20),
    Mail VARCHAR(100),
    DOB DATE,
    HID INT REFERENCES Hostel(HID),
    SHID VARCHAR(50) UNIQUE
)
""")

cursor.execute("""
CREATE TABLE UserAuth (
    UID SERIAL PRIMARY KEY,
    SHID VARCHAR(50) REFERENCES Student(SHID),
    PSWD VARCHAR(100)
)
""")

cursor.execute("""
CREATE TABLE Complaint (
    CID SERIAL PRIMARY KEY,
    SID INT REFERENCES Student(SID),
    Type VARCHAR(100),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(50) DEFAULT 'Pending',
    Description TEXT,
    ProofImage TEXT, -- stores base64 string
    WithdrawCount INT DEFAULT 0, -- how many times user withdrew this
    IsWithdrawn BOOLEAN DEFAULT FALSE -- whether it is withdrawn now
)
""")

# Insert 2 Hostels
cursor.execute("""
INSERT INTO Hostel (Name, Location, NumberOfRooms)
VALUES 
    ('Godavari', 'North Campus', 10),
    ('Ambedkar', 'South Campus', 15)
RETURNING HID
""")
hostel_ids = cursor.fetchall()

# Insert 20 Students
students = []
for i in range(1, 21):
    name = f"Student{i}"
    phone = f"98765432{random.randint(10, 99)}"
    mail = f"student{i}@example.com"
    dob = datetime(2000, 1, 1) + timedelta(days=random.randint(0, 7000))
    hid = hostel_ids[i % 2][0]  # alternate hostels
    shid = f"{name[:3].upper()}{hid}ID{i:03d}"
    students.append((name, phone, mail, dob.strftime("%Y-%m-%d"), hid, shid))

cursor.executemany("""
INSERT INTO Student (Name, Phone, Mail, DOB, HID, SHID)
VALUES (%s, %s, %s, %s, %s, %s)
""", students)

# Insert into UserAuth
cursor.execute("SELECT SHID FROM Student")
shids = cursor.fetchall()
user_auths = [(shid[0], f"pswd@{shid[0]}") for shid in shids]

# cursor.executemany("""
# INSERT INTO UserAuth (SHID, PSWD)
# VALUES (%s, %s)
# """, user_auths)

conn.commit()
cursor.close()
conn.close()
print("Tables created and 20 students + credentials inserted.")
