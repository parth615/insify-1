"""
VibeMatch Database Seeder
Seeds mock users with location data (all near New Delhi for demo matching).
No Aadhar, no email/phone — simplified schema.
"""

import sqlite3
import json


def init_db():
    """Creates the users table with the new simplified schema."""
    with sqlite3.connect('vibematch.db') as conn:
        cursor = conn.cursor()
        # Drop old table if schema is outdated
        cursor.execute("DROP TABLE IF EXISTS users")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT NOT NULL,
                top_artists TEXT NOT NULL,
                latitude REAL DEFAULT 28.6139,
                longitude REAL DEFAULT 77.2090
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_name TEXT NOT NULL,
                receiver_name TEXT NOT NULL,
                text TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()


def seed_mock_users():
    """Inserts mock users near Delhi (within ~5km of each other)."""
    mock_users = [
        # name, age, gender, top_artists, latitude, longitude
        ('Rahul', 24, 'Male',
         json.dumps(['Pritam', 'Arijit Singh', 'KK', 'Shaan', 'Atif Aslam', 'Darshan Raval']),
         28.6129, 77.2295),   # Connaught Place
        ('Priya', 22, 'Female',
         json.dumps(['Dua Lipa', 'The Weeknd', 'Drake', 'Taylor Swift', 'Travis Scott', 'Arijit Singh']),
         28.6304, 77.2177),   # Karol Bagh
        ('Aman', 26, 'Male',
         json.dumps(['Arijit Singh', 'Ankit Tiwari', 'Shreya Ghoshal', 'KK', 'Pritam']),
         28.6353, 77.2250),   # Paharganj
        ('Sneha', 21, 'Female',
         json.dumps(['Pritam', 'Vishal-Shekhar', 'Shreya Ghoshal', 'Arijit Singh', 'Neha Kakkar']),
         28.6100, 77.2300),   # India Gate area
        ('Vikram', 25, 'Male',
         json.dumps(['The Weeknd', 'Drake', 'Travis Scott', 'Post Malone', 'Kanye West']),
         28.6280, 77.2190),   # Rajiv Chowk
        ('Ananya', 23, 'Female',
         json.dumps(['Taylor Swift', 'Dua Lipa', 'Billie Eilish', 'Ariana Grande', 'Arijit Singh']),
         28.6150, 77.2090),   # Jantar Mantar
        ('Rohan', 27, 'Male',
         json.dumps(['KK', 'Pritam', 'Arijit Singh', 'Atif Aslam', 'Jubin Nautiyal']),
         28.6200, 77.2150),   # Mandi House
    ]

    with sqlite3.connect('vibematch.db') as conn:
        cursor = conn.cursor()
        for user in mock_users:
            cursor.execute("""
                INSERT OR IGNORE INTO users (name, age, gender, top_artists, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?)
            """, user)
        conn.commit()
    print(f"✅ Seeded {len(mock_users)} mock users (all near Delhi).")


if __name__ == '__main__':
    init_db()
    seed_mock_users()

    # Verify
    with sqlite3.connect('vibematch.db') as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, age, gender, latitude, longitude FROM users")
        rows = cursor.fetchall()
        print(f"\n📊 Total users in DB: {len(rows)}")
        for row in rows:
            print(f"  🎵 {row[0]} | {row[1]} | {row[2]} | ({row[3]}, {row[4]})")