import os
import time
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY=os.getenv("PINECONE_API_KEY")
PINECONE_ENV="us-east-1"
PINECONE_INDEX_NAME="ragindex"

os.environ["GOOGLE_API_KEY"]=GOOGLE_API_KEY

UPLOAD_DIR="./uploaded_docs"
os.makedirs(UPLOAD_DIR,exist_ok=True)


# initialize pinecone instance
pc=Pinecone(api_key=PINECONE_API_KEY)
spec=ServerlessSpec(cloud="aws",region=PINECONE_ENV)
existing_indexes=[i["name"] for i in pc.list_indexes()]


if PINECONE_INDEX_NAME not in existing_indexes:
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=768,
        metric="dotproduct",
        spec=spec
    )
    while not pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
        time.sleep(1)


index=pc.Index(PINECONE_INDEX_NAME)

# load,split,embed and upsert pdf docs content


def load_vectorstore(uploaded_files):
    """Improved version with comprehensive error handling and debugging"""
    print("🚀 Starting vectorstore loading...")
    
    try:
        embed_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        print("✅ Embedding model initialized")
    except Exception as e:
        print(f"❌ Failed to initialize embedding model: {e}")
        return False
    
    file_paths = []
    
    # Save uploaded files
    for file in uploaded_files:
        try:
            save_path = Path(UPLOAD_DIR) / file.filename
            with open(save_path, "wb") as f:
                f.write(file.file.read())
            file_paths.append(str(save_path))
            print(f"✅ Saved file: {save_path}")
        except Exception as e:
            print(f"❌ Failed to save file {file.filename}: {e}")
            continue
    
    if not file_paths:
        print("❌ No files were successfully saved")
        return False
    
    total_chunks_processed = 0
    
    for file_path in file_paths:
        print(f"\n📄 Processing: {file_path}")
        
        try:
            # Load PDF
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            print(f"✅ Loaded PDF: {len(documents)} pages")
            
            if not documents:
                print("❌ No documents found in PDF")
                continue
            
            # Check if PDF has content
            total_chars = sum(len(doc.page_content) for doc in documents)
            print(f"📊 Total characters: {total_chars}")
            
            if total_chars == 0:
                print("❌ PDF appears to be empty")
                continue
            
            # Split documents
            splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
            chunks = splitter.split_documents(documents)
            print(f"✅ Created {len(chunks)} chunks")
            
            if not chunks:
                print("❌ No chunks created")
                continue
            
            # Extract data
            texts = [chunk.page_content for chunk in chunks]
            metadatas = [chunk.metadata for chunk in chunks]
            ids = [f"{Path(file_path).stem}-{i}" for i in range(len(chunks))]
            
            # Debug: Show sample chunk
            print(f"📝 Sample chunk: {texts[0][:100]}...")
            
            # Generate embeddings
            print(f"🔍 Embedding {len(texts)} chunks...")
            try:
                embeddings = embed_model.embed_documents(texts)
                print(f"✅ Generated {len(embeddings)} embeddings")
                print(f"📏 Embedding dimension: {len(embeddings[0]) if embeddings else 'N/A'}")
            except Exception as e:
                print(f"❌ Failed to generate embeddings: {e}")
                continue
            
            # Prepare vectors for Pinecone
            print("📤 Preparing vectors for Pinecone...")
            vectors = []
            for i in range(len(embeddings)):
                metadata = metadatas[i].copy()
                metadata['text'] = texts[i]  # Store the actual text
                metadata['filename'] = Path(file_path).name  # Add filename for reference
                
                vectors.append({
                    'id': ids[i],
                    'values': embeddings[i],
                    'metadata': metadata
                })
            
            print(f"✅ Prepared {len(vectors)} vectors")
            
            # Upsert to Pinecone in batches
            batch_size = 100
            successful_upserts = 0
            
            print("📤 Uploading to Pinecone...")
            with tqdm(total=len(vectors), desc="Upserting to Pinecone") as progress:
                for i in range(0, len(vectors), batch_size):
                    batch = vectors[i:i + batch_size]
                    try:
                        upsert_response = index.upsert(vectors=batch)
                        successful_upserts += len(batch)
                        progress.update(len(batch))
                        print(f"✅ Batch upserted: {len(batch)} vectors")
                    except Exception as e:
                        print(f"❌ Failed to upsert batch: {e}")
                        progress.update(len(batch))
            
            total_chunks_processed += successful_upserts
            print(f"✅ Successfully processed {successful_upserts} chunks from {file_path}")
            
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            continue
    
    print(f"\n🎉 VECTORSTORE LOADING COMPLETE")
    print(f"📊 Total chunks processed: {total_chunks_processed}")
    
    # Verify the upload
    try:
        stats = index.describe_index_stats()
        print(f"📈 Index now contains {stats.get('total_vector_count', 0)} total vectors")
    except Exception as e:
        print(f"❌ Could not verify index stats: {e}")
    
    return total_chunks_processed > 0

def test_rag_chain(query):
    """Test function to verify RAG chain is working"""
    print(f"\n🧪 TESTING RAG CHAIN WITH QUERY: '{query}'")
    print("=" * 50)
    
    try:
        embed_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        
        # 1. Generate query embedding
        query_embedding = embed_model.embed_query(query)
        print(f"✅ Query embedding generated")
        
        # 2. Search Pinecone
        results = index.query(
            vector=query_embedding,
            top_k=5,
            include_metadata=True
        )
        
        print(f"🔍 Found {len(results['matches'])} matches")
        
        if not results['matches']:
            print("❌ No matches found - this is why your RAG is failing!")
            return None
        
        # 3. Extract context
        contexts = []
        for match in results['matches']:
            if 'text' in match['metadata']:
                contexts.append(match['metadata']['text'])
                print(f"✅ Retrieved text (score: {match['score']:.4f}): {match['metadata']['text'][:100]}...")
        
        if not contexts:
            print("❌ No text content found in matches!")
            return None
        
        # 4. Combine context
        combined_context = "\n\n".join(contexts)
        print(f"✅ Combined context length: {len(combined_context)} characters")
        
        return {
            'contexts': contexts,
            'combined_context': combined_context,
            'sources': [match['metadata'].get('filename', 'unknown') for match in results['matches']]
        }
        
    except Exception as e:
        print(f"❌ Error testing RAG chain: {e}")
        return None