from logger import logger

def query_chain(chain, user_input: str) -> dict:
    try:
        logger.debug(f"Running chain for input: {user_input}")
        
        result = chain.invoke({"input": user_input})

        response = {
            "response": result.get("answer", ""),
            "sources": [
                doc.metadata.get("source", "") 
                for doc in result.get("source_documents", [])
            ]
        }

        logger.debug(f"Chain response: {response}")
        return response

    except Exception as e:
        logger.exception("Error in query_chain")
        return {"error": "Failed to process the query."}