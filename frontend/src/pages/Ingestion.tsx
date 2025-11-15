/**
 * Ingestion page - Unified interface for managing conversation log ingestion.
 *
 * Combines bulk upload, watch directory configuration, live activity monitoring,
 * and ingestion history into a single tabbed interface.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  FolderSearch,
  Activity,
  History,
  Upload as UploadIcon,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Play,
  Square,
  Trash2,
  Plus,
  FolderOpen,
} from 'lucide-react';
import {
  uploadSingleConversationLog,
  getWatchConfigs,
  createWatchConfig,
  deleteWatchConfig,
  startWatching,
  stopWatching,
} from '@/lib/api';
import type { UploadResult, WatchConfigurationResponse } from '@/types/api';

type Tab = 'upload' | 'watch' | 'activity' | 'history';

interface FileUploadState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: UploadResult;
  error?: string;
}

export default function Ingestion() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');

  const tabs = [
    { id: 'upload' as Tab, label: 'Bulk Upload', icon: Upload },
    { id: 'watch' as Tab, label: 'Watch Directories', icon: FolderSearch },
    { id: 'activity' as Tab, label: 'Live Activity', icon: Activity },
    { id: 'history' as Tab, label: 'History & Logs', icon: History },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Ingestion Management</h1>
        <p className="text-muted-foreground">
          Upload conversation logs, configure watch directories, and monitor ingestion activity
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }
                  `}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'upload' && <BulkUploadTab />}
        {activeTab === 'watch' && <WatchDirectoriesTab />}
        {activeTab === 'activity' && <LiveActivityTab />}
        {activeTab === 'history' && <HistoryLogsTab />}
      </div>
    </div>
  );
}

// Tab components

function BulkUploadTab() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUploading = currentFileIndex !== null;
  const isComplete =
    fileStates.length > 0 &&
    fileStates.every((f) => f.status === 'success' || f.status === 'error');

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
      setError(
        `Only .jsonl files are supported. ${files.length - jsonlFiles.length} file(s) ignored.`
      );
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
        prev.map((fs, idx) => (idx === i ? { ...fs, status: 'uploading' } : fs))
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

  const successCount = fileStates.filter((f) => f.status === 'success').length;
  const failedCount = fileStates.filter((f) => f.status === 'error').length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Bulk Upload</h2>
        <p className="text-muted-foreground">
          Upload Claude Code conversation logs (.jsonl files) to analyze and explore your
          coding sessions.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      {fileStates.length === 0 && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-border/80'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDrag}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Drag and drop .jsonl files here</p>
          <p className="text-sm text-muted-foreground mb-4">or</p>
          <label className="inline-block">
            <span className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer transition-colors">
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
          <p className="text-xs text-muted-foreground mt-4">
            Supports multiple .jsonl files
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Files List with Progress */}
      {fileStates.length > 0 && (
        <div className="mt-6">
          {/* Progress Header */}
          {isUploading && currentFileIndex !== null && (
            <div className="mb-4 p-4 bg-primary/10 border border-primary rounded-md">
              <p className="text-sm font-medium">
                Processing file {currentFileIndex + 1} of {fileStates.length}:{' '}
                {fileStates[currentFileIndex].file.name}
              </p>
            </div>
          )}

          {/* Completion Summary */}
          {isComplete && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Upload Complete</h3>
              <p className="text-sm">
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
                      ? 'bg-green-500/10 border-green-500'
                      : fileState.status === 'error'
                      ? 'bg-destructive/10 border-destructive'
                      : fileState.status === 'uploading'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border'
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
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    {fileState.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 text-primary mt-0.5 animate-spin" />
                    )}
                    {fileState.status === 'pending' && (
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    )}

                    {/* File Info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{fileState.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fileState.file.size / 1024).toFixed(2)} KB
                      </p>

                      {/* Success Details */}
                      {fileState.status === 'success' && fileState.result && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {fileState.result.message_count} messages,{' '}
                          {fileState.result.epoch_count} epoch(s)
                          {fileState.result.files_count > 0 &&
                            `, ${fileState.result.files_count} files touched`}
                        </div>
                      )}

                      {/* Error Details */}
                      {fileState.status === 'error' && (
                        <p className="mt-1 text-xs text-destructive">{fileState.error}</p>
                      )}

                      {/* Uploading Status */}
                      {fileState.status === 'uploading' && (
                        <p className="mt-1 text-xs text-primary">
                          Uploading and processing...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {fileState.status === 'pending' && !isUploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-destructive hover:text-destructive/80 text-sm"
                    >
                      Remove
                    </button>
                  )}
                  {fileState.status === 'success' && fileState.result?.conversation_id && (
                    <button
                      onClick={() =>
                        navigate(`/conversations/${fileState.result!.conversation_id}`)
                      }
                      className="ml-4 text-sm text-primary hover:text-primary/80 whitespace-nowrap"
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
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Upload {fileStates.length}{' '}
                  {fileStates.length === 1 ? 'File' : 'Files'}
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  Clear
                </button>
              </>
            )}
            {isComplete && (
              <>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Upload More Files
                </button>
                <button
                  onClick={() => navigate('/conversations')}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
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

function WatchDirectoriesTab() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDirectory, setNewDirectory] = useState('');
  const [enableTagging, setEnableTagging] = useState(false);

  // Fetch watch configs
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['watchConfigs'],
    queryFn: () => getWatchConfigs(),
  });

  // Create watch config mutation
  const createMutation = useMutation({
    mutationFn: createWatchConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchConfigs'] });
      setShowAddForm(false);
      setNewDirectory('');
      setEnableTagging(false);
    },
  });

  // Start watching mutation
  const startMutation = useMutation({
    mutationFn: startWatching,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchConfigs'] });
    },
  });

  // Stop watching mutation
  const stopMutation = useMutation({
    mutationFn: stopWatching,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchConfigs'] });
    },
  });

  // Delete watch config mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWatchConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchConfigs'] });
    },
  });

  const handleCreateConfig = () => {
    if (!newDirectory.trim()) return;

    createMutation.mutate({
      directory: newDirectory.trim(),
      enable_tagging: enableTagging,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading watch configurations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
        <p className="text-destructive">
          Error loading watch configurations: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Watch Directories</h2>
          <p className="text-muted-foreground">
            Configure directories for automatic conversation log monitoring and ingestion.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Directory
        </button>
      </div>

      {/* Add New Config Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Add Watch Directory</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Directory Path <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newDirectory}
                onChange={(e) => setNewDirectory(e.target.value)}
                placeholder="/path/to/watch/directory"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableTagging"
                checked={enableTagging}
                onChange={(e) => setEnableTagging(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="enableTagging" className="text-sm">
                Enable AI tagging (uses OpenAI API)
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateConfig}
                disabled={createMutation.isPending || !newDirectory.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewDirectory('');
                  setEnableTagging(false);
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                Error: {createMutation.error.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Watch Configs List */}
      {configs && configs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Watch Directories</h3>
          <p className="text-muted-foreground mb-4">
            Add a directory to start automatic log ingestion
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Add Your First Directory
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {configs?.map((config) => (
            <WatchConfigCard
              key={config.id}
              config={config}
              onStart={() => startMutation.mutate(config.id)}
              onStop={() => stopMutation.mutate(config.id)}
              onDelete={() => {
                if (
                  confirm(
                    `Delete watch configuration for ${config.directory}?`
                  )
                ) {
                  deleteMutation.mutate(config.id);
                }
              }}
              isStarting={startMutation.isPending}
              isStopping={stopMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Watch Config Card Component
interface WatchConfigCardProps {
  config: WatchConfigurationResponse;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  isStarting: boolean;
  isStopping: boolean;
  isDeleting: boolean;
}

function WatchConfigCard({
  config,
  onStart,
  onStop,
  onDelete,
  isStarting,
  isStopping,
  isDeleting,
}: WatchConfigCardProps) {
  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FolderSearch className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{config.directory}</h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                config.is_active
                  ? 'bg-green-500/10 text-green-600 border border-green-500'
                  : 'bg-gray-500/10 text-gray-600 border border-gray-500'
              }`}
            >
              {config.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="ml-8 space-y-1 text-sm text-muted-foreground">
            {config.enable_tagging && (
              <p>✓ AI tagging enabled</p>
            )}
            {config.last_started_at && (
              <p>
                Last started:{' '}
                {new Date(config.last_started_at).toLocaleString()}
              </p>
            )}
            <p>ID: {config.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config.is_active ? (
            <button
              onClick={onStop}
              disabled={isStopping}
              className="px-3 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={isStarting}
              className="px-3 py-2 bg-green-500/10 text-green-600 rounded-md hover:bg-green-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Start
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={config.is_active || isDeleting}
            className="px-3 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors disabled:opacity-50"
            title={config.is_active ? 'Stop watching before deleting' : 'Delete configuration'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveActivityTab() {
  return (
    <div className="bg-card border border-border rounded-lg p-8">
      <h2 className="text-2xl font-semibold mb-4">Live Activity</h2>
      <p className="text-muted-foreground">
        Monitor active watch directories and recent ingestion jobs in real-time.
      </p>
      <div className="mt-8 text-center text-muted-foreground">
        Coming soon - real-time job stream with auto-refresh
      </div>
    </div>
  );
}

function HistoryLogsTab() {
  return (
    <div className="bg-card border border-border rounded-lg p-8">
      <h2 className="text-2xl font-semibold mb-4">History & Logs</h2>
      <p className="text-muted-foreground">
        View detailed history of all ingestion jobs with filtering and statistics.
      </p>
      <div className="mt-8 text-center text-muted-foreground">
        Coming soon - job history table with pagination and filters
      </div>
    </div>
  );
}
