DEMO_USER = {
    "id": 1,
    "name": "Demo User",
    "followed_clubs": []
}

def get_demo_user():
    return DEMO_USER


def follow_club(club_id):
    if club_id not in DEMO_USER["followed_clubs"]:
        DEMO_USER["followed_clubs"].append(club_id)
    return DEMO_USER


def unfollow_club(club_id):
    if club_id in DEMO_USER["followed_clubs"]:
        DEMO_USER["followed_clubs"].remove(club_id)
    return DEMO_USER

