## RAG-based Chat Engine

### Features:
- When user submits a query it perform data retrieval from the uploaded document and provides relevant info
- Makes suggestive questions based on the documents passed in order to get the ball rolling for the user to ask questions
- Can delete documents, leaving no trace behind.

### Instructions to get started: 
- Create .env file in the most external folder with the following keys:
  - AZURE_API_KEY
  - AZURE_API_VERSION
  - AZURE_DEPLOYMENT
  - AZURE_ENDPOINT
  - AZURE_MODEL
- Run 'npm start' command on frontend after 'cd/frontend': in cmd prompt of the terminal
- Run 'uvicorn main:app -- reload' in a different terminal window
  
