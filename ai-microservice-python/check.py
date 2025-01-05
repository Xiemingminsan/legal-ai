import requests
import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv(dotenv_path="../backend-node/.env")

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
API_URL = os.getenv("MISTRAL_API_URL")

print(MISTRAL_API_KEY)
print(API_URL)

headers = {"Authorization": f"Bearer {MISTRAL_API_KEY}"}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

# Test query
output = query({
    "inputs": "Hello, how are you?",
})

print(output)
