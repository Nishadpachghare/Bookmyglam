import { useState } from "react";

export default function Uploadimg() {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFiles(Array.from(e.dataTransfer.files));
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="p-6 space-y-8 w-355 pl-80 ">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <div>
          <h1 className="text-2xl font-semibold">Upload Gallery</h1>
          <p className="text-sm text-gray-500">
            Upload before and after photos of your clients to showcase your work.
          </p>
        </div>
      
      </div>

      {/* Upload Box */}
      <div
        className="border-2 border-dashed border-gray-400 rounded-lg p-10 text-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p className="font-medium">Drag and drop photos here</p>
        <p className="text-gray-400 text-sm mb-4">Or click to browse your files</p>
        <label className="inline-block">
          <input type="file" multiple className="hidden" onChange={handleFileChange} />
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white rounded px-4 py-2">
            Select Photos
          </button>
        </label>
      </div>

      {/* Photo Details */}
      <div className="space-y-4">
        <h2 className="font-semibold">Photo Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select className="border rounded-lg p-3 bg-amber-50">
            <option>Select Category</option>
            <option>Hair</option>
            <option>Makeup</option>
            <option>Nails</option>
          </select>

          <select className="border rounded-lg p-3 bg-amber-50">
            <option>Select Service</option>
            <option>Haircut</option>
            <option>Hair Color</option>
            <option>Styling</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg px-6 py-2 font-semibold">
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}