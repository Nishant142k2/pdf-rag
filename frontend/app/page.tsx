'use client'
import FileUploadComponent from "./components/file-upload";
import ChatComponent from "./components/chat";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white">
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen border border-gray-700">
        <div className="w-[30vw] min-h-screen p-4 flex justify-center items-center bg-gray-800 border-r border-gray-700">
          <FileUploadComponent />
        </div>
        <div className="w-[70vw] min-h-screen bg-gray-900">
          <ChatComponent />
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:flex lg:hidden min-h-screen border border-gray-700">
        <div className="w-[35vw] min-h-screen p-3 flex justify-center items-center bg-gray-800 border-r border-gray-700">
          <FileUploadComponent />
        </div>
        <div className="w-[65vw] min-h-screen bg-gray-900">
          <ChatComponent />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col min-h-screen">
        {/* File Upload Section - Mobile */}
        <div className="w-full p-4 bg-gray-800 border-b border-gray-700 flex justify-center items-center min-h-[200px]">
          <FileUploadComponent />
        </div>
        
        {/* Chat Section - Mobile */}
        <div className="flex-1 w-full bg-gray-900">
          <ChatComponent />
        </div>
      </div>
    </div>
  );
}