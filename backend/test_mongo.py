from pymongo import MongoClient

uri = "mongodb+srv://veda-varshan-r-2007:veda-mongo-atlas-2007@cluster0.schcish.mongodb.net/myDatabase?retryWrites=true&w=majority"

client = MongoClient(uri)

db = client["myDatabase"]
collection = db["users"]

# Insert test data
collection.insert_one({"name": "Veda", "age": 18})

print("Connected and data inserted!")
