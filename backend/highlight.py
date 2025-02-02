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
from moviepy.editor import CompositeAudioClip

vertexai.init(project=691596640324, location="us-central1")

model = GenerativeModel("gemini-2.0-flash-exp")

def generate_videos(video_urls, user_id, audio_url=None, quality='standard', original_volume=0.7, music_volume=0.3):
    """
    Generates a compilation video with audio from GCS
    
    Args:
        video_urls: List of video URLs to compile
        user_id: User ID for the output filename
        audio_url: GCS URL for the background audio track (e.g. gs://bucket/path/to/audio.mp3)
        quality: Video quality setting ('fast', 'standard', or 'high')
        original_volume: Volume level for original video audio (0.0 to 1.0)
        music_volume: Volume level for background music (0.0 to 1.0)
    """
    if not video_urls:
        raise ValueError("No video URLs provided")

    print(f"Processing {len(video_urls)} videos for user {user_id}")
    print(f"Using background audio: {audio_url}")
    print(f"Quality setting: {quality}")
    print(f"Volume levels - Original: {original_volume}, Music: {music_volume}")
    
    # Quality settings mapping
    quality_settings = {
        'fast': {
            'preset': 'ultrafast',
            'crf': 28,
            'video_bitrate': '2500k',
            'audio_bitrate': '128k',
            'resolution': (480, None)  # 480p
        },
        'standard': {
            'preset': 'medium',
            'crf': 23,
            'video_bitrate': '5000k',
            'audio_bitrate': '192k',
            'resolution': (720, None)  # 720p
        },
        'high': {
            'preset': 'slow',
            'crf': 18,
            'video_bitrate': '8000k',
            'audio_bitrate': '320k',
            'resolution': (1080, None)  # 1080p
        }
    }
    
    # Get quality settings
    settings = quality_settings.get(quality, quality_settings['standard'])
    
    # Process videos in parallel
    from concurrent.futures import ThreadPoolExecutor
    from functools import partial
    
    def process_video(video, index):
        try:
            if not video.startswith(('http://', 'https://')):
                raise ValueError(f"Invalid video URL format: {video}")
            
            print(f"Processing video {index + 1}/{len(video_urls)}: {video}")
            
            clipTime = get_engaging_moments(video).split(",")
            start_time = float(clipTime[0])
            end_time = float(clipTime[1])
            
            # Load video without audio if original volume is 0
            if original_volume == 0:
                clip = load_remote_video_without_audio(video, start_time, end_time, settings)
            else:
                clip = load_remote_video_with_audio(video, start_time, end_time, settings)
                clip = clip.volumex(original_volume)
                print("O: " + str(original_volume))
            
            return clip
            
        except Exception as e:
            print(f"Error processing video {index + 1}: {str(e)}")
            return load_remote_video_without_audio(video, 0.0, 3.0, settings)
    
    #process videos in parallel using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=min(4, len(video_urls))) as executor:
        clips = list(executor.map(process_video, video_urls, range(len(video_urls))))
    
    print("Concatenating video clips...")
    final_video = mp.concatenate_videoclips(clips, method="compose")
    
    try:
        if audio_url and music_volume > 0:
            print(f"Applying background audio from {audio_url}...")
            # Parse bucket and blob path from GCS URL
            bucket_name = audio_url.split('/')[2]
            blob_path = '/'.join(audio_url.split('/')[3:])
            
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            
            with NamedTemporaryFile(suffix='.mp3', delete=False) as temp_audio:
                blob.download_to_filename(temp_audio.name)
                print("Background audio downloaded successfully")
                
                background_audio = mp.AudioFileClip(temp_audio.name)
                
                # If audio is shorter than video, loop it
                if background_audio.duration < final_video.duration:
                    num_loops = int(final_video.duration / background_audio.duration) + 1
                    background_audio = mp.concatenate_audioclips([background_audio] * num_loops)
                
                # Trim audio to match video duration exactly
                background_audio = background_audio.subclip(0, final_video.duration)
                background_audio = background_audio.volumex(music_volume)
                print("M: " + str(music_volume))
                
                combined_audio = CompositeAudioClip([final_video.audio, background_audio])
                final_video = final_video.set_audio(combined_audio)
                
                os.unlink(temp_audio.name)
                print("Background audio applied successfully")
    except Exception as e:
        print(f"Error applying background audio: {str(e)}")
        if original_volume == 0:
            final_video = final_video.without_audio()

    print("Uploading final video...")
    output_path = f"completeHighlights/{user_id}_{int(datetime.datetime.now().timestamp())}.mp4"
    
    # Export with quality settings
    with NamedTemporaryFile(suffix='.mp4', delete=False) as temp_output:
        final_video.write_videofile(
            temp_output.name,
            codec='libx264',
            audio_codec='aac',
            preset=settings['preset'],
            threads=0,
            fps=30,
            bitrate=settings['video_bitrate'],
            audio_bitrate=settings['audio_bitrate']
        )
        
        storage_client = storage.Client()
        bucket = storage_client.bucket('goatbucket1')
        blob = bucket.blob(output_path)
        blob.upload_from_filename(temp_output.name)
        
        os.unlink(temp_output.name)
    
    print("Upload complete!")
    
    for clip in clips:
        try:
            clip.close()
        except:
            pass
    
    public_url = f"https://storage.googleapis.com/goatbucket1/{output_path}"
    return public_url


