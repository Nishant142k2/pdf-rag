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
  
    el.addEventListener('change', async () => {
      if (el.files && el.files.length > 0) {
        const file = el.files[0];
        const formData = new FormData();
        for (const file of el.files) {
          formData.append('files', file);  // 👈 use 'files' as key for list
        }
        
        const newFile = {
          name: file.name,
          status: 'uploading' as const,
          uploadTime: new Date().toLocaleTimeString(),
        };
        setUploadedFiles(prev => [...prev, newFile]);
  
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL  || 'http://localhost:8000';
          console.log("Uploading files ")
          const response = await fetch(`${API_BASE_URL}/upload/`, {
            method: 'POST',
            body: formData,
          });
  
          const data = await response.json();
          console.log('File uploaded:', data);
  
          setUploadedFiles(prev =>
            prev.map(f =>
              f.name === file.name && f.status === 'uploading'
                ? { ...f, status: 'success' as const }
                : f
            )
          );
        } catch (error) {
          console.error('Upload error:', error);
  
          setUploadedFiles(prev =>
            prev.map(f =>
              f.name === file.name && f.status === 'uploading'
                ? { ...f, status: 'error' as const }
                : f
            )
          );
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

  return (
    <div className="bg-slate-900 text-white shadow-2xl p-6 rounded-lg border-white border-2">
      {/* Upload Button */}
      <div 
        onClick={handleFileUploadButtonClick}
        className="flex justify-center items-center flex-col cursor-pointer hover:bg-slate-800 p-4 rounded-lg transition-colors"
      >
        <h3 className="mb-2 text-lg font-semibold">Upload PDF File</h3>
        <Upload className="h-8 w-8" />
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
                <button
                  onClick={() => removeFile(file.name, file.uploadTime)}
                  className="text-slate-400 hover:text-red-400 transition-colors p-1"
                  title="Remove from list"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;