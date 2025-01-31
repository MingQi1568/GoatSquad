import vertexai
from vertexai.generative_models import GenerativeModel, Part
import moviepy.editor as mp
import ffmpeg
import numpy as np
from tempfile import NamedTemporaryFile
#pip install google-cloud-storage requests
from google.cloud import storage
import requests
import io
import os
import tempfile
import datetime

vertexai.init(project=691596640324, location="us-central1")

model = GenerativeModel("gemini-2.0-flash-exp")

def generate_videos(video_urls, user_id, audio_url=None):
    """
    Generate a compilation video with audio from GCS
    
    Args:
        video_urls: List of video URLs to compile
        user_id: User ID for the output filename
        audio_url: GCS URL for the background audio track (e.g. gs://bucket/path/to/audio.mp3)
    """
    if not video_urls:
        raise ValueError("No video URLs provided")

    print(f"Processing {len(video_urls)} videos for user {user_id}")
    
    video_uris = []
    for i, video in enumerate(video_urls):
        try:
            if not video.startswith(('http://', 'https://')):
                raise ValueError(f"Invalid video URL format: {video}")
            
            print(f"Downloading video {i + 1}/{len(video_urls)}: {video}")
            video_uri = download_to_gcs(video, "goatbucket1", f"videos/{user_id}_{i}")
            video_uris.append(video_uri)
        except Exception as e:
            print(f"Error processing video {i + 1}: {str(e)}")
            raise
    
    print("Getting engaging moments for each video...")
    video_sections = []
    for i, uri in enumerate(video_uris):
        try:
            clipTime = get_engaging_moments(uri).split(",")
            start_time = float(clipTime[0])
            end_time = float(clipTime[1])
            video_sections.append((video_urls[i], start_time, end_time))
            print(f"Video {i + 1} clip time: {start_time} to {end_time}")
        except Exception as e:
            print(f"Error getting engaging moments for video {i + 1}: {str(e)}")
            # Use default 3-second clip if analysis fails
            video_sections.append((video_urls[i], 0.0, 3.0))

    print("Loading video clips with audio...")
    clips = []
    for i, (url, start, end) in enumerate(video_sections):
        try:
            clip = load_remote_video_with_audio(url, start, end)
            clips.append(clip)
            print(f"Successfully loaded video {i + 1}")
        except Exception as e:
            print(f"Error loading video {i + 1}: {str(e)}")
            raise

    print("Concatenating video clips...")
    final_video = mp.concatenate_videoclips(clips, method="compose")
    
    try:
        if audio_url:
            print("Applying background audio...")
            # Parse bucket and blob path from GCS URL
            bucket_name = audio_url.split('/')[2]
            blob_path = '/'.join(audio_url.split('/')[3:])
            
            # Download audio from GCS
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            
            with NamedTemporaryFile(suffix='.mp3', delete=False) as temp_audio:
                blob.download_to_filename(temp_audio.name)
                print("Background audio downloaded successfully")
                
                # Load audio and set duration to match video
                background_audio = mp.AudioFileClip(temp_audio.name)
                background_audio = background_audio.set_duration(final_video.duration)
                
                # Set the background audio
                final_video = final_video.set_audio(background_audio)
                
                # Clean up temp file
                os.unlink(temp_audio.name)
                print("Background audio applied successfully")
    except Exception as e:
        print(f"Error applying background audio: {str(e)}")
        # Continue with original audio if background audio fails

    print("Uploading final video...")
    output_path = f"completeHighlights/{user_id}_{int(datetime.datetime.now().timestamp())}.mp4"
    upload_video_to_gcs(final_video, "goatbucket1", output_path)
    print("Upload complete!")
    
    # Clean up temporary GCS files
    try:
        for i in range(len(video_uris)):
            delete_from_gcs("goatbucket1", f"videos/{user_id}_{i}")
    except Exception as e:
        print(f"Error cleaning up temporary files: {str(e)}")
    
    # Convert GCS URI to public URL
    public_url = f"https://storage.googleapis.com/goatbucket1/{output_path}"
    return public_url


def get_engaging_moments(video_uri):
    """Get engaging moments from a video using Gemini"""
    try:
        prompt = """
                Give me the most engaging interval of the reel in miliseconds. Please capture key events for the highlight reel. I am trying to take portions of this clip to cut into a highlights reel, so choose the best section of this reel to be part of that compilation. Make sure to include an entire event in the time interval you give. Make the interval at least 3 seconds and at most 15.
        If you are not sure about any info, please do not make it up. 
        Return the beginning of this interval as a number in seconds with two decimal places, same with the end. 
        Simply answer with a number, like "1.33,9.71", for seconds 1.33 - 9.71 and nothing else.
        """

        # Convert gs:// URI to a signed URL that Vertex AI can access
        storage_client = storage.Client()
        bucket_name = video_uri.split('/')[2]  # Extract bucket name from gs:// URI
        blob_path = '/'.join(video_uri.split('/')[3:])  # Extract blob path
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        
        # Generate a signed URL that's valid for 1 hour
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(hours=1),
            method="GET"
        )

        video_file = Part.from_uri(
            uri=signed_url,  # Use signed URL instead of gs:// URI
            mime_type="video/mp4"
        )

        contents = [video_file, prompt]
        response = model.generate_content(contents)
        print(response.text)
        
        # If no valid response, return default interval
        if not response.text or ',' not in response.text:
            return "0.0,3.0"
            
        return response.text

    except Exception as e:
        print(f"Error in get_engaging_moments: {str(e)}")
        # Return a default interval if analysis fails
        return "0.0,3.0"

