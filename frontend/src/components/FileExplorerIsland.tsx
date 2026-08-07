import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FileCode, Folder, ChevronRight, ChevronDown, Download, ExternalLink } from 'lucide-react';

const apiBase = import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_BASE || 'http://localhost:8000';

interface FileNode {
  path: string;
  size: number;
  type: string;
}

interface FileExplorerProps {
  skillId: string;
  manifest: FileNode[];
  archiveUrl: string;
}

export default function FileExplorerIsland({ skillId, manifest, archiveUrl }: FileExplorerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileClick = async (path: string) => {
    setSelectedFile(path);
    setLoading(true);
    setError(null);
    setFileContent('');

    try {
      const res = await fetch(`${apiBase}/api/skills/${skillId}/file/${encodeURIComponent(path)}`);
      if (!res.ok) {
        throw new Error('Failed to load file');
      }
      const text = await res.text();
      setFileContent(text);
    } catch (err: any) {
      setError(err.message || 'Error loading file');
    } finally {
      setLoading(false);
    }
  };

  // Build a simple flat list for now (or a basic tree if we had more time)
  // For a sleek UI, a scrollable list of files with icons works well.
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="col-span-1 border-white/10 bg-zinc-900/40 backdrop-blur-md">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-lg text-zinc-100 flex items-center justify-between">
            Files
            {archiveUrl && (
              <a href={archiveUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center">
                <Download size={14} className="mr-1" /> Download .zip
              </a>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto p-2">
            {manifest.map((file, idx) => (
              <div 
                key={idx} 
                onClick={() => handleFileClick(file.path)}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${
                  selectedFile === file.path 
                    ? 'bg-indigo-500/20 text-indigo-400' 
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <FileCode size={16} className={selectedFile === file.path ? 'text-indigo-400' : 'text-zinc-500'} />
                <span className="truncate" title={file.path}>{file.path}</span>
              </div>
            ))}
            {manifest.length === 0 && (
              <div className="p-4 text-zinc-500 text-sm text-center">No files found.</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1 md:col-span-2 border-white/10 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4 bg-zinc-950/50">
          <CardTitle className="text-sm font-mono text-zinc-300 truncate">
            {selectedFile || 'Select a file to view'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] overflow-y-auto bg-[#0d1117] p-4 text-sm font-mono text-zinc-300">
            {loading && <div className="animate-pulse text-zinc-500">Loading file contents...</div>}
            {error && <div className="text-red-400">{error}</div>}
            {!loading && !error && fileContent && (
              <pre className="whitespace-pre-wrap break-words">{fileContent}</pre>
            )}
            {!loading && !error && !fileContent && !selectedFile && (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                <FileCode size={48} className="mb-4 opacity-50" />
                <p>Select a file from the explorer to view its contents.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
