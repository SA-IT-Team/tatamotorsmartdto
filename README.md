# Manufactor Smart DTO Analyzer

AI-powered DTO extraction and analysis tool for engineering documents. Upload documents to extract DTOs, analyze with Azure OpenAI, and store results in CosmosDB.

## Features

- **File Upload**: Upload PDF, DOC, DOCX files to Azure Blob Storage
- **DTO Extraction**: Automatic extraction of technical parameters from documents
- **AI Analysis**: Azure OpenAI-powered insights and descriptions
- **CosmosDB Integration**: Persistent storage of all extracted DTOs
- **Interactive Chat**: AI-powered chat interface for DTO analysis

## Environment Variables

The following environment variables are required:

### Azure Blob Storage
- `VITE_AZURE_BLOB_STORAGE_ACCOUNT` - Azure storage account name
- `VITE_AZURE_BLOB_CONTAINER` - Container name for file uploads
- `VITE_AZURE_BLOB_SAS_TOKEN` - SAS token for blob access

### Azure OpenAI
- `VITE_AZURE_OPENAI_BASE` - Azure OpenAI endpoint URL
- `VITE_AZURE_OPENAI_KEY` - Azure OpenAI API key
- `VITE_AZURE_OPENAI_DEPLOYMENT_NAME` - Deployment name
- `VITE_AZURE_OPENAI_VERSION` - API version (e.g., "2024-02-15-preview")

### CosmosDB
- `VITE_COSMOS_API_ENDPOINT` - API endpoint URL for CosmosDB data retrieval

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with all required environment variables

3. Run the development server:
```bash
npm run dev
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository

3. Configure Environment Variables:
   - In Vercel project settings, go to "Environment Variables"
   - Add all the required `VITE_*` environment variables listed above

4. Deploy:
   - Vercel will automatically detect the Vite framework
   - The `vercel.json` configuration will handle routing for the React app
   - Build command: `npm run build`
   - Output directory: `dist`

5. Your app will be live at `https://your-project.vercel.app`

## Build

```bash
npm run build
```

The build output will be in the `dist` directory.
