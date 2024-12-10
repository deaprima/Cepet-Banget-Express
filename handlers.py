import eel
from database import *
from datetime import date

################################### LOGIN HANDLER ###################################
@eel.expose
def login(username, password):
    try:
        user = find_user_by_credentials(username, password)
        if user:
            return {
                "status": "success",
                "_id": user["_id"],
                "name": user["name"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "address": user["address"],
                "phone": user["phone"]
            }
        return {
            "status": "error",
            "message": "Invalid username or password"
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": "System error occurred during login"
        }


################################# LOGOUT HANDLER ###################################
@eel.expose
def logout():
    return "logged_out"


################################### REGISTER HANDLER ###################################
@eel.expose
def register(name, username, email, password, role):
    try:
        if not all([name, username, email, password]):
            return {"status": "error", "message": "Error: All fields are required!"}

        if find_user_by_username(username):
            return {"status": "error", "message": "Error: Username already taken!"}

        if find_user_by_email(email):
            return {"status": "error", "message": "Error: Email already taken!"}

        if "@" not in email or "." not in email:
            return {"status": "error", "message": "Error: Invalid email format!"}

        last_user = get_last_user()
        if last_user and str(last_user["_id"]).startswith("U"):
            last_id = int(last_user["_id"][1:])
            new_id = f"U{last_id + 1:03d}"
        else:
            new_id = "U001"

        user_data = {
            "_id": new_id,
            "name": name.strip(),
            "username": username.strip(),
            "email": email.strip().lower(),
            "password": password.strip(),
            "role": role,
            "address": None,
            "phone": None
        }

        insert_user(user_data)
        return {"status": "success", "message": f"Registration successful!"}

    except Exception as e:
        print("Error during registration:", str(e))
        return {"status": "error", "message": "An error occurred during registration. Please contact support."}


################################### DASHBOARD HANDLER ###################################
@eel.expose
def get_dashboard_stats():
    try:
        stats = {
            "daily_packages": count_todays_shipments(),
            "total_merchants": count_merchants(),
            "total_couriers": count_couriers(),
            "active_shipments": 0
        }
        return stats
    except Exception as e:
        print("Error getting dashboard stats:", str(e))
        return None
    
@eel.expose
def calculate_shipping_cost(dimensions, weight):
    try:
        volume = dimensions['length'] * dimensions['width'] * dimensions['height']
        
        base_rate = 7000
        distance_rate = 10000
        volume_rate = 0.5
        weight_rate = 5000
        
        volume_cost = volume * volume_rate
        weight_cost = weight * weight_rate
        
        total = base_rate + volume_cost + weight_cost
        
        return {
            "base_rate": base_rate,
            "distance_cost": distance_rate, 
            "volume_cost": round(volume_cost),
            "weight_cost": round(weight_cost),
            "total": round(total)
        }
    except Exception as e:
        print("Error calculating shipping cost:", str(e))
        return None


################################### SHIPMENTS HANDLER ###################################
@eel.expose
def create_shipment(shipment_data):
    try:
        last_shipment = db.shipments.find_one(sort=[("tracking_number", -1)])
        if last_shipment and str(last_shipment["tracking_number"]).startswith("CBE"):
            last_num = int(last_shipment["tracking_number"][3:])
            tracking_number = f"CBE{last_num + 1:08d}"
        else:
            tracking_number = "CBE00000001"

        current_date = date.today()
        formatted_date = current_date.strftime("%d/%m/%Y")

        shipment = {
            "tracking_number": tracking_number,
            "date": formatted_date,
            "sender": shipment_data["sender"],
            "receiver": shipment_data["receiver"],
            "package": shipment_data["package"],
            "courier_id": shipment_data["courier_id"],
            "status": "pending",
            "type": shipment_data["type"]
        }

        db.shipments.insert_one(shipment)
        return {
            "status": "success",
            "message": f"Pengiriman berhasil dibuat dengan nomor resi {tracking_number}"
        }
    except Exception as e:
        print("Error creating shipment:", str(e))
        return {
            "status": "error",
            "message": "Gagal membuat pengiriman. Silakan coba lagi."
        }

@eel.expose
def get_shipments():
    try:
        shipments = list(db.shipments.find({}).sort("date", -1))
        for shipment in shipments:
            courier = db.couriers.find_one({"id_courier": shipment["courier_id"]})
            shipment["courier_name"] = courier["name"] if courier else "Unknown"
            
            if not isinstance(shipment["date"], str):
                shipment["date"] = shipment["date"].isoformat()
                
        return shipments
    except Exception as e:
        print("Error fetching shipments:", str(e))
        return []

@eel.expose
def update_shipment_status(tracking_number, new_status):
    try:
        result = db.shipments.update_one(
            {"tracking_number": tracking_number},
            {"$set": {"status": new_status}}
        )
        if result.modified_count > 0:
            return {"status": "success", "message": "Status updated successfully"}
        return {"status": "error", "message": "Shipment not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@eel.expose
def delete_shipment(tracking_number):
    try:
        result = db.shipments.delete_one({"tracking_number": tracking_number})
        if result.deleted_count > 0:
            return {"status": "success", "message": "Shipment deleted successfully"}
        return {"status": "error", "message": "Shipment not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@eel.expose
def get_shipment_by_tracking(tracking_number):
    try:
        shipment = db.shipments.find_one({"tracking_number": tracking_number})
        if shipment:
            if not isinstance(shipment["date"], str):
                shipment["date"] = shipment["date"].isoformat()
            return shipment
        return None
    except Exception as e:
        print("Error fetching shipment:", str(e))
        return None


################################### COURIERS HANDLER ###################################
@eel.expose
def get_couriers():
    couriers = list(db.couriers.find({}, {'_id': 0}))
    return couriers

@eel.expose
def get_courier_by_id(courier_id):
    try:
        pipeline = [
            {"$match": {"id_courier": courier_id}},
            {"$limit": 1},
            {"$project": {
                "_id": 0,
                "id_courier": 1,
                "name": 1,
                "phone": 1,
                "email": 1,
                "address": 1,
                "area": 1,
                "status": 1
            }}
        ]
        result = list(db.couriers.aggregate(pipeline))
        return result[0] if result else None
    except Exception as e:
        print("Error fetching courier:", str(e))
        return None

@eel.expose
def check_duplicate_courier_field(field, value, current_courier_id=None):
    try:
        pipeline = [
            {"$match": {
                field: value,
                "id_courier": {"$ne": current_courier_id}
            }},
            {"$limit": 1},
            {"$project": {"id_courier": 1}}
        ]
        result = list(db.couriers.aggregate(pipeline))
        return {"isDuplicate": len(result) > 0}
    except Exception as e:
        print(f"Error checking duplicate courier {field}:", str(e))
        return {"isDuplicate": True}

@eel.expose
def add_courier(courier_data):
    try:
        email_check = check_duplicate_courier_field("email", courier_data["email"])
        if email_check["isDuplicate"]:
            return {"status": "error", "message": "Email already exists", "field": "email"}

        phone_check = check_duplicate_courier_field("phone", courier_data["phone"])
        if phone_check["isDuplicate"]:
            return {"status": "error", "message": "Phone number already exists", "field": "phone"}
        
        last_courier = db.couriers.find_one(sort=[("id_courier", -1)])
        if last_courier and str(last_courier["id_courier"]).startswith("C"):
            last_id = int(last_courier["id_courier"][1:])
            new_id = f"C{last_id + 1:03d}"
        else:
            new_id = "C001"

        courier = {
            "id_courier": new_id,
            "name": courier_data["name"],
            "phone": courier_data["phone"],
            "email": courier_data["email"],
            "address": courier_data["address"],
            "area": courier_data["area"],
            "status": courier_data["status"]
        }
        
        db.couriers.insert_one(courier)
        return {"status": "success", "message": "Courier added successfully"}
    except Exception as e:
        print("Error adding courier:", str(e))
        return {"status": "error", "message": str(e)}

@eel.expose
def update_courier(courier_data):
    try:
        courier_id = courier_data.pop("id")
        result = db.couriers.update_one(
            {"id_courier": courier_id},
            {"$set": courier_data}
        )
        if result.modified_count:
            return {"status": "success", "message": "Courier updated successfully"}
        return {"status": "error", "message": "No courier found with that ID"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@eel.expose
def delete_courier(courier_id):
    try:
        result = db.couriers.delete_one({"id_courier": courier_id})
        if result.deleted_count:
            return {"status": "success", "message": "Courier deleted successfully"}
        return {"status": "error", "message": "No courier found with that ID"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


################################## CUSTOMERS HANDLER ###################################
@eel.expose
def get_merchant_details():
    try:
        merchants = list(db.users.aggregate([
            {"$match": {"role": "merchant"}},
            {"$project": {
                "_id": 1,
                "name": 1,
                "username": 1,
                "email": 1,
                "phone": 1,
                "address": 1
            }}
        ]))
        return merchants
    except Exception as e:
        print(f"Error getting merchant details: {e}")
        return []

@eel.expose
def get_pickup_requests():
    try:
        pickups = list(db.pickups_request.find({}).sort("pickup_date", -1))
        return pickups
    except Exception as e:
        print(f"Error getting pickup requests: {e}")
        return []

@eel.expose
def get_pickup_by_id(request_id):
    try:
        pickup = db.pickups_request.find_one({"request_id": request_id})
        return pickup
    except Exception as e:
        print(f"Error getting pickup details: {e}")
        return None

@eel.expose
def update_pickup_status(request_id, new_status):
    try:
        result = db.pickups_request.update_one(
            {"request_id": request_id},
            {"$set": {"status": new_status}}
        )
        if result.modified_count > 0:
            return {"status": "success", "message": "Status updated successfully"}
        return {"status": "error", "message": "Pickup request not found"}
    except Exception as e:
        print(f"Error updating pickup status: {e}")
        return {"status": "error", "message": str(e)}


################################### USERS HANDLER ###################################
@eel.expose
def check_duplicate_field(field, value, current_user_id):
    try:
        pipeline = [
            {"$match": {
                field: value,
                "_id": {"$ne": current_user_id}
            }},
            {"$limit": 1},
            {"$project": {"_id": 1}}
        ]
        result = list(db.users.aggregate(pipeline))
        return {"isDuplicate": len(result) > 0}
    except Exception as e:
        print(f"Error checking duplicate {field}:", str(e))
        return {"isDuplicate": True}

@eel.expose
def update_profile(user_id, profile_data, changed_fields):
    try:
        current_user = db.users.find_one({"_id": user_id})

        if not current_user:
            return {"status": "error", "message": "User not found"}

        update_data = {}
        for field in changed_fields:
            new_value = profile_data[field].strip()
            
            if current_user.get(field) == new_value:
                continue

            if field in ['username', 'email', 'phone']:
                check_result = check_duplicate_field(field, new_value, user_id)
                if check_result["isDuplicate"]:
                    return {
                        "status": "error", 
                        "field": field, 
                        "message": f"{field.title()} already taken"
                    }

            update_data[field] = new_value if new_value else None

        if not update_data:
            return {"status": "error", "message": "No changes detected"}

        result = db.users.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        
        updated_user = db.users.find_one({"_id": user_id})
        
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "updated_data": updated_user
        }

    except Exception as e:
        print("Error updating profile:", str(e))
        return {"status": "error", "message": str(e)}

@eel.expose
def change_password(user_id, current_password, new_password):
    try:
        
        user = db.users.find_one({"_id": user_id, "password": current_password})
        if not user:
            return {"status": "error", "message": "Current password is incorrect"}

        result = db.users.update_one(
            {"_id": user_id},
            {"$set": {"password": new_password}}
        )
        
        if result.modified_count > 0:
            return {"status": "success", "message": "Password changed successfully"}
        return {"status": "error", "message": "Failed to change password"}
    except Exception as e:
        print("Error changing password:", str(e))
        return {"status": "error", "message": "Failed to change password"}


################################### PICKUP REQUEST HANDLER ###################################
@eel.expose
def submit_pickup_request(pickup_data):
    try:

        last_request = db.pickups_request.find_one(sort=[("request_id", -1)])
        if last_request:
            last_num = int(last_request["request_id"][2:])
            new_num = str(last_num + 1).zfill(3)
            pickup_data["request_id"] = f"PR{new_num}"
        else:
            pickup_data["request_id"] = "PR001"
            

        result = insert_pickup_request(pickup_data)
        
        return {
            'success': True,
            'request_id': str(result.inserted_id)
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@eel.expose
def get_all_pickup_requests():
    try:
        requests = list(get_pickup_requests())
        return {
            'success': True,
            'data': requests
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@eel.expose
def update_request_status(request_id, new_status):
    try:
        update_pickup_status(request_id, new_status)
        return {
            'success': True
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }