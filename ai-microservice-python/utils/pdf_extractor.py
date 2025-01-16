# pdf_extractor.py
import concurrent.futures
import re
import pdfplumber
from fastapi import HTTPException
import logging
import os

logger = logging.getLogger(__name__)

class PDFExtractor:
    """
    Simple PDF text extraction utility
    """
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=400, detail="PDF file not found")

        try:
            with pdfplumber.open(pdf_path) as pdf:
                def process_page(page):
                    page_text = page.extract_text()
                    if page_text:
                        # Remove trailing numbers or noise
                        return re.sub(r"\s*\d+\s*$", "", page_text)
                    return ""

                with concurrent.futures.ThreadPoolExecutor() as executor:
                    texts = executor.map(process_page, pdf.pages)

            text = "\n".join(page_text.strip() for page_text in texts if page_text.strip())
            if not text.strip():
                raise ValueError("No extractable text found in the PDF.")

            return text.strip()

        except FileNotFoundError:
            logger.error(f"PDF file not found: {pdf_path}")
            raise HTTPException(status_code=404, detail="PDF file not found.")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")
