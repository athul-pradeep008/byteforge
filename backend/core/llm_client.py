import os
import json
import hashlib
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class LLMClient:
    """
    LLM Client supporting Gemini, Claude, or OpenAI providers
    with local disk caching and strict Pydantic model validation.
    """

    def __init__(self, cache_dir: str = "backend/data/cache"):
        self.provider = os.getenv("LLM_PROVIDER", "none").lower()
        self.api_key = (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("ANTHROPIC_API_KEY")
            or os.getenv("OPENAI_API_KEY")
        )
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)

    def _get_cache_key(self, prompt: str, schema_name: str) -> str:
        content = f"{prompt}:{schema_name}".encode("utf-8")
        return hashlib.sha256(content).hexdigest()

    def _read_cache(self, cache_key: str, schema_name: str = "") -> Optional[dict]:
        cache_path = os.path.join(self.cache_dir, f"{cache_key}.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        if schema_name:
            fallback_path = os.path.join(self.cache_dir, f"{schema_name}.json")
            if os.path.exists(fallback_path):
                try:
                    with open(fallback_path, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass
        return None

    def _write_cache(self, cache_key: str, data: dict) -> None:
        cache_path = os.path.join(self.cache_dir, f"{cache_key}.json")
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception:
            pass

    def query(self, prompt: str, response_model: Type[T]) -> T:
        """
        Queries LLM (or cache) and parses response into the given Pydantic model class.
        If LLM_PROVIDER is 'none', missing API key, or API call fails, falls back to pre-seeded schema cache or raises RuntimeError.
        """
        schema_name = response_model.__name__
        cache_key = self._get_cache_key(prompt, schema_name)
        cached_data = self._read_cache(cache_key, schema_name=schema_name)
        if cached_data is not None:
            return response_model.model_validate(cached_data)

        if self.provider == "none" or not self.api_key:
            raise RuntimeError(
                f"LLM Provider '{self.provider}' is not configured or missing API key."
            )

        raw_json_str: Optional[str] = None

        if self.provider == "gemini":
            try:
                import importlib

                genai = importlib.import_module("google.generativeai")

                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                system_prompt = (
                    f"Respond STRICTLY with a valid JSON object matching {response_model.__name__}. "
                    "Do not include markdown triple backticks or any conversational text.\n\n"
                    f"Prompt:\n{prompt}"
                )
                res = model.generate_content(system_prompt)
                text = res.text.strip()
                if text.startswith("```"):
                    lines = text.splitlines()
                    text = "\n".join(
                        lines[1:-1] if lines[-1].startswith("```") else lines[1:]
                    )
                raw_json_str = text.strip()
            except Exception as e:
                raise RuntimeError(f"Gemini API error: {e}")

        elif self.provider == "claude":
            try:
                import importlib

                anthropic = importlib.import_module("anthropic")

                client = anthropic.Anthropic(api_key=self.api_key)
                res = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=1000,
                    system=f"Respond STRICTLY with valid JSON matching {response_model.__name__}.",
                    messages=[{"role": "user", "content": prompt}],
                )
                text = res.content[0].text.strip()
                if text.startswith("```"):
                    lines = text.splitlines()
                    text = "\n".join(
                        lines[1:-1] if lines[-1].startswith("```") else lines[1:]
                    )
                raw_json_str = text.strip()
            except Exception as e:
                raise RuntimeError(f"Claude API error: {e}")

        else:
            raise RuntimeError(f"Unsupported LLM provider: {self.provider}")

        if not raw_json_str:
            raise RuntimeError("Empty response received from LLM provider")

        parsed_json = json.loads(raw_json_str)
        validated_model = response_model.model_validate(parsed_json)
        self._write_cache(cache_key, validated_model.model_dump())
        return validated_model
