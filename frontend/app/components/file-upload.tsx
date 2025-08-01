'use client';
import * as React from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

const FileUploadComponent: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = React.useState<Array<{
    name: string;
    status: 'uploading' | 'success' | 'error';
    uploadTime: string;
  }>>([]);

  const handleFileUploadButtonClick = () => {
    const el = document.createElement('input');
    el.setAttribute('type', 'file');
    el.setAttribute('accept', 'application/pdf');
    el.setAttribute('multiple', 'true'); // Allow multiple files if needed
  
    el.addEventListener('change', async () => {
      if (el.files && el.files.length > 0) {
        // Process each file
        for (const file of el.files) {
          const newFile = {
            name: file.name,
            status: 'uploading' as const,
            uploadTime: new Date().toLocaleTimeString(),
          };
          
          // Add file to list immediately
          setUploadedFiles(prev => [...prev, newFile]);

          // Create FormData for this specific file
          const formData = new FormData();
          formData.append('files', file);  // key must match FastAPI param

          try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
            console.log("Uploading file:", file.name);
            
            const response = await fetch(`${API_BASE_URL}/upload/`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('File uploaded successfully:', data);

            // Update status to success
            setUploadedFiles(prev =>
              prev.map(f =>
                f.name === file.name && f.status === 'uploading' && f.uploadTime === newFile.uploadTime
                  ? { ...f, status: 'success' as const }
                  : f
              )
            );
          } catch (error) {
            console.error('Upload error for file', file.name, ':', error);

            // Update status to error
            setUploadedFiles(prev =>
              prev.map(f =>
                f.name === file.name && f.status === 'uploading' && f.uploadTime === newFile.uploadTime
                  ? { ...f, status: 'error' as const }
                  : f
              )
            );
          }
        }
      }
    });
  
    el.click();
  };

  const removeFile = (fileName: string, uploadTime: string) => {
    setUploadedFiles(prev => 
      prev.filter(f => !(f.name === fileName && f.uploadTime === uploadTime))
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Uploaded successfully';
      case 'error':
        return 'Upload failed';
      default:
        return '';
    }
  };

  const retryUpload = (fileName: string, uploadTime: string) => {
    // Find the failed file and retry upload
    const failedFile = uploadedFiles.find(f => f.name === fileName && f.uploadTime === uploadTime);
    if (failedFile) {
      // You could implement retry logic here
      console.log('Retry upload for:', fileName);
      // For now, just remove the failed entry - user can re-upload
      removeFile(fileName, uploadTime);
    }
  };

  return (
    <div className="bg-slate-900 text-white shadow-2xl p-6 rounded-lg border-white border-2">
      {/* Upload Button */}
      <div 
        onClick={handleFileUploadButtonClick}
        className="flex justify-center items-center flex-col cursor-pointer hover:bg-slate-800 p-4 rounded-lg transition-colors"
      >
        <h3 className="mb-2 text-lg font-semibold">Upload PDF File</h3>
        <Upload className="h-8 w-8" />
        <p className="text-xs text-slate-400 mt-2">Click to select PDF files</p>
      </div>
      
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 border-t border-slate-700 pt-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${file.uploadTime}`} 
                className="flex items-center justify-between bg-slate-800 p-3 rounded-md"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      <p className="text-xs text-slate-400">
                        {getStatusText(file.status)} • {file.uploadTime}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {file.status === 'error' && (
                    <button
                      onClick={() => retryUpload(file.name, file.uploadTime)}
                      className="text-slate-400 hover:text-blue-400 transition-colors p-1 text-xs"
                      title="Retry upload"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.name, file.uploadTime)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    title="Remove from list"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload Statistics */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <span>
            Success: {uploadedFiles.filter(f => f.status === 'success').length}
          </span>
          <span>
            Failed: {uploadedFiles.filter(f => f.status === 'error').length}
          </span>
          <span>
            Uploading: {uploadedFiles.filter(f => f.status === 'uploading').length}
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;