def load_remote_video_with_audio(url, start_time, end_time):
    """Loads a remote MP4 file with both video and audio"""
    print(f"Loading video from {url} (time: {start_time} to {end_time})")
    
    # Create temporary files for video and audio
    temp_video = NamedTemporaryFile(delete=False, suffix=".mp4")
    temp_audio = NamedTemporaryFile(delete=False, suffix=".m4a")  # Use .m4a for AAC audio

    try:
        # Download and trim video with sound using ffmpeg
        (
            ffmpeg
            .input(url, ss=start_time, to=end_time)
            .output(temp_video.name, vcodec="libx264", acodec="aac")
            .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
        )

        # Extract the audio separately
        (
            ffmpeg
            .input(temp_video.name)
            .output(temp_audio.name, acodec="copy", vn=None)  # Extract AAC without re-encoding
            .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
        )

        # Load the video and audio in moviepy
        video_clip = mp.VideoFileClip(temp_video.name)
        audio_clip = mp.AudioFileClip(temp_audio.name)

        # Attach the trimmed audio to the video
        video_clip = video_clip.set_audio(audio_clip)

        return video_clip
    except Exception as e:
        raise Exception(f"Error processing video: {str(e)}")
    finally:
        # Clean up temporary files
        try:
            os.unlink(temp_video.name)
            os.unlink(temp_audio.name)
        except Exception as e:
            print(f"Error cleaning up temporary files: {str(e)}")


def download_to_gcs(url, bucket_name, destination_blob_name):
    """
    Downloads a video from an HTTPS URL and uploads it to GCS.
    
    Args:
        url (str): The HTTPS URL of the video.
        bucket_name (str): The name of the GCS bucket.
        destination_blob_name (str): The desired path in the GCS bucket.

    Returns:
        str: The gs:// URI of the uploaded file.
    """
    print(f"Downloading video from {url}")
    
    # Initialize Google Cloud Storage client
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    
    # Stream the video file from the URL
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        # Check if the content is actually a video
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith(('video/', 'application/octet-stream')):
            raise ValueError(f"Invalid content type: {content_type}. Expected video content.")
        
        # Upload to GCS
        blob.upload_from_string(response.content, content_type="video/mp4")
        print(f"Uploaded to gs://{bucket_name}/{destination_blob_name}")
        return f"gs://{bucket_name}/{destination_blob_name}"
    else:
        raise Exception(f"Failed to fetch video from {url}. HTTP status code: {response.status_code}")
    
def delete_from_gcs(bucket_name, blob_name):
    """
    Deletes a file from GCS.
    
    Args:
        bucket_name (str): The name of the GCS bucket.
        blob_name (str): The path of the file in the bucket.
    """
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.delete()
    print(f"Deleted gs://{bucket_name}/{blob_name}")

def upload_video_to_gcs(video_clip, bucket_name, destination_blob_name):
    """Uploads a MoviePy video clip to Google Cloud Storage"""
    # Create a temporary file for the video
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        temp_filename = temp_file.name

    # Write the video to the temporary file
    video_clip.write_videofile(
        temp_filename,
        codec="libx264",    # Video codec
        audio_codec="aac",  # Audio codec
        fps=30,             # Frames per second
        temp_audiofile="temp-audio.m4a"  # Temporary audio file required by MoviePy
    )

    # Upload to Google Cloud Storage
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    # Upload the temporary file
    blob.upload_from_filename(temp_filename, content_type="video/mp4")
    print(f"Uploaded video to gs://{bucket_name}/{destination_blob_name}")

    # Remove the temporary file after upload
    os.remove(temp_filename)

if __name__ == '__main__':
    video_urls = []
    video_urls.append("https://cuts.diamond.mlb.com/FORGE/2019/2019-03/28/61d1fe61-631389f2-b3138bec-csvm-diamondx64-asset_1280x720_59_4000K.mp4")
    video_urls.append("https://cuts.diamond.mlb.com/FORGE/2019/2019-03/28/8c84d6a3-654215fa-d554779f-csvm-diamondx64-asset_1280x720_59_4000K.mp4")
    video_urls.append("https://cuts.diamond.mlb.com/FORGE/2019/2019-03/28/543a359b-b70e9af2-abfe0f0a-csvm-diamondx64-asset_1280x720_59_4000K.mp4")
    generate_videos(video_urls,"testing")