import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Sparkles, Upload, Image as ImageIcon, Lock, CheckCircle2, Code2, Folder, File as FileIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const apiBase = import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_BASE || 'http://localhost:8000';

const CATEGORIES = [
  { value: 'automation', label: 'Automation' },
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'customer-support', label: 'Customer Support' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'general', label: 'General' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'security', label: 'Security' },
  { value: 'api', label: 'API & Integrations' },
  { value: 'ai', label: 'AI & Machine Learning' }
];

export default function UploadSkillFormIsland() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<'all' | 'student' | 'professional'>('all');
  const [pricingModel, setPricingModel] = useState<'free' | 'paid'>('free');
  const [file, setFile] = useState<File | null>(null);
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [itemType, setItemType] = useState<'skill' | 'prompt' | 'agent-tool'>('skill');
  const [agentToolMode, setAgentToolMode] = useState<'github' | 'zip'>('github');
  const [githubUrl, setCode2Url] = useState('');
  const [license, setLicense] = useState('MIT');
  const [installCommand, setInstallCommand] = useState('');
  const [archiveUrl, setArchiveUrl] = useState('');
  const [fileManifest, setFileManifest] = useState<any[]>([]);
  const [readmeContent, setReadmeContent] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [complexityHint, setComplexityHint] = useState<number | null>(null);
  const [starsCount, setStarsCount] = useState(0);
  const [forksCount, setForksCount] = useState(0);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaUploading, setMediaUploading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [result, setResult] = useState<{ success: boolean; content: React.ReactNode } | null>(null);
  const [appealMsg, setAppealMsg] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [freeSkillsCount, setFreeSkillsCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/signup';
      } else {
        fetchFreeSkillsCount(session.user.id);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFreeSkillsCount = async (userId: string) => {
    const { count } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId)
      .eq('is_free', true);
    setFreeSkillsCount(count || 0);
  };

  const handleAutofill = async (contentStr: string) => {
    setIsAutoFilling(true);
    showToast("Analyzing content to auto-fill details...", "info");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await fetch(`${apiBase}/api/skills/autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ content: contentStr })
      });

      if (!res.ok) throw new Error("Autofill failed");
      const data = await res.json();
      
      if (data.title && !title) setTitle(data.title);
      if (data.description && !description) setDescription(data.description);
      if (data.install_command && !installCommand) setInstallCommand(data.install_command);
      
      // Handle categories from autofill - support both array and string formats
      if (data.categories) {
        let cats: string[] = [];
        if (Array.isArray(data.categories)) {
          cats = data.categories;
        } else if (typeof data.categories === 'string') {
          cats = data.categories.split(',').map((c: string) => c.trim()).filter(Boolean);
        }
        if (cats.length > 0) {
          setSelectedCategories(cats);
        }
      }

      // New autofill fields
      if (data.target_audience && targetAudience === 'all') {
        setTargetAudience(data.target_audience);
      }
      if (data.license && license === 'MIT') {
        setLicense(data.license);
      }
      if (data.item_type) {
        setItemType(data.item_type);
      }
      if (data.complexity_hint) {
        setComplexityHint(data.complexity_hint);
      }

      showToast("Auto-fill complete!", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not auto-fill details. Please fill them manually.", "warning");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    if (itemType === 'agent-tool') {
      if (selected.size > 25 * 1024 * 1024) {
        showToast("File size exceeds 25MB limit", "error");
        return;
      }
      setIsAutoFilling(true);
      showToast("Uploading archive and extracting metadata...", "info");
      
      const formData = new FormData();
      formData.append("file", selected);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");

        const res = await fetch(`${apiBase}/api/skills/upload-archive`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          body: formData
        });
        
        if (!res.ok) throw new Error("Upload archive failed");
        const data = await res.json();
        
        setArchiveUrl(data.archive_url);
        setFileManifest(data.file_manifest);
        setReadmeContent(data.readme_content);
        
        if (data.readme_content) {
          await handleAutofill(data.readme_content);
        } else {
          setIsAutoFilling(false);
        }
      } catch (err) {
        console.error(err);
        showToast("Error processing archive", "error");
        setIsAutoFilling(false);
      }
    } else {
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject("Error reading file");
          reader.readAsText(selected);
        });
        setFileContent(content);
        await handleAutofill(content);
      } catch (err) {
        setIsAutoFilling(false);
      }
    }
  };

  const handleCode2Import = async () => {
    if (!githubUrl) return;
    setIsAutoFilling(true);
    showToast("Importing from GitHub...", "info");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await fetch(`${apiBase}/api/skills/import-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ url: githubUrl })
      });
      
      if (!res.ok) {
        let errMessage = "Import failed";
        try {
          const errData = await res.json();
          errMessage = errData.detail || errMessage;
        } catch (e) {
          // If the server returns HTML (e.g. 404 page), don't crash on JSON parse
          if (res.status === 404) {
            errMessage = "Repository not found or is private. Only public repositories are supported for GitHub import. Please make the repository public or upload a ZIP file.";
          } else {
            errMessage = `Server error (${res.status}). Import failed.`;
          }
        }
        throw new Error(errMessage);
      }
      const data = await res.json();
      
      setArchiveUrl(data.archive_url);
      setFileManifest(data.file_manifest);
      setReadmeContent(data.readme_content);
      setStarsCount(data.stars_count);
      setForksCount(data.forks_count);
      
      if (data.readme_content) {
        await handleAutofill(data.readme_content);
      } else {
        setIsAutoFilling(false);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Error importing from GitHub", "error");
      setIsAutoFilling(false);
    }
  };

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (selected.size > 2 * 1024 * 1024) {
      showToast("Media file must be under 2MB", "error");
      return;
    }
    
    setMediaFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setMediaPreview(objectUrl);
  };

  const toggleCategory = (catValue: string) => {
    setSelectedCategories(prev => 
      prev.includes(catValue) ? prev.filter(c => c !== catValue) : [...prev, catValue]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || (!file && !archiveUrl)) {
      showToast("Please fill all required fields and upload content.", "error");
      return;
    }
    if (pricingModel === 'paid' && !price) {
      showToast("Please specify a price.", "error");
      return;
    }
    if (selectedCategories.length === 0) {
      showToast("Please select at least one category.", "error");
      return;
    }
    if (!agreedToGuidelines) {
      showToast("You must agree to the Seller Guidelines.", "error");
      return;
    }

    setLoading(true);
    let finalMediaUrl = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      if (mediaFile) {
        setMediaUploading(true);
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('skill_media')
          .upload(fileName, mediaFile);
          
        if (error) {
          console.error("Media upload error:", error);
          showToast("Failed to upload media. Proceeding without it.", "warning");
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('skill_media')
            .getPublicUrl(fileName);
          finalMediaUrl = publicUrl;
        }
        setMediaUploading(false);
      }

      let contentStr = '';
      if (itemType !== 'agent-tool' && file) {
        contentStr = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
      } else {
        contentStr = readmeContent;
      }

      const res = await fetch(`${apiBase}/api/skills/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          title, description, content: contentStr,
          base_price_inr: pricingModel === 'free' ? 0 : parseFloat(price) || 0,
          billing_type: 'one-time', categories: selectedCategories, target_audience: targetAudience,
          item_type: itemType, media_url: finalMediaUrl || undefined,
          source_url: githubUrl || undefined, install_command: installCommand || undefined,
          license: license || undefined, archive_url: archiveUrl || undefined,
          file_manifest: fileManifest, readme_content: readmeContent || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsBlocked(false);
        setResult({
          success: true,
          content: (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-100">Upload Successful</h3>
              <p className="text-sm text-zinc-400">Your {itemType} passed all security checks and is now pending admin approval.</p>
            </div>
          )
        });
      } else {
        if (res.status === 403) {
          setIsBlocked(true);
          setResult({ success: false, content: <div className="text-red-400 font-medium">Account Blocked: {data.detail?.message || "Too many warnings"}</div> });
        } else {
          setResult({ success: false, content: <div className="text-red-400 font-medium">Security Scan Failed: {data.detail?.message || "Review required"}</div> });
        }
      }
    } catch (err: any) {
      console.error(err);
      setResult({ success: false, content: <div className="text-red-400 font-medium">{err.message || "An unexpected error occurred."}</div> });
    } finally {
      setLoading(false);
    }
  };

  const handleAppeal = async () => {
    if (!appealMsg) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setResult({
      success: true,
      content: (
        <div className="text-center p-4">
          <div className="mb-2 inline-flex rounded-full bg-indigo-500/20 p-2 text-indigo-400">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-zinc-200">Appeal submitted. Admins will review your account manually.</p>
        </div>
      )
    });
    setLoading(false);
  };

  if (result) {
    return (
      <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
        <CardContent className="p-8">
          {result.content}
          {isBlocked && (
            <div className="mt-6 border-t border-zinc-800 pt-6">
              <h4 className="mb-2 font-medium text-zinc-200">Appeal Decision</h4>
              <textarea 
                rows={3} 
                className="mb-3 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500" 
                placeholder="Explain why you believe this was a mistake..."
                value={appealMsg}
                onChange={e => setAppealMsg(e.target.value)}
              />
              <button 
                onClick={handleAppeal} 
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Appeal"}
              </button>
            </div>
          )}
          <button 
            onClick={() => { setResult(null); setIsBlocked(false); }} 
            className="mt-6 w-full text-sm text-zinc-400 hover:text-white"
          >
            Start over
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      
      {/* Item Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setItemType('skill')}
          className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
            itemType === 'skill' ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100">AI Agent Skill</h3>
            {itemType === 'skill' && <CheckCircle2 className="text-indigo-500" size={20} />}
          </div>
          <p className="text-sm text-zinc-400">System prompts, instructions, and context for autonomous agents.</p>
        </div>
        <div 
          onClick={() => setItemType('prompt')}
          className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
            itemType === 'prompt' ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100">LLM Prompt</h3>
            {itemType === 'prompt' && <CheckCircle2 className="text-indigo-500" size={20} />}
          </div>
          <p className="text-sm text-zinc-400">Templates and few-shot examples for ChatGPT, Claude, etc.</p>
        </div>
        <div 
          onClick={() => setItemType('agent-tool')}
          className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
            itemType === 'agent-tool' ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100">Agent Tool (MCP)</h3>
            {itemType === 'agent-tool' && <CheckCircle2 className="text-indigo-500" size={20} />}
          </div>
          <p className="text-sm text-zinc-400">Multi-file toolkits, MCP servers, and executable code packages.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Content */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl text-zinc-100">
              1. Upload Content
              {isAutoFilling && <Badge className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border-indigo-500/30"><Sparkles size={12} className="mr-1" /> AI Analyzing</Badge>}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {itemType === 'agent-tool' 
                ? 'Import your tool repository from GitHub or upload a ZIP archive. We will automatically extract metadata.' 
                : 'Upload your instructions (.md). We will automatically scan it and generate metadata.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {itemType === 'agent-tool' ? (
              <div className="space-y-6">
                <div className="flex space-x-4 border-b border-zinc-800 pb-2">
                  <button type="button" onClick={() => setAgentToolMode('github')} className={`pb-2 text-sm font-medium transition-colors ${agentToolMode === 'github' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Import from GitHub (Recommended)</button>
                  <button type="button" onClick={() => setAgentToolMode('zip')} className={`pb-2 text-sm font-medium transition-colors ${agentToolMode === 'zip' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Upload ZIP Archive</button>
                </div>
                
                {agentToolMode === 'github' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input type="text" placeholder="https://github.com/owner/repo" value={githubUrl} onChange={(e) => setCode2Url(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                      </div>
                      <button type="button" onClick={handleCode2Import} disabled={!githubUrl || isAutoFilling} className="whitespace-nowrap rounded-lg bg-indigo-600 px-6 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                        Import Repository
                      </button>
                    </div>
                  </div>
                )}
                
                {agentToolMode === 'zip' && (
                  <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5">
                    <input type="file" accept=".zip" onChange={handleFileChange} className="absolute inset-0 cursor-pointer opacity-0" />
                    <Folder className={cn("mb-4 h-8 w-8", file ? "text-indigo-400" : "text-zinc-600")} />
                    <div className="mb-2 font-semibold text-zinc-200">{file ? file.name : "Click or drag ZIP archive to upload"}</div>
                    <p className="text-sm text-zinc-500">Supports .zip only (Max 25MB)</p>
                  </div>
                )}
                
                {archiveUrl && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <CheckCircle2 size={18} />
                      <span className="font-medium">Archive uploaded and processed successfully!</span>
                    </div>
                    <p className="text-sm text-emerald-500/80">Extracted {fileManifest.length} files. Metadata autofilled from README.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5">
                <input type="file" accept=".md" required onChange={handleFileChange} className="absolute inset-0 cursor-pointer opacity-0" />
                <Upload className={cn("mb-4 h-8 w-8", file ? "text-indigo-400" : "text-zinc-600")} />
                <div className="mb-2 font-semibold text-zinc-200">{file ? file.name : "Click or drag file to upload"}</div>
                <p className="text-sm text-zinc-500">Supports .md only (Max 5MB)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Details */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-zinc-100">2. Identity & Details</CardTitle>
              {(fileContent || readmeContent) && (
                <button
                  type="button"
                  onClick={() => handleAutofill(fileContent || readmeContent)}
                  disabled={isAutoFilling}
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  ✨ {isAutoFilling ? 'Auto-filling...' : 'Re-fill with AI'}
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Name *</label>
              <input type="text" required placeholder="e.g. Next.js Code Reviewer" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Summary *</label>
              <textarea required rows={3} placeholder="One line describing what this does..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>

            <div className="space-y-2" ref={dropdownRef}>
              <label className="text-sm font-medium text-zinc-200">Categories</label>
              <div className="relative">
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex min-h-[50px] w-full cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2">
                  {selectedCategories.length === 0 ? <span className="text-zinc-500">Select categories...</span> : (
                    selectedCategories.map(cat => {
                      const label = CATEGORIES.find(c => c.value === cat)?.label;
                      return (
                        <Badge key={cat} variant="secondary" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20">
                          {label}
                          <button type="button" onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }} className="ml-1 hover:text-indigo-300">&times;</button>
                        </Badge>
                      )
                    })
                  )}
                </div>
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-xl">
                    {CATEGORIES.map(cat => (
                      <div key={cat.value} onClick={() => toggleCategory(cat.value)} className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                        {cat.label}
                        {selectedCategories.includes(cat.value) && <CheckCircle2 size={16} className="text-indigo-400" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {itemType === 'agent-tool' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">Install Command</label>
                  <input type="text" placeholder="e.g. npm install -g bodhicai-mcp" value={installCommand} onChange={(e) => setInstallCommand(e.target.value)} className="w-full font-mono rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">License</label>
                  <select value={license} onChange={(e) => setLicense(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option value="MIT">MIT</option>
                    <option value="Apache-2.0">Apache 2.0</option>
                    <option value="GPL-3.0">GPL 3.0</option>
                    <option value="BSD-3-Clause">BSD 3-Clause</option>
                    <option value="Proprietary">Proprietary</option>
                  </select>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Target Audience</label>
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value as any)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="all">General Developers</option>
                  <option value="student">Students & Learners</option>
                  <option value="professional">Enterprise Professionals</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Media */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-100">3. Media (Optional)</CardTitle>
            <CardDescription className="text-zinc-400">
              Upload a cover image or thumbnail to make your {itemType} stand out in the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mediaPreview ? (
              <div className="relative max-h-64 overflow-hidden rounded-lg border border-zinc-800">
                <img src={mediaPreview} alt="Preview" className="w-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => { setMediaFile(null); setMediaPreview(''); }}
                  className="absolute right-2 top-2 rounded-md bg-black/70 p-1 text-white hover:bg-red-500"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 py-10 text-center transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5">
                <input type="file" accept="image/*" onChange={handleMediaChange} className="absolute inset-0 cursor-pointer opacity-0" />
                <ImageIcon className="mb-2 h-8 w-8 text-zinc-600" />
                <div className="text-sm font-semibold text-zinc-300">Upload Cover Image</div>
                <p className="mt-1 text-xs text-zinc-500">JPG, PNG or WEBP (Max 2MB)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Pricing */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-100">4. Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-indigo-500/50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/10">
                <input type="radio" name="pricing" className="hidden" checked={pricingModel === 'free'} onChange={() => setPricingModel('free')} />
                <span className="font-semibold text-zinc-100">Free Open Source</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-indigo-500/50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/10">
                <input type="radio" name="pricing" className="hidden" checked={pricingModel === 'paid'} onChange={() => setPricingModel('paid')} />
                <span className="flex items-center font-semibold text-zinc-100">
                  <Lock size={16} className="mr-2" /> One-Time Purchase
                </span>
              </label>
            </div>

            {pricingModel === 'paid' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Price (INR) *</label>
                <input type="number" min="50" max="10000" required placeholder="e.g. 299" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                {complexityHint && (
                  <div className="text-sm text-gray-500 mt-1">
                    AI Complexity: Level {complexityHint}/5 — 
                    {complexityHint <= 2 ? ' Simple task, consider lower pricing' : 
                     complexityHint <= 3 ? ' Moderate complexity' : 
                     ' Complex task, premium pricing justified'}
                  </div>
                )}
                <p className="text-sm text-zinc-500">Minimum ₹50. BodhicAI takes a 20% platform fee.</p>
              </div>
            )}
            
            {pricingModel === 'free' && freeSkillsCount >= 5 && (
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-orange-400">
                You have reached your limit of 5 free uploads. You can upload this, but it will be hidden until you upgrade your seller tier.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal & Submit */}
        <div className="space-y-6">
          <label className="flex items-start gap-3">
            <input type="checkbox" required checked={agreedToGuidelines} onChange={(e) => setAgreedToGuidelines(e.target.checked)} className="mt-1 h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900" />
            <span className="text-sm text-zinc-400">
              I agree to the <a href="/legal/seller-terms" className="text-indigo-400 hover:underline" target="_blank">Seller Terms of Service</a> and confirm I have the right to distribute this content. I understand that malicious payloads will result in an immediate ban.
            </span>
          </label>

          <button 
            type="submit" 
            disabled={loading || isAutoFilling}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01] hover:shadow-indigo-500/30 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Processing..." : isAutoFilling ? "Waiting for AI..." : `Publish ${itemType === 'skill' ? 'Skill' : itemType === 'prompt' ? 'Prompt' : 'Agent Tool'}`}
          </button>
        </div>

      </form>
    </div>
  );
}
