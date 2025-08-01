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
        response = {
            "response": result.get("answer", ""),
            "sources": [doc.metadata.get("source", "") for doc in result.get("source_documents", [])]
        }
        logger.debug(f"Chain response: {response}")
        return response
    except Exception as e:
        logger.exception("Error on query chain")
        return {"error": "Something went wrong while processing the query."}

def get_llm_chain(retriever):
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama3-70b-8192"
    )

    prompt = ChatPromptTemplate.from_template("""
You are an expert assistant whose sole job is to answer questions using only the provided context. 
Do not draw on any external knowledge or hallucinate—if the context doesn’t contain the answer, simply reply:

“I’m sorry, but I don’t have enough information to answer that.”

1. Read through the Context below.
2. Write a concise, accurate answer to the Question.
3. If the context contains multiple relevant pieces, synthesize them into a single, coherent response.
4. Cite the context by referencing “(see above Context)”—no URLs.

—  
Context:  
{context}

—  
Question:  
{input}

—  
Answer:
""")

    combine_docs_chain = create_stuff_documents_chain(llm=llm, prompt=prompt)
    retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)
    return retrieval_chain
