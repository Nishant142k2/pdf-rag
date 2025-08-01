from logger import logger
from langchain.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY is not set in the environment.")

def query_chain(chain, user_input: str):
    try:
        logger.debug(f"Running chain for input: {user_input}")
        result = chain.invoke({"input": user_input})
        
        # Debug: Log the actual result structure
        logger.debug(f"Raw chain result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        logger.debug(f"Raw chain result: {result}")
        
        # The retrieval chain returns answer in 'answer' key, not 'response'
        answer = result.get("answer", "")
        
        # Extract source documents - they might be in 'context' or 'source_documents'
        source_docs = result.get("source_documents", result.get("context", []))
        
        # Extract source information
        sources = []
        if source_docs:
            for doc in source_docs:
                if hasattr(doc, 'metadata'):
                    source_info = {
                        "source": doc.metadata.get("source", "Unknown"),
                        "page": doc.metadata.get("page", "Unknown"),
                        "title": doc.metadata.get("title", "Unknown")
                    }
                    if source_info not in sources:
                        sources.append(source_info)
        
        response = {
            "response": answer,  # Keep 'response' key for backward compatibility
            "answer": answer,    # Also provide 'answer' key
            "sources": sources
        }
        
        logger.debug(f"Processed chain response: {response}")
        return response
        
    except Exception as e:
        logger.exception("Error on query chain")
        return {
            "response": "Something went wrong while processing the query.",
            "answer": "Something went wrong while processing the query.",
            "sources": [],
            "error": str(e)
        }

def get_llm_chain(retriever):
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama3-70b-8192"
    )

    # Improved prompt with better instructions
    prompt = ChatPromptTemplate.from_template("""
You are an expert assistant whose sole job is to answer questions using only the provided context. 
Follow these rules strictly:

1. ONLY use information from the Context provided below
2. If the context doesn't contain enough information to answer the question, respond with: "I don't have enough information in the provided context to answer that question."
3. Be concise but comprehensive in your answer
4. If you find relevant information, provide a clear and direct answer
5. Do not make assumptions or add information not present in the context
6. If the context contains metadata (like titles, authors, page numbers), you can reference it to provide better context

Context:
{context}

Question: {input}

Answer:""")

    # Create the document chain
    combine_docs_chain = create_stuff_documents_chain(llm=llm, prompt=prompt)
    
    # Create the retrieval chain
    retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)
    
    return retrieval_chain