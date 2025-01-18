import concurrent.futures
import re
import pdfplumber
from fastapi import HTTPException
import logging
import os
from typing import List

logger = logging.getLogger(__name__)

class PDFExtractor:
    """
    Enhanced PDF text extraction utility with better text ordering and encoding handling
    """
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=400, detail="PDF file not found")
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                def process_page(page) -> str:
                    # Extract text with word coordinates
                    words = page.extract_words(
                        keep_blank_chars=True,
                        x_tolerance=3,
                        y_tolerance=3,
                        extra_attrs=['fontname', 'size']
                    )
                    
                    if not words:
                        return ""
                    
                    # Sort words by their vertical position first, then horizontal
                    # This helps maintain correct reading order
                    sorted_words = sorted(
                        words,
                        key=lambda w: (round(w['top'], 1), w['x0'])
                    )
                    
                    # Group words into lines based on vertical position
                    current_line: List[str] = []
                    lines: List[List[str]] = []
                    current_y = None
                    
                    for word in sorted_words:
                        if current_y is None:
                            current_y = round(word['top'], 1)
                        
                        # If we've moved to a new line
                        if abs(round(word['top'], 1) - current_y) > 3:
                            if current_line:
                                lines.append(current_line)
                            current_line = []
                            current_y = round(word['top'], 1)
                        
                        # Clean the word text
                        word_text = word['text'].strip()
                        if word_text:
                            # Handle special cases like "Article" followed by numbers
                            if re.match(r'^[Aa]rticle\s*$', word_text):
                                next_word = word_text
                            else:
                                next_word = word_text
                            current_line.append(next_word)
                    
                    # Don't forget the last line
                    if current_line:
                        lines.append(current_line)
                    
                    # Join words and lines with appropriate spacing
                    return '\n'.join(' '.join(line) for line in lines)
                
                # Process pages in parallel
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    texts = list(executor.map(process_page, pdf.pages))
                
                # Join all pages and clean up
                text = '\n'.join(page_text.strip() for page_text in texts if page_text.strip())
                
                # Final cleanup
                text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
                text = re.sub(r'([A-Za-z])(\d)', r'\1 \2', text)  # Add space between letters and numbers
                text = re.sub(r'(\d)([A-Za-z])', r'\1 \2', text)  # Add space between numbers and letters
                
                if not text.strip():
                    raise ValueError("No extractable text found in the PDF.")
                
                return text.strip()
                
        except FileNotFoundError:
            logger.error(f"PDF file not found: {pdf_path}")
            raise HTTPException(status_code=404, detail="PDF file not found.")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")