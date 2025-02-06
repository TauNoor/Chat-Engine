import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './chatbot.css';


function App() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false); // State for loading animation
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]); // State for chat history
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestiveQuestions, setSuggestiveQuestions] = useState([]); 

  useEffect(() => {
    fetchUploadedFiles();
  }, []);



  const fetchUploadedFiles = async () => {
    try {
      const res = await axios.get('http://localhost:8000/list_uploaded_files');
      setUploadedFiles(res.data.files);
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (files.length===0) {
      alert('Please select a file first.');
      return;
    }

    //const formData = new FormData();
    //formData.append('file', file);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    console.log(formData.entries());

    try {
      const res = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(res.data.message);
      //setUploadedFiles((prev) => [...prev, ...Array.from(files).map((file) => file.name)]);
      //setUploadedFiles(Array.from(files).map((file) => file.name));
      fetchUploadedFiles();
      fetchSuggestiveQuestions();
      //console.log(suggestiveQuestions)
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload the files.');
    }
  };

  const fetchSuggestiveQuestions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/suggestive_questions");
      console.log(res)
      setSuggestiveQuestions(res.data);
    } catch (error) {
      console.error("Error fetching suggestive questions:", error);
    }
  };

  const handleQuery = async () => {
    setLoading(true); // Start loading animation
    setResponse(''); // Clear the previous response
    try {
      const res = await axios.post(
        'http://localhost:8000/query',
        new URLSearchParams({ query }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      //setResponse(res.data.response);
      const newResponse = res.data.response;
      setResponse(newResponse);
      setChatHistory((prev) => [...prev, { query, response: newResponse }]);
    } catch (error) {
      console.error('Error querying index:', error);
      alert('Failed to query the index.');
    } finally {
      setLoading(false); // Stop loading animation
    }
  };

  const handleDelete = async (fileName) => {
    console.log(typeof fileName);
    console.log(fileName)
    //const encodedFileName = encodeURIComponent(fileName);
    try {
      const res = await axios.delete('http://localhost:8000/delete', {
        params: { doc_name: fileName },
        //data: {fileName},
        /*headers: {
          'Content-Type': 'application/json',
        },*/
      });
      alert(res.data.message);

      // Remove the deleted file from the list
      //setUploadedFiles((prev) => prev.filter((file) => file !== fileName));
      fetchUploadedFiles();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete the document.');
    }
  };

  /*<input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload Document</button> */

  return (
    <div className="chat-container">
      <div className="chat-header">RAG-Based Chat Engine</div>

      <div className="upload-container">
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload Documents</button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="upload-container">
          <h3>Uploaded Files:</h3>
          <button onClick={() => setShowDropdown(!showDropdown)}>
            Uploaded Documents
          </button>
          {showDropdown && (
            <ul style={{ listStyleType: 'none', padding: '5px', border: '2px solid #ccc', borderRadius: '5px', marginTop: '5px' }}>
              {uploadedFiles.map((file, index) => (
                <li key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{file}</span>
                  <button onClick={() => handleDelete(file)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}


      <div className="chat-body">
      {loading && (
          <div className="message bot typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        {chatHistory.map((entry, index) => (
              <div key={index}>
                <div className='human'>{entry.query}</div>
                <br />
                <div className='message bot'>{entry.response}</div>
              </div>
            ))}
      </div>

      <div className="chat-footer">
        <textarea
          rows="3"
          placeholder="Enter your query here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        ></textarea>
        <button onClick={handleQuery}>Send Query</button>
      </div>


      {/* Suggestive Questions Sidebar */}
      <div style={{ width: "70%", paddingLeft: "20px", borderLeft: "1px solid #ccc" }}>
        <h3>Suggestive Questions</h3>
        {uploadedFiles.length > 0 && suggestiveQuestions.length > 0 ? (
          <ul>
          {suggestiveQuestions.map((question, index) => (
            <li key={index} style={{ marginBottom: "10px" }}>
              <button
                style={{
                  backgroundColor: "#f0f0f0",
                  border: "none",
                  padding: "10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
                onClick={() => setQuery(question)}
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No suggestive questions available.</p>
      )}
      </div>
    </div>

    
  );
}

export default App;
