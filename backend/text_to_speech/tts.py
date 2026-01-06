import io
import os
import uuid
from typing import Optional

import modal
from pydantic import BaseModel, Field
import torch
import torchaudio

# ------------------- Modal App -------------------
app = modal.App("ai-voice-studio")

# ------------------- Image -------------------
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("numpy==1.26.0")            # install first to avoid Torch warning
    .pip_install("torch==2.6.0", "torchaudio")
    .pip_install_from_requirements("requirements.txt")
    .apt_install("ffmpeg")
)

# ------------------- Volumes & Secrets -------------------
hf_volume = modal.Volume.from_name("hf-cache-ai-voice-studio", create_if_missing=True)
s3_secret = modal.Secret.from_name("s3-aivoice")

# ------------------- Request / Response Models -------------------
class TextToSpeechRequest(BaseModel):
    text: str = Field(..., description="The text to be converted to speech.")
    voice_s3_key: Optional[str] = None
    language: str = "en"
    exaggeration: float = 0.5
    cfg_weight: float = 0.5

class TextToSpeechResponse(BaseModel):
    s3_key: str

# ------------------- Modal Class -------------------
@app.cls(
    image=image,
    gpu="L40S",
    volumes={
        "/root/.cache/huggingface": hf_volume,
        "/s3-mount": modal.CloudBucketMount(
            "s3-vocieai",
            secret=s3_secret
        ),
    },
    scaledown_window=120,
    secrets=[s3_secret],
)
class TextToSpeechServer:

    @modal.enter()
    def load_modal(self):
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        self.model = ChatterboxMultilingualTTS.from_pretrained(device="cuda")

    # ------------------- FastAPI endpoint -------------------
    @modal.fastapi_endpoint(requires_proxy_auth=True)
    def generate_speech(self, request: TextToSpeechRequest) -> TextToSpeechResponse:
        with torch.no_grad():
            if request.voice_s3_key:
                audio_prompt_path = f"/s3-mount/{request.voice_s3_key}"
                if not os.path.exists(audio_prompt_path):
                    raise FileNotFoundError(f"Audio prompt file not found: {audio_prompt_path}")

                wav = self.model.generate(
                    request.text,
                    audio_prompt_path=audio_prompt_path,
                    language_id=request.language,
                    exaggeration=request.exaggeration,
                    cfg_weight=request.cfg_weight,
                )
            else:
                wav = self.model.generate(
                    request.text,
                    language_id=request.language,
                    exaggeration=request.exaggeration,
                    cfg_weight=request.cfg_weight,
                )

            wav_cpu = wav.cpu()

        # Save to buffer
        buffer = io.BytesIO()
        torchaudio.save(buffer, wav_cpu, self.model.sr, format="wav")
        buffer.seek(0)
        audio_bytes = buffer.read()

        # Write WAV file into S3 mount
        audio_uuid = str(uuid.uuid4())
        s3_key = f"tts/{audio_uuid}.wav"
        s3_path = f"/s3-mount/{s3_key}"

        os.makedirs(os.path.dirname(s3_path), exist_ok=True)
        with open(s3_path, "wb") as f:
            f.write(audio_bytes)

        print(f"Saved audio to S3: {s3_key}")
        return TextToSpeechResponse(s3_Key=s3_key)
