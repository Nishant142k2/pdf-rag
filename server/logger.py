import logging


def setup_logger(name ="RAG PDF READER") :
    logger =logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    ch= logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    
    
    formatter = logging.Formatter('[%(asctime)s]  [%(levelname)s] --- [%(message)s]')
    ch.setFormatter(formatter)
    
    if not logger.hasHandlers():
        logger.addHandler(ch)
    return logger


logger = setup_logger()

# logger.info("RAG App started")
# logger.debug("Debugging RAG App")
# logger.error("Error in RAG App")    
# logger.critical("Critical issue in RAG App")

        