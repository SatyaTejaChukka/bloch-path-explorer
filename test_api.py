import requests
import json

# Test the API endpoint
url = "http://127.0.0.1:5000/api/simulate"
headers = {"Content-Type": "application/json"}
data = {"circuit": "H X"}

try:
    response = requests.post(url, headers=headers, json=data)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)
