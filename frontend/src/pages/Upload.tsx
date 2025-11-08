import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { uploadSingleConversationLog } from '@/lib/api';
import type { UploadResult } from '@/types/api';

interface FileUploadState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: UploadResult;
  error?: string;
}

export default function Upload() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUploading = currentFileIndex !== null;
  const isComplete = fileStates.length > 0 && fileStates.every(f => f.status === 'success' || f.status === 'error');

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Handle file selection from input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  // Validate and set files
  const handleFiles = (files: File[]) => {
    // Filter for .jsonl files only
    const jsonlFiles = files.filter((file) => file.name.endsWith('.jsonl'));

    if (jsonlFiles.length === 0) {
      setError('Please select .jsonl files only');
      return;
    }

    if (jsonlFiles.length !== files.length) {
      setError(`Only .jsonl files are supported. ${files.length - jsonlFiles.length} file(s) ignored.`);
    } else {
      setError(null);
    }

    // Initialize file states
    const newFileStates: FileUploadState[] = jsonlFiles.map((file) => ({
      file,
      status: 'pending',
    }));

    setFileStates(newFileStates);
  };

  // Upload files sequentially
  const handleUpload = async () => {
    if (fileStates.length === 0) return;

    setError(null);

    for (let i = 0; i < fileStates.length; i++) {
      setCurrentFileIndex(i);

      // Update status to uploading
      setFileStates((prev) =>
        prev.map((fs, idx) =>
          idx === i ? { ...fs, status: 'uploading' } : fs
        )
      );

      try {
        const response = await uploadSingleConversationLog(fileStates[i].file);

        // Response contains results array with one item
        const result = response.results[0];

        // Update with result
        setFileStates((prev) =>
          prev.map((fs, idx) =>
            idx === i
              ? {
                  ...fs,
                  status: result.status as 'success' | 'error',
                  result: result,
                  error: result.error,
                }
              : fs
          )
        );
      } catch (err) {
        // Update with error
        setFileStates((prev) =>
          prev.map((fs, idx) =>
            idx === i
              ? {
                  ...fs,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'Upload failed',
                }
              : fs
          )
        );
      }
    }

    setCurrentFileIndex(null);

    // Redirect if only one file and it succeeded
    if (fileStates.length === 1 && fileStates[0].result?.status === 'success') {
      const conversationId = fileStates[0].result.conversation_id;
      if (conversationId) {
        setTimeout(() => {
          navigate(`/conversations/${conversationId}`);
        }, 1500);
      }
    }
  };

  // Remove a file
  const removeFile = (index: number) => {
    setFileStates((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset form
  const reset = () => {
    setFileStates([]);
    setCurrentFileIndex(null);
    setError(null);
  };

  const successCount = fileStates.filter(f => f.status === 'success').length;
  const failedCount = fileStates.filter(f => f.status === 'error').length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Conversation Logs</h1>
        <p className="text-gray-600">
          Upload Claude Code conversation logs (.jsonl files) to analyze and explore your coding sessions.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      {fileStates.length === 0 && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDrag}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drag and drop .jsonl files here
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <label className="inline-block">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
              Browse Files
            </span>
            <input
              type="file"
              className="hidden"
              accept=".jsonl"
              multiple
              onChange={handleFileInput}
            />
          </label>
          <p className="text-xs text-gray-500 mt-4">
            Supports multiple .jsonl files
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Files List with Progress */}
      {fileStates.length > 0 && (
        <div className="mt-6">
          {/* Progress Header */}
          {isUploading && currentFileIndex !== null && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-900">
                Processing file {currentFileIndex + 1} of {fileStates.length}: {fileStates[currentFileIndex].file.name}
              </p>
            </div>
          )}

          {/* Completion Summary */}
          {isComplete && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Upload Complete
              </h2>
              <p className="text-sm text-green-700">
                Successfully uploaded {successCount} of {fileStates.length} file(s)
                {failedCount > 0 && ` (${failedCount} failed)`}
              </p>
            </div>
          )}

          {/* File List */}
          <div className="space-y-2">
            {fileStates.map((fileState, index) => (
              <div
                key={index}
                className={`
                  p-4 rounded-md border
                  ${
                    fileState.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : fileState.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : fileState.status === 'uploading'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Status Icon */}
                    {fileState.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    )}
                    {fileState.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    {fileState.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 text-blue-600 mt-0.5 animate-spin" />
                    )}
                    {fileState.status === 'pending' && (
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    )}

                    {/* File Info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {fileState.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(fileState.file.size / 1024).toFixed(2)} KB
                      </p>

                      {/* Success Details */}
                      {fileState.status === 'success' && fileState.result && (
                        <div className="mt-1 text-xs text-gray-600">
                          {fileState.result.message_count} messages, {fileState.result.epoch_count} epoch(s)
                          {fileState.result.files_count > 0 && `, ${fileState.result.files_count} files touched`}
                        </div>
                      )}

                      {/* Error Details */}
                      {fileState.status === 'error' && (
                        <p className="mt-1 text-xs text-red-700">{fileState.error}</p>
                      )}

                      {/* Uploading Status */}
                      {fileState.status === 'uploading' && (
                        <p className="mt-1 text-xs text-blue-700">Uploading and processing...</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {fileState.status === 'pending' && !isUploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                  {fileState.status === 'success' && fileState.result?.conversation_id && (
                    <button
                      onClick={() => navigate(`/conversations/${fileState.result!.conversation_id}`)}
                      className="ml-4 text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-3">
            {!isUploading && !isComplete && (
              <>
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upload {fileStates.length} {fileStates.length === 1 ? 'File' : 'Files'}
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Clear
                </button>
              </>
            )}
            {isComplete && (
              <>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upload More Files
                </button>
                <button
                  onClick={() => navigate('/conversations')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  View All Conversations
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
