"""
Uzbek Law Processor
Specialized document processor for Uzbekistan legal documents (Laws, Codes, Decrees).
"""

import re
import uuid
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

class UzbekLawProcessor:
    """Process Uzbekistan legal documents with specific structure awareness."""
    
    # Document type constants
    TYPE_CODE = "code"       # Kodeks
    TYPE_LAW = "law"         # Qonun
    TYPE_ORDER = "order"     # Buyruq / Nizom / Qaror
    TYPE_GENERIC = "generic"
    
    def __init__(self, chunk_size: int = 12000, chunk_overlap: int = 500):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n\n", "\n\n", "\n", ". ", ", ", " "],
            length_function=len,
        )
    
    def detect_document_type(self, text: str) -> str:
        """Detect the type based on Uzbek key terms."""
        # Check for Code specific structure (BOʻLIM + bob + modda)
        if re.search(r'BOʻLIM', text, re.IGNORECASE) and re.search(r'\d+-modda', text, re.IGNORECASE):
            return self.TYPE_CODE
            
        # Check for Law specific structure (bob + modda, but no BOʻLIM usually, or Qonuni title)
        if re.search(r'Qonuni', text, re.IGNORECASE) and re.search(r'\d+-modda', text, re.IGNORECASE):
            return self.TYPE_LAW
            
        # Check for Order/Regulation (bandlar / numbers)
        if re.search(r'(buyrugʻi|qarori|nizomi)', text, re.IGNORECASE):
            return self.TYPE_ORDER
            
        return self.TYPE_GENERIC

    def parse_uzbek_code_or_law(self, text: str, doc_type: str) -> List[Dict[str, Any]]:
        """Parse Uzbek Codes and Laws (Modda based)."""
        articles = []
        current_section = "UMUMIY QOIDALAR"
        current_chapter = "General"
        current_chapter_num = ""
        current_article = None
        current_article_title = ""
        current_text = []
        
        # Regex patterns
        # Section: BOʻLIM (often numbered: BIRINCHI BOʻLIM)
        section_pattern = re.compile(r'^((BIRINCHI|IKKINCHI|UCHINCHI|TOʻRTINCHI|BESHINCHI|OLTINCHI|YETTINCHI|SAKKIZINCHI|TOʻQQIZINCHI|OʻNINCHI|\d+)[-\s]*)?BOʻLIM[.\s]*(.*)$', re.IGNORECASE)
        
        # Chapter: 1-bob or 1 bob or I bob
        chapter_pattern = re.compile(r'^([IVXLC]+|\d+)[-\s]*bob[.\s]*(.*)$', re.IGNORECASE)
        
        # Article: 1-modda
        article_pattern = re.compile(r'^(\d+)-modda[.\s]*(.*)$', re.IGNORECASE)
        
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Match Section (only for Codes usually)
            if doc_type == self.TYPE_CODE:
                section_match = section_pattern.match(line)
                if section_match:
                    current_section = line
                    continue
            
            # Match Chapter
            chapter_match = chapter_pattern.match(line)
            if chapter_match:
                current_chapter_num = chapter_match.group(1)
                title_part = chapter_match.group(2).strip()
                current_chapter = f"{current_chapter_num}-bob. {title_part}"
                continue
                
            # Match Article
            article_match = article_pattern.match(line)
            if article_match:
                # Save previous
                if current_article and current_text:
                    articles.append({
                        "article_number": current_article,
                        "article_display": f"{current_article}-modda",
                        "chapter": current_chapter,
                        "chapter_num": current_chapter_num,
                        "section": current_section,
                        "title": current_article_title,
                        "content": "\n".join(current_text)
                    })
                
                current_article = article_match.group(1)
                current_article_title = article_match.group(2).strip()
                current_text = [line]
                continue
                
                
            # Accumulate text
            if current_article:
                current_text.append(line)
            else:
                # Capture text before first article as Preamble if significant
                if len(current_text) == 0:
                    current_article = "Mukaddima"
                    current_article_title = "Preamble"
                    current_text = [line]
                else:
                    current_text.append(line)
                
        # Save last
        if current_article and current_text:
            articles.append({
                "article_number": current_article,
                "article_display": f"{current_article}-modda",
                "chapter": current_chapter,
                "chapter_num": current_chapter_num,
                "section": current_section,
                "title": current_article_title,
                "content": "\n".join(current_text)
            })
            
        return articles

    def parse_uzbek_order(self, text: str) -> List[Dict[str, Any]]:
        """Parse Orders/Decrees (numbered points: 1., 2.)."""
        articles = []
        
        # Try to find document title (first few lines usually)
        lines = text.split('\n')
        title_candidates = [l for l in lines[:10] if l.strip() and len(l) > 10]
        doc_title = title_candidates[0] if title_candidates else "Unknown Order"
        
        # Point pattern: "1. " at start of line
        point_pattern = re.compile(r'^(\d+)\.\s+(.+)$')
        
        current_point = None
        current_text = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            match = point_pattern.match(line)
            if match:
                # Save previous
                if current_point and current_text:
                    articles.append({
                        "article_number": current_point,
                        "article_display": f"{current_point}-band",
                        "chapter": "General",
                        "chapter_num": "",
                        "section": doc_title[:100],
                        "title": current_text[0][:100] + "...",
                        "content": "\n".join(current_text)
                    })
                
                current_point = match.group(1)
                current_text = [line]
            else:
                if current_point:
                    current_text.append(line)
                else:
                    # Capture preamble before first point
                    if len(current_text) == 0:
                        current_point = "Mukaddima"
                        current_text = [line]
                    else:
                        current_text.append(line)
        
        # Save last
        if current_point and current_text:
            articles.append({
                "article_number": current_point,
                "article_display": f"{current_point}-band",
                "chapter": "General",
                "chapter_num": "",
                "section": doc_title[:100],
                "title": current_text[0][:100] + "...",
                "content": "\n".join(current_text)
            })
            
        return articles

    def process_text_content(self, text: str, source_name: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Process text content and return chunks with metadata."""
        doc_hash = hashlib.md5(text.encode()).hexdigest()[:12]
        doc_type = self.detect_document_type(text)
        
        if doc_type in [self.TYPE_CODE, self.TYPE_LAW]:
            articles = self.parse_uzbek_code_or_law(text, doc_type)
        elif doc_type == self.TYPE_ORDER:
            articles = self.parse_uzbek_order(text)
        else:
            # Fallback to general chunking if structure not recognized
            articles = []

        chunks = []
        global_chunk_index = 0
        if articles:
            for article in articles:
                article_chunks = self.text_splitter.split_text(article["content"])
                for i, chunk in enumerate(article_chunks):
                    # Create deterministic ID based on source and GLOBAL chunk index to allow UPSERT
                    # We utilize global_chunk_index to ensure uniqueness even if content is identical across articles
                    chunk_id = hashlib.md5(f"{source_name}_{global_chunk_index}_{chunk}".encode()).hexdigest()
                    chunks.append({
                        "id": chunk_id,
                        "content": chunk,
                        "metadata": {
                            "source": source_name,
                            "article_number": article["article_number"],
                            "article_display": article["article_display"],
                            "chapter": article["chapter"],
                            "chapter_num": article["chapter_num"],
                            "section": article["section"],
                            "title": article["title"],
                            "chunk_index": global_chunk_index,
                            "total_chunks": len(article_chunks), # This is per article, maybe misleading? But kept for now.
                            "doc_type": doc_type
                        }
                    })
                    global_chunk_index += 1
        else:
             # Fallback chunking
            text_chunks = self.text_splitter.split_text(text)
            for i, chunk in enumerate(text_chunks):
                chunk_id = hashlib.md5(f"{source_name}_{global_chunk_index}_{chunk}".encode()).hexdigest()
                chunks.append({
                    "id": chunk_id,
                    "content": chunk,
                    "metadata": {
                        "source": source_name,
                        "article_number": "N/A",
                        "article_display": "Text Fragment",
                        "chapter": "General",
                        "chunk_index": global_chunk_index,
                        "total_chunks": len(text_chunks),
                        "doc_type": doc_type
                    }
                })
                global_chunk_index += 1
                
        doc_info = {
            "source_name": source_name,
            "doc_hash": doc_hash,
            "doc_type": doc_type,
            "article_count": len(articles),
            "chunk_count": len(chunks),
            "text_length": len(text)
        }
        
        return chunks, doc_info
