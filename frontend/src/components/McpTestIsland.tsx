import React, { useState } from 'react';

export default function McpTestIsland({ skillId }: { skillId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 w-full mt-2" onClick={() => setIsOpen(true)}>
        Test via MCP (Credits)
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-5">
          <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900 w-full max-w-lg shadow-xl relative overflow-hidden">
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Test with local AI Agent</h2>
            <p className="text-zinc-300 mb-6">
              You can test this skill directly from Cursor, Claude Desktop, or Windsurf before buying it outright. Testing consumes <strong className="text-zinc-100">dynamic Bodhic Credits (10 to 100 CR)</strong> per interaction according to the skill's AI Complexity Level (Level 1: 10 CR, Level 2: 20 CR, Level 3: 40 CR, Level 4: 70 CR, Level 5: 100 CR).
            </p>
            
            <div className="bg-zinc-900/50 p-6 rounded-xl mb-8 border border-zinc-800/50">
              <ol className="list-decimal ml-5 text-zinc-300 flex flex-col gap-2">
                <li>Ensure you have Bodhic Credits. <a href="/dashboard/credits" className="text-indigo-400 hover:text-indigo-300 hover:underline">Recharge Here</a>.</li>
                <li>Generate an API key in your <a href="/dashboard/developer" className="text-indigo-400 hover:text-indigo-300 hover:underline">Developer Settings</a>.</li>
                <li>Add the Bodhic MCP server to your agent's config using your key.</li>
                <li>Ask your agent: <em className="text-zinc-100 not-italic font-mono bg-black/50 px-1 py-0.5 rounded">"Call chat_with_skill for {skillId}"</em></li>
              </ol>
            </div>
            
            <div className="flex gap-3">
              <a href="/dashboard/credits" className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 text-center">Buy Credits</a>
              <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950" onClick={() => setIsOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
