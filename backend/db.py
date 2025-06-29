# db.py — FINAL VERSION
import random
from datetime import datetime, timedelta
import psycopg2


def get_db_connection():
    return psycopg2.connect(
        database="HostelDB",
        user="postgres",
        password="Khan@123",
        host="localhost",
        port="5433",
    )


TABLE_SQL = [
    "DROP TABLE IF EXISTS Complaint, UserAuth, Student, Room, Warden, Hostel, Admin  CASCADE",

    """
    CREATE TABLE Hostel (
        HID SERIAL PRIMARY KEY,
        Name VARCHAR(100),
        Location VARCHAR(100),
        NumberOfRooms INT
    )
    """,

    """
    CREATE TABLE Warden (
        WID SERIAL PRIMARY KEY,
        Name VARCHAR(100),
        Mail VARCHAR(100),
        Phone VARCHAR(20),
        Password VARCHAR(100),
        HID INT REFERENCES Hostel(HID) ON DELETE CASCADE
    )
    """,

    """
    CREATE TABLE Room (
        RID SERIAL PRIMARY KEY,
        RoomNumber VARCHAR(20),
        Capacity INT,
        HID INT REFERENCES Hostel(HID)
    )
    """,

    """
    CREATE TABLE Student (
        SID SERIAL PRIMARY KEY,
        Name VARCHAR(100),
        Phone VARCHAR(20),
        Mail VARCHAR(100),
        DOB DATE,
        HID INT REFERENCES Hostel(HID),
        SHID VARCHAR(50) UNIQUE
    )
    """,

    """
    CREATE TABLE UserAuth (
        UID SERIAL PRIMARY KEY,
        SHID VARCHAR(50) REFERENCES Student(SHID),
        PSWD VARCHAR(100)
    )
    """,

    """
    CREATE TABLE Complaint (
        CID SERIAL PRIMARY KEY,
        SID INT REFERENCES Student(SID),
        Type VARCHAR(100),
        Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        Status VARCHAR(50) DEFAULT 'Pending',
        Description TEXT,
        ProofImage TEXT,
        WithdrawCount INT DEFAULT 0,
        IsWithdrawn BOOLEAN DEFAULT FALSE
    )
    """,
    """
    CREATE TABLE Admin (
        AID         SERIAL PRIMARY KEY,
        Email       VARCHAR(150) UNIQUE NOT NULL,
        Password    VARCHAR(100)        NOT NULL,
        Name        VARCHAR(100),
        Created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# ────────────────────────────────────────────────────────────────
# helper to create the Admin table *and* seed two default admins
# call this just after the other TABLE_SQL statements run
# ────────────────────────────────────────────────────────────────
def create_admin_table_and_seed(cursor):
    # 2️⃣  insert two default admin rows
    cursor.execute("""
        INSERT INTO Admin (Email, Password, Name) VALUES
            ('admin',   'admin@123',   'Admin'),
            ('Santosh', 'Santosh@123', 'Santosh')
        ON CONFLICT (Email) DO NOTHING
    """)


def seed_boys_hostel_demo_data(cursor):
    # Hostels
    hostels = [
        ("Godavari",   "Narayanpura, College Road", 120),
        ("Krishna",    "K. C. Park", 100),
        ("Netravati",  "Karnatak Arts College Campus", 80),
        ("Spoorthi",   "College of Agriculture Campus", 150),
        ("Raith Bhavan", "College of Agriculture Campus", 60),
    ]
    hostel_ids = []
    for hostel in hostels:
        cursor.execute(
            "INSERT INTO Hostel (Name, Location, NumberOfRooms) VALUES (%s, %s, %s) RETURNING HID",
            hostel,
        )
        hostel_ids.append(cursor.fetchone()[0])

    # Wardens
    warden_names = [
        "Shankar Pai", "Rakesh Lingam", "Vishal Patil",
        "Suresh Kulkarni", "Anand Desai",
    ]
    wardens = []
    for name, hid in zip(warden_names, hostel_ids):
        phone = f"98{random.randint(10000000, 99999999)}"
        mail = name.lower().replace(" ", "") + "@example.com"
        password = "warden@" + name.split()[0].lower()
        wardens.append((name, mail, phone, password, hid))

    cursor.executemany(
        "INSERT INTO Warden (Name, Mail, Phone, Password, HID) VALUES (%s, %s, %s, %s, %s)",
        wardens,
    )

    # Rooms per hostel (2 to 5 each)
    room_entries = []
    for hid in hostel_ids:
        num_rooms = random.randint(2, 5)
        for r in range(1, num_rooms + 1):
            room_number = f"R{hid}{r:02d}"  # e.g., R101, R102
            capacity = random.choice([2, 3, 4])
            room_entries.append((room_number, capacity, hid))

    cursor.executemany(
        "INSERT INTO Room (RoomNumber, Capacity, HID) VALUES (%s, %s, %s)",
        room_entries
    )

    # Students
    first_names = [
        "Khan", "Amol", "Affan", "Afnan", "Anmol", "Santosh", "Anil", "Sameer",
        "Rohit", "Vishal", "Yash", "Pavan", "Raj", "Arjun", "Deepak",
        "Nitin", "Sagar", "Sumit", "Prakash", "Naveen", "Darshan", "Harish",
        "Rahul", "Abhishek", "Girish", "Mahesh", "Neeraj", "Shivam", "Vinay",
        "Lokesh",
    ]
    surnames = ["Patil", "Khan", "Desai", "Kulkarni", "Joshi"]

    students = []
    for i in range(30):
        first = random.choice(first_names)
        last = random.choice(surnames)
        full_name = f"{first} {last}"
        phone = f"97{random.randint(10000000, 99999999)}"
        mail = (first + last + str(random.randint(1, 99))).lower() + "@example.com"
        dob = datetime(2000, 1, 1) + timedelta(days=random.randint(0, 5 * 365))
        hid = hostel_ids[i % len(hostel_ids)]
        shid = f"{first[:3].upper()}{hid}ID{i+1:03d}"
        students.append((full_name, phone, mail, dob.date(), hid, shid))

    cursor.executemany(
        "INSERT INTO Student (Name, Phone, Mail, DOB, HID, SHID) VALUES (%s, %s, %s, %s, %s, %s)",
        students,
    )

    # UserAuth
    auth_rows = [(s[5], "pswd@" + s[5]) for s in students]
    cursor.executemany(
        "INSERT INTO UserAuth (SHID, PSWD) VALUES (%s, %s)",
        auth_rows,
    )

    # Complaints (random 10 students)
    cursor.execute("SELECT SID FROM Student ORDER BY RANDOM() LIMIT 10")
    selected_sids = [row[0] for row in cursor.fetchall()]

    complaint_types = ["Water Leakage", "Electricity Issue", "WiFi Problem", "Cleanliness", "Furniture Broken"]
    complaints = []

    for sid in selected_sids:
        comp_type = random.choice(complaint_types)
        description = f"{comp_type} needs urgent attention."
        proof = "data:image/png;base64,sampleproofstring"
        complaints.append((sid, comp_type, description, proof))

    cursor.executemany(
        "INSERT INTO Complaint (SID, Type, Description, ProofImage) VALUES (%s, %s, %s, %s)",
        complaints,
    )


def main():
    conn = get_db_connection()
    conn.autocommit = True
    cursor = conn.cursor()

    for statement in TABLE_SQL:
        cursor.execute(statement)
    create_admin_table_and_seed(cursor)
    seed_boys_hostel_demo_data(cursor)

    conn.commit()
    cursor.close()
    conn.close()
    print("✔ All data inserted: Hostels, Wardens, Rooms, Students, Auth, Complaints")


if __name__ == "__main__":
    main()
