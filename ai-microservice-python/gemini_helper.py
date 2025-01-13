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
        # Make the request to the Gemini API
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=payload
        )

        # Check for non-200 status codes
        if response.status_code != 200:
            error_message = response.json().get("error", {}).get("message", "Unknown error")
            logger.error(f"Gemini API error: {error_message}")
            return None, f"Error communicating with Gemini AI service."

        # Parse the response JSON
        api_response = response.json()
        print(api_response)

        # Debug: Log the full response to understand its structure
        logger.debug(f"Gemini API full response: {api_response}")

        # Get the first candidate (assuming the structure matches Postman results)
        candidates = api_response.get("candidates", [])
        if not candidates:
            return None, "Gemini API returned no results."

        # Extract the answer from the first candidate
        answer_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
        candidate = candidates[0]
        
        if candidate.get("finishReason") == "SAFETY":
            logger.error("Gemini API blocked the response due to safety concerns.")
            return None, "The response was blocked due to safety concerns. Please try rephrasing the input."
        
        if not answer_text:
            return None, "No answer text found in Gemini API response."

        # Return the parsed answer and metadata
        return {
            "answer": answer_text,
            "geminiMetadata": api_response.get("usageMetadata", {})
        }, None

    except Exception as e:
        # Log any unexpected errors
        logger.error(f"Error communicating with Gemini API: {e}")
        return None, "Error communicating with Gemini AI service."