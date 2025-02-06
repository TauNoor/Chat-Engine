from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.core import PromptTemplate
from llama_index.core.query_engine.router_query_engine import RouterQueryEngine
from llama_index.core.selectors import LLMSingleSelector
from llama_index.vector_stores.faiss import FaissVectorStore
from llama_index.core.query_engine import SubQuestionQueryEngine
from llama_index.core.indices.postprocessor import SimilarityPostprocessor
from llama_index.core.retrievers import VectorIndexRetriever 
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.prompts.base import ChatPromptTemplate
from llama_index.core import PromptTemplate
from llama_index.core.response_synthesizers import get_response_synthesizer

import faiss
import os

#generate the query engine to query the index
def create_engine(index):


    retriever = VectorIndexRetriever(index=index, similarity_top_k=4) #modify the index to use 2 source nodes 


    '''vector_query_engine = index.as_query_engine(
        retriver_kwargs = {"similarity_top_k": 2},
        system_prompt = ("You are a chatbot that answers questions that are strictly based on the documents\
                         in the vector index store. If you are unsure how to respond to a question, simply say 'I don't know.'\
                         If a file has been claimed to be deleted, any questions pertaining to the file must be answered with 'I don't know.'")
    )'''

    postprocessor = SimilarityPostprocessor(similarity_cutoff=0.84)

    system_prompt = PromptTemplate(
    "You are a helpful assistant. Use the context below to answer the query concisely and accurately. Otherwise, simply say 'I don't know'.\n\n{context_str}\n\nQuestion: {query_str}\nAnswer:"
    )

    response_synthesizer = get_response_synthesizer(simple_template=system_prompt)

    query_engine = RetrieverQueryEngine(retriever=retriever,
                                        node_postprocessors=[postprocessor],
                                        response_synthesizer=response_synthesizer
                                        )

    return query_engine

#creates nodes out of uploaded documents but only for initialization
def create_nodes(doc_names):
    print(doc_names)
    documents = []
    documents_v2 = []
    dict_name = {}

    counter = 0
    for i in doc_names:
        documents.append(SimpleDirectoryReader(input_files=[f"./data/{i}"]).load_data())
        document = documents[counter][0]
        
        counter+=1
        doc_name = document.metadata['file_name']
        doc_id = document.id_
        
        dict_name[doc_name] = doc_id
    
    for j in documents: 
        documents_v2.append(j[0])

    splitter = SentenceSplitter(chunk_size=2048,chunk_overlap=200) #splitting the data
    nodes = splitter.get_nodes_from_documents(documents_v2)

    return nodes, dict_name

#create a vector store if doesnt already exist 
def create_collection(nodes):
    #d = 1536
    #faiss_index = faiss.IndexFlatL2(d)
    #vector_store = FaissVectorStore(faiss_index=faiss_index)
    #storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex(nodes)

    index.storage_context.persist("./storage")

    return index

#load a vector store if it exists 
def load_collection():
    #vector_store = FaissVectorStore.from_persist_dir(persist_dir="./storage")
    
    storage_context = StorageContext.from_defaults(
         persist_dir="./storage"
    )

    index = load_index_from_storage(storage_context=storage_context)

    return index

#insert new documents after initialization has already ocurred
def insert_documents(dict_name,doc_name):

    nodes, dict_name_v2 = create_nodes(doc_name)

    dict_name = {**dict_name, **dict_name_v2}

    index = load_collection()

    index.insert_nodes(nodes)

    index.storage_context.persist('./storage')

    return dict_name #updated dictionary of docs and their ids

#delete existing documents
def delete_documents(dict_name,doc_name):
    doc_id = dict_name[doc_name]

    index = load_collection()

    index.delete_ref_doc(doc_id, delete_from_docstore=True)
    
    index.storage_context.persist('./storage')

    #index = load_collection()

    del dict_name[doc_name]

    return 

if __name__ == "__main__":
    global index
    #nodes, dict_name = create_nodes(['alice_in_wonderland.md','ungrateful_tree.md'])

    PERSIST_DIR = "./storage"

    #if not os.path.exists(PERSIST_DIR):
    nodes, dict_name = create_nodes(['alice_in_wonderland.md','ungrateful_tree.md'])
    index = create_collection(nodes)

    '''else: 
        index = load_collection()'''

    #Initialize the query engine
    query_engine = create_engine(index)

    print("Query engine has been initialized!")

    while True: 
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Goodbye!")
            #print("History:")
            '''chat_hist = query_engine.chat_history
            for message in chat_hist:
                print(f"{message.role}: {message.content}")'''
            break
        if user_input.lower() == "delete":
            file_name = input("File: ")
            for uploaded_file in dict_name.keys():
                if str(file_name) == uploaded_file:
                    delete_documents(dict_name,file_name)
                    index = load_collection()
                    query_engine = create_engine(index)
                    user_input = f"Claim that the file {file_name} has been deleted."
                    break
        response = query_engine.query(user_input)
        print(response)




    





    
