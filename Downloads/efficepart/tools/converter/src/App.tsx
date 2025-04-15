import React, { useState, useCallback } from 'react';
import { Upload, FileType, Settings, Image, FileText, AlertCircle } from 'lucide-react';

type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<FileStatus>('idle');
  const [outputFormat, setOutputFormat] = useState('jpg');
  const [quality, setQuality] = useState(90);
  const [colorMode, setColorMode] = useState('rgb');
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setError(null);
    setStatus('idle');
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setError(null);
      setStatus('idle');
    }
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]); // Currently handling single file
    formData.append('outputFormat', outputFormat);
    formData.append('quality', quality.toString());
    formData.append('colorMode', colorMode);

    try {
      const response = await fetch('http://localhost:5000/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted.${outputFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">File Converter</h1>
          <p className="text-lg text-gray-600">Convert between PDF, JPG, PNG, and TIFF formats</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* File Upload Area */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Drop files here</h2>
              <p className="text-gray-500 mb-4">or</p>
              <label className="inline-block">
                <input
                  type="file"
                  className="hidden"
                  onChange={onFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                />
                <span className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                  Browse Files
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Selected Files:</h3>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <FileType className="h-4 w-4 mr-2" />
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Conversion Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Output Format
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="pdf">PDF</option>
                    <option value="tiff">TIFF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 text-right">{quality}%</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Mode
                  </label>
                  <select
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="rgb">RGB Color</option>
                    <option value="grayscale">Grayscale</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={files.length === 0 || status === 'uploading'}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center ${
                files.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {status === 'uploading' ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Converting...
                </>
              ) : (
                'Convert Files'
              )}
            </button>

            {status === 'success' && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
                <Image className="h-5 w-5 mr-2" />
                Conversion completed successfully!
              </div>
            )}

            {status === 'error' && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error || 'An error occurred during conversion.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;