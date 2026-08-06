import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Sparkles, Upload, Image as ImageIcon, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [itemType, setItemType] = useState<'skill' | 'prompt'>('skill');
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    // Auto-fill trigger
    setIsAutoFilling(true);
    showToast("Analyzing file to auto-fill details...", "info");
    
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject("Error reading file");
        reader.readAsText(selected);
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/autofill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const metadata = await res.json();
        if (metadata.title) setTitle(metadata.title);
        if (metadata.description) setDescription(metadata.description);
        if (metadata.category) {
          const cats = metadata.category.split(',').map((c: string) => c.trim().toLowerCase());
          const validCats = CATEGORIES.filter(c => cats.includes(c.value) || cats.includes(c.label.toLowerCase())).map(c => c.value);
          if (validCats.length > 0) {
            setSelectedCategories(validCats);
          }
        }
        showToast("Auto-filled details successfully!", "success");
      } else {
        throw new Error("Failed to auto-fill");
      }
    } catch (err) {
      console.error(err);
      showToast("Auto-fill skipped. You can manually enter details.", "info");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev => 
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  const handleMediaFileChange = async (f: File) => {
    setMediaFile(f);
    const objectUrl = URL.createObjectURL(f);
    setMediaPreview(objectUrl);
    setMediaUrl('');
    setMediaUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const ext = f.name.split('.').pop();
      const filePath = `skill_media/${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('user_media').upload(filePath, f, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('user_media').getPublicUrl(filePath);
      setMediaUrl(publicUrl);
      showToast('Media uploaded!', 'success');
    } catch (err: any) {
      showToast('Media upload failed', 'error');
      setMediaFile(null);
      setMediaPreview('');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleAppeal = async () => {
    if (!appealMsg.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: appealMsg })
      });
      showToast("Appeal submitted.", "success");
      setAppealMsg('');
    } catch (e) {
      showToast("Error submitting appeal.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !agreedToGuidelines) return;
    setLoading(true);
    setResult(null);

    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject("Error");
        reader.readAsText(file);
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return window.location.assign('/login');

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          title, description, content,
          base_price_inr: pricingModel === 'free' ? 0 : parseFloat(price) || 0,
          billing_type: 'one-time', categories: selectedCategories, target_audience: targetAudience,
          item_type: itemType, media_url: mediaUrl || undefined
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
    } catch (err) {
      setResult({ success: false, content: <div className="text-red-400 font-medium">An unexpected error occurred.</div> });
    } finally {
      setLoading(false);
    }
  };

  const isPaidLocked = freeSkillsCount < 2;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Type Selector */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div 
          onClick={() => setItemType('skill')}
          className={cn(
            "cursor-pointer rounded-2xl border p-6 text-center transition-all",
            itemType === 'skill' ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50"
          )}
        >
          <strong className={cn("mb-1 block text-lg", itemType === 'skill' ? "text-indigo-400" : "text-zinc-100")}>AI Agent Skill</strong>
          <span className="text-sm text-zinc-500">MCP tools & instructions</span>
        </div>
        <div 
          onClick={() => setItemType('prompt')}
          className={cn(
            "cursor-pointer rounded-2xl border p-6 text-center transition-all",
            itemType === 'prompt' ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50"
          )}
        >
          <strong className={cn("mb-1 block text-lg", itemType === 'prompt' ? "text-indigo-400" : "text-zinc-100")}>Prompt Template</strong>
          <span className="text-sm text-zinc-500">System prompts & workflows</span>
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
              Upload your {itemType === 'prompt' ? 'prompt text (.md)' : 'instructions (.md)'}. We will automatically scan it and generate metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5">
              <input type="file" accept=".md" required onChange={handleFileChange} className="absolute inset-0 cursor-pointer opacity-0" />
              <Upload className={cn("mb-4 h-8 w-8", file ? "text-indigo-400" : "text-zinc-600")} />
              <div className="mb-2 font-semibold text-zinc-200">{file ? file.name : "Click or drag file to upload"}</div>
              <p className="text-sm text-zinc-500">Supports .md only (Max 5MB)</p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Details */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-100">2. Identity & Details</CardTitle>
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
                  <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-xl">
                    {CATEGORIES.map(category => (
                      <div key={category.value} onClick={() => toggleCategory(category.value)} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                        <input type="checkbox" checked={selectedCategories.includes(category.value)} readOnly className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" />
                        <span>{category.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Target Audience *</label>
              <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value as any)} className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="all">Everyone (General Purpose)</option>
                <option value="student">Students (Assignments, Prep, College)</option>
                <option value="professional">Professionals (Work, Tech, Finance)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Media Thumbnail (Optional)</label>
              {!mediaPreview ? (
                <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-950/50 py-8 text-center transition-colors hover:border-zinc-700">
                  <input type="file" accept="image/*,video/mp4,video/webm" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaFileChange(f); }} className="absolute inset-0 cursor-pointer opacity-0" />
                  <ImageIcon className="mb-2 h-6 w-6 text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-400">Upload Image / Video</p>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                  {mediaFile?.type.startsWith('video') ? (
                    <video src={mediaPreview} muted autoPlay loop playsInline className="h-48 w-full object-cover" />
                  ) : (
                    <img src={mediaPreview} alt="preview" className="h-48 w-full object-cover" />
                  )}
                  {mediaUploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white backdrop-blur-sm">Uploading...</div>}
                  <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(''); setMediaUrl(''); }} className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70">&times;</button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Pricing */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-100">3. Pricing Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div 
                onClick={() => setPricingModel('free')}
                className={cn("cursor-pointer rounded-xl border p-4 text-center transition-all", pricingModel === 'free' ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900")}
              >
                <div className={cn("font-semibold", pricingModel === 'free' ? "text-indigo-400" : "text-zinc-100")}>Free</div>
                <div className="mt-1 text-xs text-zinc-500">Available to all users</div>
              </div>
              
              <div 
                onClick={() => { if (!isPaidLocked) setPricingModel('paid'); }}
                className={cn("relative cursor-pointer rounded-xl border p-4 text-center transition-all", 
                  isPaidLocked ? "cursor-not-allowed border-zinc-800 bg-zinc-950/50 opacity-60" :
                  pricingModel === 'paid' ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                )}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <div className={cn("font-semibold", pricingModel === 'paid' ? "text-indigo-400" : "text-zinc-100")}>Paid License</div>
                  {isPaidLocked && <Lock size={14} className="text-amber-500" />}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {isPaidLocked ? `Publish ${2 - freeSkillsCount} more free skills to unlock` : 'One-time purchase'}
                </div>
              </div>
            </div>

            {pricingModel === 'paid' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Base Price (INR) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                  <input type="number" required min="79" step="1" placeholder="500" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <p className="text-xs text-zinc-500 mt-1">Minimum price ₹79. You keep 80%.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Consent & Submit */}
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <input type="checkbox" id="guidelines" checked={agreedToGuidelines} onChange={(e) => setAgreedToGuidelines(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-red-500/30 bg-zinc-950 accent-red-500" />
            <label htmlFor="guidelines" className="text-sm leading-relaxed text-zinc-300">
              I have read the <a href="/guides/seller-requirements" target="_blank" className="text-indigo-400 hover:underline">BodhicAI Creator Requirements</a> and verify that this {itemType} contains no prohibited security bypasses, prompt injections, or marketing fluff in the instructions.
            </label>
          </div>

          <button type="submit" disabled={loading || !agreedToGuidelines} className="w-full rounded-full bg-indigo-600 py-4 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Scanning & Uploading...' : `Publish ${itemType === 'skill' ? 'Skill' : 'Prompt'} →`}
          </button>
        </div>
      </form>

      {/* Result Modals / Alerts */}
      {result && (
        <div className={cn("rounded-xl border p-6", result.success ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10")}>
          {result.content}
          
          {isBlocked && (
            <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <h4 className="mb-2 text-sm font-medium text-zinc-200">Submit an Appeal</h4>
              <textarea rows={3} className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Explain your situation..." value={appealMsg} onChange={(e) => setAppealMsg(e.target.value)} />
              <button type="button" onClick={handleAppeal} className="mt-3 rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">Submit Appeal</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
