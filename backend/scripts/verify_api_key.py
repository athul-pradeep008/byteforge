import os
import sys
import time
import json
import urllib.request
import urllib.error

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Manually parse .env file if present so script runs with 0 external dependencies
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()

# Try dotenv module if installed
try:
    import importlib
    _dotenv = importlib.import_module("dotenv")
    _dotenv.load_dotenv(env_path)
except Exception:
    pass


def test_gemini_connection():
    provider = os.getenv("LLM_PROVIDER", "none").lower()
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    active_key = gemini_key or anthropic_key or openai_key

    print("=" * 60)
    print(" 🔌 CyberImmune 2.0 - LLM API Connection Verification")
    print("=" * 60)
    print(f"Provider Configured: {provider.upper()}")
    
    if active_key:
        masked_key = active_key[:6] + "..." + active_key[-5:] if len(active_key) > 11 else "***"
        print(f"Active API Key:      {masked_key}")
    else:
        print("Active API Key:      NONE FOUND")

    print("-" * 60)

    if not active_key or provider == "none":
        print("❌ Error: No API Key or LLM Provider configured in .env file.")
        print("Please check your .env file in the project root directory.")
        return False

    print("Sending live test request to AI API endpoint...")
    start_time = time.time()

    # 1. Try google.generativeai SDK if available
    try:
        import importlib
        genai = importlib.import_module("google.generativeai")
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Ping test. Reply: PONG")
        elapsed = time.time() - start_time
        print("\n✅ CONNECTION SUCCESSFUL! (via Generative AI SDK)")
        print(f"⏱️ Response Time: {elapsed:.2f} seconds")
        print(f"🤖 Model Output:  {response.text.strip()}")
        print("\nYour Gemini API key is valid and working correctly!")
        return True
    except Exception:
        pass

    # 2. Direct HTTP REST API call via standard library urllib (works anywhere!)
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_key}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CyberImmune-Verification/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elapsed = time.time() - start_time
            models_count = len(data.get("models", []))
            print("\n✅ CONNECTION SUCCESSFUL! (via Direct REST API)")
            print(f"⏱️ Response Time: {elapsed:.2f} seconds")
            print(f"📡 API Endpoint:  Gemini v1beta ({models_count} models available)")
            print("\nYour Gemini API key is valid and successfully authenticated!")
            return True
    except urllib.error.HTTPError as err:
        elapsed = time.time() - start_time
        print(f"\n❌ CONNECTION FAILED! (HTTP Error {err.code}: {err.reason})")
        try:
            err_body = err.read().decode("utf-8")
            err_json = json.loads(err_body)
            msg = err_json.get("error", {}).get("message", err_body)
            print(f"Error Details: {msg}")
        except Exception:
            print(f"Error Details: {err}")
        return False
    except Exception as err:
        elapsed = time.time() - start_time
        print(f"\n❌ CONNECTION FAILED! ({err})")
        return False


if __name__ == "__main__":
    test_gemini_connection()
