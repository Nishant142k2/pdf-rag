'use client';
import * as React from 'react';
import { Upload } from 'lucide-react';

const FileUploadComponent: React.FC = () => {
  const handleFileUploadButtonClick = () => {
    const el = document.createElement('input');
    el.setAttribute('type', 'file');
    el.setAttribute('accept', 'application/pdf');
  
    el.addEventListener('change', async () => {
      if (el.files && el.files.length > 0) {
        const file = el.files[0];
        const formData = new FormData();
        formData.append('file', file); // ✅ Match backend param name
  
        try {
          const API_BASE_URL= process.env.API_BASE_URL || 'http://localhost:8000';
          const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
          });
  
          const data = await response.json();
          console.log('File uploaded:', data);
        } catch (error) {
          console.error('Upload error:', error);
        }
      }
    });
  
    el.click();
  };
  
  return (
    <div className="bg-slate-900 text-white shadow-2xl flex justify-center items-center p-4 rounded-lg border-white border-2">
      <div
        onClick={handleFileUploadButtonClick}
        className="flex justify-center items-center flex-col"
      >
        <h3>Upload PDF File</h3>
        <Upload />
      </div>
    </div>
  );
};

export default FileUploadComponent;