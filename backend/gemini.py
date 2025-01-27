import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    logger.error("No GOOGLE_API_KEY found in environment variables")
    raise ValueError("GOOGLE_API_KEY is required")

def run_gemini_prompt(prompt):
    try:
        logger.info(f"Running prompt: {prompt[:50]}...")
        client = genai.Client(api_key=api_key)
        
        search_tool = {'google_search': {}}
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[search_tool],
                response_modalities=["TEXT"],
            )
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error running Gemini prompt: {str(e)}", exc_info=True)
        return None