import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import logging
import google.generativeai as genai
import os

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

def generate_embeddings(text):
    try:
        logger.info(f"Generating embeddings for text: {text[:50]}...")

        genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
        result = genai.embed_content(
                model="models/text-embedding-004",
                content="What is the meaning of life?")

        embedded = result['embedding']
        logger.info(f"Embeddings generated successfully: {embedded}...")
        return embedded
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}", exc_info=True)
        return None


