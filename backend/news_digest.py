import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import logging
from bs4 import BeautifulSoup
from datetime import datetime
from cachetools import TTLCache, cached

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    logger.error("No GOOGLE_API_KEY found in environment variables")
    raise ValueError("GOOGLE_API_KEY is required")

# Default refresh cycle in seconds (configurable)
DEFAULT_REFRESH_CYCLE = 60 * 10  # 10 minutes

# Create TTL caches for teams and players.
# Note: The TTL value is set to the default but will be updated in get_news_digest() if needed.
team_cache = TTLCache(maxsize=1000, ttl=DEFAULT_REFRESH_CYCLE)
player_cache = TTLCache(maxsize=1000, ttl=DEFAULT_REFRESH_CYCLE)

# Create a global client for the Gemini API.
client = genai.Client(api_key=api_key)

@cached(cache=team_cache)
def generate_team_digest(team: str) -> dict:
    """
    Generate a digest for a given team using Gemini API.
    This function is decorated with a TTL cache so that repeated requests for the same team
    (within the TTL period) return the cached result.
    """
    search_tool = {'google_search_retrieval': {}}
    prompt = f"""
    Generate a concise MLB update focusing on {team}. Include:

    # Team Update
    - Current standings
    - Recent performance
    - Key statistics

    # Looking Ahead
    - Upcoming games
    - Key matchups
    - Potential milestones

    Format in markdown, use bullet points, and bold (**) key numbers. Remove any introductory phrases and start directly with the content.
    """

    response = client.models.generate_content(
        model='gemini-1.5-flash-002',
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[search_tool],
            response_modalities=["TEXT"],
        )
    )

    return {
        'type': 'team',
        'subject': team,
        'content': clean_content(response.text),
        'sources': get_search_content(response)
    }

@cached(cache=player_cache)
def generate_player_digest(player: str) -> dict:
    """
    Generate a digest for a given player using Gemini API.
    This function is decorated with a TTL cache so that repeated requests for the same player
    (within the TTL period) return the cached result.
    """
    search_tool = {'google_search_retrieval': {}}
    prompt = f"""
    Generate a concise MLB player spotlight for {player}. Include:

    # Player Spotlight
    - Recent performance
    - Season statistics
    - Notable achievements
    - Upcoming milestones

    Format in markdown, use bullet points, and bold (**) key numbers. Remove any introductory phrases and start directly with the content.
    """

    response = client.models.generate_content(
        model='gemini-1.5-flash-002',
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[search_tool],
            response_modalities=["TEXT"],
        )
    )

    return {
        'type': 'player',
        'subject': player,
        'content': clean_content(response.text),
        'sources': get_search_content(response)
    }

def get_news_digest(teams=None, players=None, refresh_cycle=DEFAULT_REFRESH_CYCLE):
    """
    Generate news digests for MLB teams and players using Gemini API with web search.
    Caching is applied per team/player via decorated sub‑functions.
    
    Args:
        teams (list): List of team names.
        players (list): List of player names.
        refresh_cycle (int): TTL for cached results in seconds.

    Returns:
        dict: A dictionary with a success flag, list of digests, and a timestamp, or an error.
    """
    logger.info(f"Received request for teams: {teams}, players: {players} with refresh cycle: {refresh_cycle}s")
    
    # Update TTL for caches if needed (this affects subsequent cache expirations).
    if team_cache.ttl != refresh_cycle:
        team_cache.ttl = refresh_cycle
    if player_cache.ttl != refresh_cycle:
        player_cache.ttl = refresh_cycle

    try:
        # Validate inputs.
        if teams is None and players is None:
            return {
                'success': False,
                'error': 'At least one team or player must be specified'
            }
        if (teams is not None and len(teams) == 0) and (players is not None and len(players) == 0):
            return {
                'success': False,
                'error': 'Empty teams and players lists provided'
            }

        digests = []

        # Process teams (limit to 3 teams).
        if teams:
            logger.info(f"Processing teams: {teams}")
            for team in teams[:3]:
                digest = generate_team_digest(team)
                digests.append(digest)

        # Process players (limit to 3 players).
        if players:
            logger.info(f"Processing players: {players}")
            for player in players[:3]:
                digest = generate_player_digest(player)
                digests.append(digest)

        if not digests:
            return {
                'success': False,
                'error': 'No content could be generated'
            }

        logger.info(f"Generated {len(digests)} digests successfully")
        return {
            'success': True,
            'digests': digests,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error generating news digest: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e)
        }

def clean_content(content):
    """Clean up the response text by removing introductory phrases."""
    intro_phrases = [
        "Here's the requested information",
        "Based on the latest information",
        "Here's a summary",
        "Let me provide you with",
        "Here's what I found",
        "Using real-time search",
        "Based on real-time data",
        "Here's the current information"
    ]
    
    for phrase in intro_phrases:
        if content.lower().startswith(phrase.lower()):
            content = content[len(phrase):].lstrip(',:.\n ')
    
    return content

def get_search_content(response):
    """Extract search content from the response."""
    if (hasattr(response.candidates[0], 'grounding_metadata') and
       hasattr(response.candidates[0].grounding_metadata, 'search_entry_point')):
        return response.candidates[0].grounding_metadata.search_entry_point.rendered_content
    return "Generated using Google Gemini AI with web search"

def clean_source_links(sources_html):
    """Clean and extract source links from Google's HTML."""
    soup = BeautifulSoup(sources_html, 'html.parser')
    links = soup.select('a.chip')
    
    cleaned_sources = []
    for link in links:
        cleaned_sources.append({
            'text': link.get_text(),
            'url': link.get('href')
        })
    
    return cleaned_sources
