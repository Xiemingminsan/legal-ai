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

def call_gemini_api(payload):
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            error_message = response.json().get("error", {}).get("message", "Unknown error")
            logger.error(f"Gemini API error: {error_message}")
            return None, f"Error communicating with Gemini AI service."

        api_response = response.json()
        candidates = api_response.get("candidates", [])
        if not candidates:
            return None, "Gemini API returned no results."

        answer_text = candidates[0]["content"]["parts"][0]["text"].strip()
        return {
            "answer": answer_text,
            "geminiMetadata": api_response.get("usageMetadata", {})
        }, None

    except Exception as e:
        logger.error(f"Error communicating with Gemini API: {e}")
        return None, "Error communicating with Gemini AI service."