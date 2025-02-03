from vertexai.preview.vision_models import ImageGenerationModel
import vertexai
from dotenv import load_dotenv

def generate_image(prompt: str, output_file: str, project_id: str, location: str = "us-central1"):
    load_dotenv()
    vertexai.init(project=project_id, location=location)

    model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-002")

    images = model.generate_images(
        prompt=prompt,
        number_of_images=1,
        language="en",
        aspect_ratio="1:1",
        safety_filter_level="block_some",
        person_generation="allow_adult"
    )

    images[0].save(location=output_file, include_generation_parameters=False)
    return output_file

if __name__ == "__main__":
    generated_image_path = generate_image(
        prompt="Cartoon Shohei Ohtani",
        output_file="sticker.png",
        project_id="691596640324"
    )
    print(f"Image saved to: {generated_image_path}")