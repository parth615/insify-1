import sqlite3
import json

def seed_data():
    mock_users = [
        ('Rahul', 24, 'Male', json.dumps(['Pritam', 'Arijit Singh', 'KK']), 28.6129, 77.2295),
        ('Priya', 22, 'Female', json.dumps(['Dua Lipa', 'The Weeknd', 'Taylor Swift']), 28.6304, 77.2177),
        ('Vikram', 25, 'Male', json.dumps(['The Weeknd', 'Drake', 'Travis Scott']), 28.6280, 77.2190),
        ('Sharad_Thakur', 21, 'Male', json.dumps(['Arijit Singh', 'The Weeknd', 'Drake']), 28.6140, 77.2090)
    ]

    with sqlite3.connect('vibematch.db') as conn:
        cursor = conn.cursor()
        
        # 1. FIX: Ensure the table exists with ALL the correct columns
        cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,  -- 👈 ADD 'UNIQUE' HERE
        age INTEGER,
        gender TEXT,
        top_artists TEXT,
        playlists TEXT,
        latitude REAL,
        longitude REAL,
        phone TEXT,
        email TEXT
    )
""")
        
        # 2. SEED: Add the users if they don't exist
        for name, age, gender, artists, lat, lon in mock_users:
            cursor.execute("SELECT id FROM users WHERE name = ?", (name,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO users (name, age, gender, top_artists, latitude, longitude)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (name, age, gender, artists, lat, lon))
                print(f"✅ Seeding user: {name}")
        
        conn.commit()

if __name__ == "__main__":
    seed_data()