def get_engaging_moments(video_uri):
    """Get engaging moments from a video using Gemini"""
    try:
        prompt = """
                Give me the most engaging interval of the reel in seconds. Please capture key events for the highlight reel. I am trying to take portions of this clip to cut into a highlights reel, so choose the best section of this reel to be part of that compilation. Make sure to include an entire event in the time interval you give. The interval MUST be at least 3 seconds and at most 15 seconds.
        If you are not sure about any info, please do not make it up. 
        Return the beginning of this interval as a number in seconds with two decimal places, same with the end. 
        Simply answer with a number, like "1.33,9.71", for seconds 1.33 - 9.71 and nothing else.
        """

        temp_video = NamedTemporaryFile(delete=False, suffix=".mp4")
        try:
            response = requests.get(video_uri, stream=True)
            response.raise_for_status()
            
            with open(temp_video.name, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            with open(temp_video.name, 'rb') as f:
                video_data = f.read()
            

            video_file = Part.from_data(
                data=video_data,
                mime_type="video/mp4"
            )


            contents = [video_file, prompt]
            response = model.generate_content(contents)
            print(f"Gemini response: {response.text}")
            

            if not response.text or ',' not in response.text:
                return "0.0,10.0"  
                

            try:
                start, end = map(float, response.text.split(','))
                duration = end - start
                
                if duration < 3:  
                    end = start + 10.0  
                elif duration > 15:  
                    end = start + 10.0 
                    
                return f"{start:.2f},{end:.2f}"
            except Exception as e:
                print(f"Error parsing Gemini response: {str(e)}")
                return "0.0,10.0"  

        except Exception as e:
            print(f"Error processing video: {str(e)}")
            return "0.0,10.0"  
        finally:
            if os.path.exists(temp_video.name):
                os.unlink(temp_video.name)

    except Exception as e:
        print(f"Error in get_engaging_moments: {str(e)}")
        return "0.0,10.0"  

def load_remote_video_with_audio(url, start_time, end_time, settings):
    """Loads a remote MP4 file with both video and audio using quality settings"""
    print(f"Loading video from {url} (time: {start_time} to {end_time})")
    
    temp_video = NamedTemporaryFile(delete=False, suffix=".mp4")

    try:
        # Download and trim video with sound using ffmpeg with quality settings
        (
            ffmpeg
            .input(url, ss=start_time, to=end_time)
            .output(temp_video.name, 
                vcodec="libx264", 
                acodec="aac",
                preset=settings['preset'],
                crf=settings['crf'],
                audio_bitrate=settings['audio_bitrate'],
                threads=0  # Use all available CPU threads
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )

        # Load the video in moviepy with quality settings
        video_clip = mp.VideoFileClip(
            temp_video.name,
            audio=True,  # Load audio directly with video
            target_resolution=settings['resolution'],  # Apply resolution setting
            fps_source="tbr"  # Use target bitrate as FPS source
        )

        return video_clip
    except Exception as e:
        raise Exception(f"Error processing video: {str(e)}")
    finally:
        try:
            os.unlink(temp_video.name)
        except Exception as e:
            print(f"Error cleaning up temporary files: {str(e)}")

def load_remote_video_without_audio(url, start_time, end_time, settings):
    """Loads a remote MP4 file without audio"""
    print(f"Loading video without audio from {url} (time: {start_time} to {end_time})")
    
    # Create temporary file for video
    temp_video = NamedTemporaryFile(delete=False, suffix=".mp4")

    try:
        # Download and trim video without sound using ffmpeg
        (
            ffmpeg
            .input(url, ss=start_time, to=end_time)
            .output(temp_video.name, 
                vcodec="libx264",
                an=None,  # Disable audio
                preset=settings['preset'],
                crf=settings['crf'],
                threads=0
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )

        # Load the video in moviepy without audio
        video_clip = mp.VideoFileClip(
            temp_video.name,
            audio=False,  # Don't load audio
            target_resolution=settings['resolution'],
            fps_source="tbr"
        )

        return video_clip
    except Exception as e:
        raise Exception(f"Error processing video: {str(e)}")
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_video.name)
        except Exception as e:
            print(f"Error cleaning up temporary files: {str(e)}")

def load_remote_video_without_audio(url, start_time, end_time, settings):
    """Loads a remote MP4 file without audio"""
    print(f"Loading video without audio from {url} (time: {start_time} to {end_time})")
    
    # Create temporary file for video
    temp_video = NamedTemporaryFile(delete=False, suffix=".mp4")

    try:
        # Download and trim video without sound using ffmpeg
        (
            ffmpeg
            .input(url, ss=start_time, to=end_time)
            .output(temp_video.name, 
                vcodec="libx264",
                an=None,  # Disable audio
                preset=settings['preset'],
                crf=settings['crf'],
                threads=0
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )

        # Load the video in moviepy without audio
        video_clip = mp.VideoFileClip(
            temp_video.name,
            audio=False,  # Don't load audio
            target_resolution=settings['resolution'],
            fps_source="tbr"
        )

        return video_clip
    except Exception as e:
        raise Exception(f"Error processing video: {str(e)}")
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_video.name)
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
    
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    

    response = requests.get(url, stream=True)
    if response.status_code == 200:

        content_type = response.headers.get('content-type', '')
        if not content_type.startswith(('video/', 'application/octet-stream')):
            raise ValueError(f"Invalid content type: {content_type}. Expected video content.")

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

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        temp_filename = temp_file.name


    video_clip.write_videofile(
        temp_filename,
        codec="libx264",    
        audio_codec="aac",  
        fps=30,             
        temp_audiofile="temp-audio.m4a" 
    )


    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)


    blob.upload_from_filename(temp_filename, content_type="video/mp4")
    print(f"Uploaded video to gs://{bucket_name}/{destination_blob_name}")


    os.remove(temp_filename)

if __name__ == '__main__':
    video_urls = []
    video_urls.append("https://cuts.diamond.mlb.com/FORGE/2019/2019-03/28/61d1fe61-631389f2-b3138bec-csvm-diamondx64-asset_1280x720_59_4000K.mp4")
    video_urls.append("https://cuts.diamond.mlb.com/FORGE/2019/2019-03/28/8c84d6a3-654215fa-d554779f-csvm-diamondx64-asset_1280x720_59_4000K.mp4")
    video_urls.append("https://cuts.diamond.mlb.com/FORGE/2019/2019-03/28/543a359b-b70e9af2-abfe0f0a-csvm-diamondx64-asset_1280x720_59_4000K.mp4")
    generate_videos(video_urls,"testing")