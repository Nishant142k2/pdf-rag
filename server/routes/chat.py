from fastapi import APIRouter, Form
from fastapi.responses import JSONResponse
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from langchain_core.documents import Document
from langchain.schema import BaseRetriever
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pinecone import Pinecone
from pydantic import Field
from typing import List, Optional
from logger import logger
import os

# Create the router instance
router = APIRouter()

@router.post("/chat/")
async def ask_question(question: str = Form(...)):
    try:
        logger.info(f"user query: {question}")

        # Embed model + Pinecone setup
        pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
        index = pc.Index(os.environ["PINECONE_INDEX_NAME"])
        embed_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        embedded_query = embed_model.embed_query(question)
        
        # Retrieve documents with better filtering
        res = index.query(
            vector=embedded_query, 
            top_k=10,  # Get more candidates
            include_metadata=True
        )
        
        # DEBUG: Check Pinecone response
        logger.info(f"Pinecone matches found: {len(res['matches'])}")
        for i, match in enumerate(res['matches']):
            score = match.get('score', 0)
            metadata = match.get('metadata', {})
            text_length = len(metadata.get('text', ''))
            logger.info(f"Match {i}: score={score:.3f}, text_length={text_length}")
            if metadata.get('text'):
                logger.info(f"Match {i} text preview: {metadata['text'][:200]}...")

        # Process documents with better validation
        docs = []
        seen_content = set()  # Avoid duplicate content
        
        for match in res["matches"]:
            metadata = match["metadata"]
            text = metadata.get("text", "").strip()
            
            # Enhanced content handling
            if len(text) <= 3 or text.isdigit():  # Just page numbers or minimal content
                # Try to create meaningful content from metadata
                enhanced_content = []
                
                if metadata.get('title'):
                    enhanced_content.append(f"Title: {metadata['title']}")
                
                if metadata.get('subject'):
                    enhanced_content.append(f"Subject: {metadata['subject']}")
                
                if metadata.get('keywords'):
                    enhanced_content.append(f"Keywords: {metadata['keywords']}")
                
                if metadata.get('author'):
                    enhanced_content.append(f"Author: {metadata['author']}")
                
                page_info = metadata.get('page_label', metadata.get('page', ''))
                if page_info:
                    enhanced_content.append(f"Page: {page_info}")
                
                if enhanced_content:
                    text = "\n".join(enhanced_content)
                else:
                    continue  # Skip if no meaningful content
            
            # Skip duplicates and very short content
            if text in seen_content or len(text) < 20:
                continue
                
            seen_content.add(text)
            
            docs.append(Document(
                page_content=text,
                metadata={
                    "source": metadata.get("filename", metadata.get("source", "Unknown")),
                    "page": metadata.get("page_label", metadata.get("page", "Unknown")),
                    "title": metadata.get("title", "Unknown"),
                    "score": match.get("score", 0)
                }
            ))
            
            # Limit to top documents
            if len(docs) >= 5:
                break
        
        logger.info(f"Created {len(docs)} valid documents for retrieval")
        
        # If no valid documents found, return helpful message
        if not docs:
            return JSONResponse(
                status_code=200,
                content={
                    "answer": "I couldn't find relevant information to answer your question. The documents may not contain the information you're looking for, or they may need to be re-indexed with better content extraction.",
                    "sources": []
                }
            )

        # Custom retriever class
        class SimpleRetriever(BaseRetriever):
            tags: Optional[List[str]] = Field(default_factory=list)
            metadata: Optional[dict] = Field(default_factory=dict)

            def __init__(self, documents: List[Document]):
                super().__init__()
                self._docs = documents

            def _get_relevant_documents(self, query: str) -> List[Document]:
                return self._docs

        # Log document previews for debugging
        for i, doc in enumerate(docs):
            logger.info(f"Doc {i} preview: {doc.page_content[:100]}...")

        retriever = SimpleRetriever(docs)
        chain = get_llm_chain(retriever)
        result = query_chain(chain, question)
        
        # Extract sources from documents
        sources = []
        for doc in docs:
            source_info = {
                "source": doc.metadata.get("source", "Unknown"),
                "page": doc.metadata.get("page", "Unknown"),
                "title": doc.metadata.get("title", "Unknown"),
                "relevance_score": round(doc.metadata.get("score", 0), 3)
            }
            if source_info not in sources:
                sources.append(source_info)
        
        # Ensure consistent response structure
        if isinstance(result, dict):
            # The result from query_chain already has the right structure
            answer = result.get("answer") or result.get("response") or "No answer provided"
            result_sources = result.get("sources", [])
            
            # Merge sources from result and extracted sources
            all_sources = result_sources if result_sources else sources
            
            response = {
                "answer": answer,
                "sources": all_sources
            }
        elif isinstance(result, str):
            response = {
                "answer": result,
                "sources": sources
            }
        else:
            response = {
                "answer": str(result),
                "sources": sources
            }
        
        logger.info(f"Sending response with {len(response['sources'])} sources")
        logger.info("query successful")
        return JSONResponse(status_code=200, content=response)

    except Exception as e:
        logger.exception("Error processing question")
        return JSONResponse(
            status_code=500, 
            content={"error": f"Internal server error: {str(e)}"}
        )