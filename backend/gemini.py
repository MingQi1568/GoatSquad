import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    logger.error("No GOOGLE_API_KEY found in environment variables")
    raise ValueError("GOOGLE_API_KEY is required")

# Configure the Gemini API
genai.configure(api_key=api_key)

def run_gemini_prompt(prompt):
    try:
        logger.info(f"Running prompt: {prompt[:50]}...")
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        if response.text:
            return response.text
        return None
    except Exception as e:
        logger.error(f"Error running Gemini prompt: {str(e)}", exc_info=True)
        return None

def generate_embeddings(text):
    try:
        genai.configure(api_key=api_key)
        
        logger.debug(f"Generating embeddings for text: {text[:50]}...")
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text
        )
        
        embedded_vector = result['embedding']
        logger.debug(f"Embeddings generated. First few floats: {embedded_vector[:5]}...")
        return embedded_vector
    
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}", exc_info=True)
        return []
