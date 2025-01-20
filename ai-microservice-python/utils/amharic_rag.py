from fastapi import FastAPI, Form, HTTPException
from googletrans import Translator
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

class ConcurrentTranslator:
    def __init__(self, max_workers=3):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.translators = [Translator() for _ in range(max_workers)]
    
    def translate_chunk_sync(self, chunk: str, translator_idx: int, src='am', dest='en') -> str:
        """Synchronously translate a single chunk"""
        try:
            if not chunk or not isinstance(chunk, str):
                logger.warning(f"Invalid chunk received: {chunk}")
                return ""
            
            # Clean the input text
            chunk = chunk.strip()
            if not chunk:
                return ""
                
            result = self.translators[translator_idx].translate(chunk, src=src, dest=dest)
            if not result or not result.text:
                logger.warning(f"Empty translation result for chunk: {chunk}")
                return chunk  # Return original text if translation fails
                
            return result.text
        except Exception as e:
            logger.error(f"Translation error for chunk '{chunk}': {str(e)}")
            return chunk  # Return original text if translation fails

    async def translate_chunk(self, chunk: str, translator_idx: int, src='am', dest='en') -> str:
        """Translate a single chunk using the specified translator instance"""
        try:
            return await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.translate_chunk_sync,
                chunk,
                translator_idx,
                src,
                dest
            )
        except Exception as e:
            logger.error(f"Async translation error: {str(e)}")
            return chunk  # Return original text if translation fails

    async def translate_text(self, text: str, src='am', dest='en', chunk_size: int = 500) -> str:
        """Split text into chunks and translate them concurrently"""
        try:
            if not text or not isinstance(text, str):
                logger.warning(f"Invalid input text: {text}")
                return ""
                
            # Clean the input text
            text = text.strip()
            if not text:
                return ""
                
            # Split text into chunks
            chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
            if not chunks:
                return text
            
            # Create translation tasks for each chunk
            tasks = []
            for i, chunk in enumerate(chunks):
                if chunk and chunk.strip():  # Only translate non-empty chunks
                    translator_idx = i % len(self.translators)
                    tasks.append(self.translate_chunk(chunk, translator_idx, src, dest))
            
            if not tasks:
                return text
                
            translated_chunks = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out None values and handle exceptions
            valid_chunks = []
            for chunk in translated_chunks:
                if isinstance(chunk, Exception):
                    logger.error(f"Chunk translation failed: {chunk}")
                    continue
                if chunk:
                    valid_chunks.append(chunk)
            
            return " ".join(valid_chunks) if valid_chunks else text
            
        except Exception as e:
            logger.error(f"Translation failed: {str(e)}")
            return text  