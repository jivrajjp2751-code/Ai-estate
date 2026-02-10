import os
import json
import asyncio
import logging
import hashlib
from fastapi import FastAPI, Request, BackgroundTasks, Form
from fastapi.responses import Response, JSONResponse, FileResponse
from openai import OpenAI
from dotenv import load_dotenv
import requests

# Load environment variables (FORCE OVERRIDE)
load_dotenv(override=True)

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Exotel Configuration
EXOTEL_SID = os.getenv("EXOTEL_SID")
EXOTEL_API_KEY = os.getenv("EXOTEL_API_KEY")
EXOTEL_API_TOKEN = os.getenv("EXOTEL_API_TOKEN")
EXOTEL_SUBDOMAIN = os.getenv("EXOTEL_SUBDOMAIN", "api")
EXOTEL_PHONE_NUMBER = os.getenv("EXOTEL_PHONE_NUMBER")

HOST_URL = os.getenv("HOST_URL")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM") 

print(f"DEBUG: Loaded HOST_URL from .env: '{HOST_URL}'") 

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("VoiceAgent")

# Initialize OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

# Ensure audio directory exists
AUDIO_DIR = "audio_cache"
if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)

# Auto-start Ngrok if running locally
try:
    if "localhost" in HOST_URL or "127.0.0.1" in HOST_URL:
        import sys
        import traceback
        from pyngrok import ngrok, conf
        
        logger.info("⏳ Attempting to start Ngrok tunnel...")

        # Force kill any zombie tunnels
        ngrok.kill()

        # Open a HTTP tunnel on the default port 8000
        public_url = ngrok.connect(8000).public_url
        logger.info(f"🚀 Ngrok Tunnel Started: {public_url}")
            
        HOST_URL = public_url
except Exception as e:
    logger.error("--------------------------------------------------")
    logger.error("❌ CRTICAL ERROR: Could not start Ngrok Tunnel!")
    logger.error(f"Error Details: {e}")
    traceback.print_exc()
    logger.error("--------------------------------------------------")
    logger.warning("If you see an authentication error, you may need to run 'ngrok config add-authtoken <TOKEN>' in your terminal.")

app = FastAPI()

# Context Storage
call_contexts = {}

SYSTEM_PROMPT = """
You are 'Purva', an expert and friendly estate agent from the company 'AI Estate Agent'.
You are speaking with a customer on the phone. Your goal is to be helpful, professional, and persuasive.
You have access to a list of properties that match the customer's interest. 
Use this information to recommend homes.
Keep your responses CONCISE (1-2 sentences max) as this is a phone conversation.
Speak in a natural, Indian English professional tone.
"""

def generate_elevenlabs_audio(text):
    """Generates audio from ElevenLabs and returns the filename."""
    if not ELEVENLABS_API_KEY:
        return None

    # Create a hash of the text to use as filename (caching)
    text_hash = hashlib.md5(text.encode()).hexdigest()
    filename = f"{text_hash}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    # Return filtered cache if exists
    if os.path.exists(filepath):
        return filename

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(response.content)
            return filename
        else:
            logger.error(f"ElevenLabs Error: {response.text}")
            return None
    except Exception as e:
        logger.error(f"ElevenLabs Exception: {e}")
        return None

@app.get("/")
def home():
    return {"message": "AI Estate Agent Voice Server (Exotel)"}

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(AUDIO_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    return Response(status_code=404)

@app.post("/start-call")
async def start_call(request: Request):
    try:
        data = await request.json()
        to_number = data.get("phone")
        customer_name = data.get("name")
        property_context = data.get("property_context", "No specific properties.")
        
        context_id = f"call_{os.urandom(4).hex()}"
        
        call_params = {
            "customer_name": customer_name,
            "property_context": property_context,
            "history": [
                {"role": "system", "content": SYSTEM_PROMPT + f"\n\nContext used for this call:\n{property_context}"}
            ]
        }
        call_contexts[context_id] = call_params

        # Route to Exotel
        if EXOTEL_SID and EXOTEL_API_KEY and EXOTEL_API_TOKEN:
            logger.info(f"Initiating Exotel Call to {to_number}...")
            
            # Exotel API Endpoint
            url = f"https://{EXOTEL_SUBDOMAIN}.exotel.com/v1/Accounts/{EXOTEL_SID}/Calls/connect.json"
            
            # Basic Auth
            auth = (EXOTEL_API_KEY, EXOTEL_API_TOKEN)
            
            # Form Data
            # Note: For a true AI agent, the 'From' should connect to a Controller Flow or Applet URL
            # But Exotel connect needs a second phone number or a Flow ID.
            # Assuming you want to connect the customer to YOU (the agent) or a flow.
            # For now, we will try to connect the Customer (From) to the Agent/Office (To).
            # Or vice versa.
            
            payload = {
                "From": to_number, # The customer
                "To": EXOTEL_PHONE_NUMBER, # Your Exophone / Agent Number
                "CallerId": EXOTEL_PHONE_NUMBER,
                "CustomField": context_id 
                # "Url": f"{HOST_URL}/exotel/callback" # Exotel typically uses 'StatusCallback' or Flow URL
            }
            
            response = requests.post(url, auth=auth, data=payload)
            res_json = response.json()
            
            logger.info(f"Exotel Response: {res_json}")
            
            if response.status_code == 200:
                call_sid = res_json.get("Call", {}).get("Sid")
                return {"message": "Call initiated via Exotel", "call_id": call_sid}
            else:
                return JSONResponse(content={"error": "Exotel Failed", "details": res_json}, status_code=500)
        else:
            return JSONResponse(content={"error": "Exotel Credentials Missing"}, status_code=500)

    except Exception as e:
        logger.error(f"Error starting call: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/debug")
def debug_status():
    logger.info(f"DEBUG CHECK: HOST_URL={HOST_URL}")
    return {
        "HOST_URL": HOST_URL,
        "EXOTEL_CONFIGURED": bool(EXOTEL_SID and EXOTEL_API_KEY),
        "NGROK_ACTIVE": "ngrok" in str(HOST_URL)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
