import fitz  # PyMuPDF
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import io
import logging
from typing import Dict, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class PDFExtractor:
    """
    Enhanced PDF extractor with a single entry point for text extraction.
    """

    def __init__(self, ocr_language: str = 'eng', max_retries: int = 3):
        """
        Initialize the PDFExtractor.
        :param ocr_language: Language for OCR (default is English).
        :param max_retries: Number of retries for processing.
        """
        self.ocr_language = ocr_language
        self.max_retries = max_retries

    def _extract_text_pymupdf(self, pdf_path: str) -> str:
        """
        Extract text using PyMuPDF.
        :param pdf_path: Path to the PDF file.
        :return: Extracted text.
        """
        doc = fitz.open(pdf_path)
        text_blocks = []

        for page in doc:
            blocks = page.get_text("blocks")
            blocks.sort(key=lambda b: (b[1], b[0]))  # Sort by y, then x
            for block in blocks:
                text = block[4].strip()
                if text:
                    text_blocks.append(text)

        doc.close()
        return "\n".join(text_blocks)

    def _perform_ocr(self, pdf_path: str) -> str:
        """
        Perform OCR on a PDF by converting pages to images.
        :param pdf_path: Path to the PDF file.
        :return: Extracted text via OCR.
        """
        images = convert_from_path(pdf_path)
        text_parts = []

        for img in images:
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_byte_arr = img_byte_arr.getvalue()
            text = pytesseract.image_to_string(Image.open(io.BytesIO(img_byte_arr)), lang=self.ocr_language)
            if text.strip():
                text_parts.append(text.strip())

        return "\n".join(text_parts)

    @classmethod
    def extract_content(cls, pdf_path: str) -> str:
        """
        Extract text from a PDF using PyMuPDF, with OCR fallback.
        :param pdf_path: Path to the PDF file.
        :return: Extracted text.
        """
        extractor = cls()
        errors = []

        for attempt in range(extractor.max_retries):
            try:
                logger.info(f"Attempting text extraction for {pdf_path} (Attempt {attempt + 1})")

                # Extract text using PyMuPDF
                text = extractor._extract_text_pymupdf(pdf_path)

                # If PyMuPDF fails, try OCR
                if not text.strip():
                    logger.warning(f"No text found with PyMuPDF, falling back to OCR for {pdf_path}")
                    text = extractor._perform_ocr(pdf_path)

                if text.strip():
                    return text

            except Exception as e:
                error_msg = f"Attempt {attempt + 1} failed: {e}"
                logger.error(error_msg)
                errors.append(error_msg)

        raise HTTPException(status_code=400, detail=f"Failed to extract text after {extractor.max_retries} attempts: {', '.join(errors)}")


# Example Usage
if __name__ == "__main__":
    # Initialize logger
    logging.basicConfig(level=logging.INFO)

    try:
        # Specify your PDF path
        pdf_path = "path/to/your.pdf"

        # Extract text with the simplified X method
        text = PDFExtractor.X(pdf_path)
        print(f"Extracted Text:\n{text}")

    except HTTPException as e:
        logger.error(f"Extraction failed: {e.detail}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
