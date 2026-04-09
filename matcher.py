import json

def calculate_score(list1, list2):
    set1, set2 = set(list1), set(list2)
    inter = set1.intersection(set2)
    union = set1.union(set2)
    return round((len(inter) / len(union)) * 100, 2) if union else 0.0

def get_most_compatible(target_name, target_artists, other_users):
    if not other_users: return None

    prefs = {}
    user_data = {target_name: target_artists}
    
    for u in other_users:
        name = u['name']
        artists = u['top_artists']
        user_data[name] = json.loads(artists) if isinstance(artists, str) else artists

    for name, artists in user_data.items():
        scores = []
        for other_name, other_artists in user_data.items():
            if name == other_name: continue
            score = calculate_score(artists, other_artists)
            if score > 0: scores.append((score, other_name))
        scores.sort(key=lambda x: x[0], reverse=True)
        prefs[name] = [x[1] for x in scores]

    target_prefs = prefs.get(target_name, [])
    if not target_prefs: return None

    # Mutual Match Logic
    for p in target_prefs:
        if prefs.get(p) and prefs[p][0] == target_name:
            return p

    return target_prefs[0]