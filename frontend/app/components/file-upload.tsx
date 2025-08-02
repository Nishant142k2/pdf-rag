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
    <div className="bg-slate-900 text-white shadow-2xl p-3 sm:p-4 lg:p-6 rounded-lg border-white border-2 w-full max-w-full">
      {/* Upload Button */}
      <div
        onClick={handleFileUploadButtonClick}
        className="flex justify-center items-center flex-col cursor-pointer hover:bg-slate-800 p-3 sm:p-4 lg:p-6 rounded-lg transition-colors duration-200 border-2 border-dashed border-slate-600 hover:border-slate-500"
      >
        <h3 className="mb-2 text-base sm:text-lg lg:text-xl font-semibold text-center">
          Upload PDF File
        </h3>
        <Upload className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 mb-2" />
        <p className="text-xs sm:text-sm text-slate-400 text-center px-2">
          Click to select PDF files or drag and drop
        </p>
        <p className="text-xs text-slate-500 mt-1 text-center hidden sm:block">
          Supports multiple files • Max 25MB per file
        </p>
      </div>
  
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 sm:mt-6 border-t border-slate-700 pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <h4 className="text-sm sm:text-base font-medium text-slate-300 mb-2 sm:mb-0">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            
            {/* Quick Actions - Desktop only */}
            <div className="hidden sm:flex items-center space-x-2 text-xs">
              <button 
                onClick={() => {/* Clear all successful files */}}
                className="text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                Clear All
              </button>
              <button 
                onClick={() => {/* Retry all failed */}}
                className="text-slate-400 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                Retry Failed
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-32 sm:max-h-40 lg:max-h-48 overflow-y-auto pr-1">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.uploadTime}`}
                className="flex items-center justify-between bg-slate-800 p-2 sm:p-3 rounded-md hover:bg-slate-750 transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(file.status)}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                        <p className="text-xs text-slate-400">
                          {getStatusText(file.status)}
                        </p>
                        <span className="hidden sm:inline text-xs text-slate-500">•</span>
                        <p className="text-xs text-slate-500">
                          {file.uploadTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {file.status === 'error' && (
                    <button
                      onClick={() => retryUpload(file.name, file.uploadTime)}
                      className="text-slate-400 hover:text-blue-400 transition-colors p-1 text-xs rounded hover:bg-slate-700"
                      title="Retry upload"
                    >
                      <span className="hidden sm:inline">Retry</span>
                      <span className="sm:hidden">↻</span>
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.name, file.uploadTime)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-700"
                    title="Remove from list"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
  
      {/* Upload Statistics */}
      {uploadedFiles.length > 0 && (
        <div className="mt-3 sm:mt-4">
          {/* Mobile Stats - Stacked */}
          <div className="sm:hidden grid grid-cols-3 gap-2 text-xs">
            <div className="bg-green-900/30 border border-green-700/50 rounded p-2 text-center">
              <div className="text-green-400 font-medium">
                {uploadedFiles.filter(f => f.status === 'success').length}
              </div>
              <div className="text-green-300 text-xs">Success</div>
            </div>
            <div className="bg-red-900/30 border border-red-700/50 rounded p-2 text-center">
              <div className="text-red-400 font-medium">
                {uploadedFiles.filter(f => f.status === 'error').length}
              </div>
              <div className="text-red-300 text-xs">Failed</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-700/50 rounded p-2 text-center">
              <div className="text-blue-400 font-medium">
                {uploadedFiles.filter(f => f.status === 'uploading').length}
              </div>
              <div className="text-blue-300 text-xs">Uploading</div>
            </div>
          </div>
  
          {/* Desktop Stats - Horizontal */}
          <div className="hidden sm:flex justify-between items-center text-xs text-slate-400 bg-slate-800/50 rounded p-2 lg:p-3">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Success: {uploadedFiles.filter(f => f.status === 'success').length}</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Failed: {uploadedFiles.filter(f => f.status === 'error').length}</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Uploading: {uploadedFiles.filter(f => f.status === 'uploading').length}</span>
              </span>
            </div>
            
            {/* Total file size indicator */}
            <div className="text-slate-500 hidden lg:block">
              Total: {uploadedFiles.length} files
            </div>
          </div>
        </div>
      )}
  
      {/* Mobile Quick Actions */}
      {uploadedFiles.length > 0 && (
        <div className="sm:hidden mt-3 flex space-x-2">
          <button 
            onClick={() => {/* Clear all successful files */}}
            className="flex-1 text-slate-400 hover:text-white transition-colors px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs"
          >
            Clear All
          </button>
          <button 
            onClick={() => {/* Retry all failed */}}
            className="flex-1 text-slate-400 hover:text-blue-400 transition-colors px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs"
          >
            Retry Failed
          </button>
        </div>
      )}
  
      {/* Progress Bar for Active Uploads */}
      {uploadedFiles.some(f => f.status === 'uploading') && (
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Uploading files...</span>
            <span>
              {uploadedFiles.filter(f => f.status === 'success').length} / {uploadedFiles.length}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${(uploadedFiles.filter(f => f.status === 'success').length / uploadedFiles.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;