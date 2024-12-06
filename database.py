from pymongo import MongoClient
from datetime import date

client = MongoClient("mongodb://localhost:27017/")
db = client['CepetBangetExpress']

# users collection
def find_user_by_username(username):
    return db.users.find_one({"username": username})

def find_user_by_email(email):
    return db.users.find_one({"email": email})

def find_user_by_credentials(username, password):
    return db.users.find_one({"username": username, "password": password})

def insert_user(user_data):
    db.users.insert_one(user_data)

def get_last_user():
    return db.users.find_one(sort=[("_id", -1)])


# pickups collection
def insert_pickup_request(pickup_data):
    return db.pickups_request.insert_one(pickup_data)

def get_pickup_requests():
    return db.pickups_request.find()

def get_pickup_request_by_id(request_id):
    return db.pickups_request.find_one({"request_id": request_id})

def update_pickup_status(request_id, status):
    return db.pickups_request.update_one(
        {"request_id": request_id},
        {"$set": {"status": status}}
    )

def get_pickup_requests_by_status(status):
    try:
        result = list(db.pickups_request.aggregate([
            {"$match": {"status": status}}
        ]))
        return result
    except Exception as e:
        print("Error fetching pickup requests by status:", str(e))
        return []


# dashboard handler preview
def count_couriers():
    try:
        result = list(db.couriers.aggregate([
            {"$group": {"_id": None, "total": {"$sum": 1}}}
        ]))
        return result[0]["total"] if result else 0
    except Exception as e:
        print("Error counting couriers:", str(e))
        return 0

def count_merchants():
    try:
        result = list(db.users.aggregate([
            {"$match": {"role": "merchant"}},
            {"$group": {"_id": None, "total": {"$sum": 1}}}
        ]))
        return result[0]["total"] if result else 0
    except Exception as e:
        print("Error counting merchants:", str(e))
        return 0

def count_todays_shipments():
    try:
        today = date.today().strftime("%d/%m/%Y")
        result = list(db.shipments.aggregate([
            {"$match": {"date": today}},
            {"$group": {"_id": None, "total": {"$sum": 1}}}
        ]))
        return result[0]["total"] if result else 0
    except Exception as e:
        print("Error counting today's shipments:", str(e))
        return 0
