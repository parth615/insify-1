import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import sqlite3
import json


def get_user_profiles_from_db(db_path='vibematch.db'):
    """Loads verified user profiles from the database and builds a feature matrix.
    
    Since the DB stores artist names (not audio features), this creates a
    binary artist-presence matrix for cosine similarity comparison.
    """
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name, top_artists 
            FROM users 
            WHERE aadhar_verified = 1
        """)
        rows = cursor.fetchall()

    if not rows:
        return None

    # Build a binary matrix: each column is an artist, each row is a user
    user_artists = {}
    all_artists = set()
    for name, artists_json in rows:
        artists = json.loads(artists_json)
        user_artists[name] = artists
        all_artists.update(artists)

    all_artists = sorted(all_artists)
    data = {}
    for user_name, artists in user_artists.items():
        data[user_name] = [1 if a in artists else 0 for a in all_artists]

    df = pd.DataFrame(data, index=all_artists).T
    return df


def get_best_matches(target_user, df=None, top_n=2):
    """Returns the top N matches for a given user based on music taste similarity.
    
    Args:
        target_user: Name of the user to find matches for.
        df: Optional pre-computed DataFrame. If None, loads from DB.
        top_n: Number of top matches to return.
    
    Returns:
        A pandas Series of match scores, or None if user not found.
    """
    if df is None:
        df = get_user_profiles_from_db()

    if df is None or target_user not in df.index:
        return None

    similarity_matrix = cosine_similarity(df)
    similarity_df = pd.DataFrame(similarity_matrix, index=df.index, columns=df.index)

    scores = similarity_df[target_user].drop(target_user)
    matches = scores.sort_values(ascending=False).head(top_n)

    return matches


# --- Standalone demo with hardcoded data (original behavior) ---

def demo_with_hardcoded_data():
    """Runs the original hardcoded demo for testing purposes."""
    data = {
        'user_id': ['User_A', 'User_B', 'User_C', 'User_D'],
        'danceability': [0.80, 0.75, 0.20, 0.90],
        'energy': [0.85, 0.80, 0.15, 0.95],
        'acousticness': [0.05, 0.10, 0.85, 0.01],
        'valence': [0.70, 0.80, 0.25, 0.75]
    }

    df = pd.DataFrame(data).set_index('user_id')

    print("--- User Music Profiles (Hardcoded Demo) ---")
    print(df)
    print("\n")

    similarity_matrix = cosine_similarity(df)
    similarity_df = pd.DataFrame(similarity_matrix, index=df.index, columns=df.index)

    target = 'User_A'
    print(f"--- Top Matches for {target} ---")
    scores = similarity_df[target].drop(target)
    matches = scores.sort_values(ascending=False).head(2)

    for match_user, score in matches.items():
        match_percentage = round(score * 100, 2)
        print(f"{match_user}: {match_percentage}% Vibe Match")


if __name__ == '__main__':
    # Try DB-based matching first
    print("=" * 40)
    print("Attempting DB-based matching...")
    print("=" * 40)

    df = get_user_profiles_from_db()
    if df is not None and len(df) > 1:
        print(f"\nFound {len(df)} verified users in database.\n")
        for user in df.index:
            matches = get_best_matches(user, df=df, top_n=2)
            if matches is not None:
                print(f"--- Top Matches for {user} ---")
                for match_user, score in matches.items():
                    match_percentage = round(score * 100, 2)
                    print(f"  {match_user}: {match_percentage}% Vibe Match")
                print()
    else:
        print("No users in DB or DB not found. Falling back to hardcoded demo.\n")

    # Also run the hardcoded demo
    print("=" * 40)
    print("Hardcoded Demo")
    print("=" * 40)
    demo_with_hardcoded_data()