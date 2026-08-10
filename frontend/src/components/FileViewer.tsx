import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { Code, Eye, Download, FileText } from 'lucide-react';

interface FileViewerProps {
  file: {
    name: string;
    content: string;
  };
}

export default function FileViewer({ file }: FileViewerProps) {
  const [mode, setMode] = useState<'preview' | 'code'>('preview');

  const extension = file.name.split('.').pop()?.toLowerCase();
  
  const isPreviewable = extension === 'md' || extension === 'html' || extension === 'htm';

  const handleDownload = () => {
    let mimeType = 'text/plain';
    switch (extension) {
      case 'html':
      case 'htm': mimeType = 'text/html'; break;
      case 'css': mimeType = 'text/css'; break;
      case 'js': mimeType = 'application/javascript'; break;
      case 'json': mimeType = 'application/json'; break;
      case 'csv': mimeType = 'text/csv'; break;
      case 'md': mimeType = 'text/markdown'; break;
      case 'py': mimeType = 'text/x-python'; break;
      default: mimeType = 'application/octet-stream';
    }

    const blob = new Blob([file.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name || 'download';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 flex flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-lg">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-zinc-300">
          <FileText className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-semibold truncate max-w-[200px]">{file.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {isPreviewable && (
            <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              <button
                onClick={() => setMode('preview')}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
                  mode === 'preview' ? "bg-zinc-800 text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button
                onClick={() => setMode('code')}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
                  mode === 'code' ? "bg-zinc-800 text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Code className="h-3.5 w-3.5" /> Code
              </button>
            </div>
          )}
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-600/30 transition-all border border-indigo-500/20"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full overflow-hidden bg-zinc-950">
        {(!isPreviewable || mode === 'code') && (
          <div className="max-h-[500px] overflow-y-auto p-4 custom-scrollbar">
            <pre className="text-[13px] font-mono leading-relaxed text-zinc-300 break-words whitespace-pre-wrap">
              {file.content}
            </pre>
          </div>
        )}
        
        {isPreviewable && mode === 'preview' && (
          <div className="max-h-[500px] overflow-y-auto bg-white custom-scrollbar w-full relative">
            {extension === 'md' ? (
              <div className="p-6 prose prose-sm max-w-none text-zinc-900 prose-headings:text-zinc-900 prose-a:text-indigo-600">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {file.content}
                </ReactMarkdown>
              </div>
            ) : (
              <iframe
                srcDoc={file.content}
                sandbox="allow-scripts"
                className="w-full min-h-[400px] border-0 block"
                title={`Preview of ${file.name}`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
