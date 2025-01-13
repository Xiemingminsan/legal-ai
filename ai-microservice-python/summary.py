import requests
# gemini_helper.py
import os
from dotenv import load_dotenv
import requests
import logging

logger = logging.getLogger(__name__)

load_dotenv(dotenv_path="../backend-node/.env")

# AI configuration
USE_LOCAL_LLM = os.getenv("USE_LOCAL_LLM", "false").lower() == "true"

GEMINI_API_URL = os.getenv("GEMINI_API_URL")  # e.g., "https://api.mistral.ai/v1/chat/completions"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # if needed



def summarize_with_gemini(conversation_text):
    """
    Summarize the given conversation using the Gemini API.
    
    Args:
        conversation_text (str): The text of the conversation to summarize.

    Returns:
        str: The summarized text or an empty string on failure.
    """
    prompt = f"Summarize the following conversation concisely:\n\n{conversation_text}\n\nSummary:"
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"].strip()
        else:
            print(f"Error: Received status code {response.status_code}")
    except requests.RequestException as e:
        print(f"Error: {e}")

    return ""

