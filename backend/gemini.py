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
            return response.text.strip()
        return None
    except Exception as e:
        logger.error(f"Error running Gemini prompt: {str(e)}", exc_info=True)
        return None

def generate_embeddings(text):
    try:
        logger.info(f"Generating embeddings for text: {text[:50]}...")
        embedding_model = 'models/embedding-001'
        result = genai.embed_content(
            model=embedding_model,
            content=text,
            task_type="retrieval_document"
        )
        
        if result and 'embedding' in result:
            embedded = result['embedding']
            logger.info(f"Embeddings generated successfully: {embedded}...")
            return embedded
        return None
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}", exc_info=True)
        return None


