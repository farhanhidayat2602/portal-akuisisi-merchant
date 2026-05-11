const fs = require('fs');

let content = fs.readFileSync('src/app/negotiation/page.tsx', 'utf-8');

// PaymentPattern
content = content.replace(/text-green-600/g, 'text-[#0064B4]');
content = content.replace(/text-blue-600/g, 'text-[#003B79]');
content = content.replace(/text-purple-600/g, 'text-[#F5A623]');

content = content.replace(/bg-green-400/g, 'bg-[#0064B4]');
content = content.replace(/bg-blue-400/g, 'bg-[#003B79]');
content = content.replace(/bg-purple-400/g, 'bg-[#F5A623]');

// Background track
content = content.replace(/bg-blue-200/g, 'bg-slate-200');
content = content.replace(/accent-blue-600/g, 'accent-[#0064B4]');
content = content.replace(/bg-purple-200/g, 'bg-slate-200');
content = content.replace(/accent-purple-600/g, 'accent-[#F5A623]');

// Pattern backgrounds
content = content.replace(/bg-blue-50/g, 'bg-[#F5F7FA] border border-slate-200');
content = content.replace(/text-blue-700/g, 'text-[#002A57]');
content = content.replace(/text-blue-500/g, 'text-slate-500');

content = content.replace(/bg-purple-50/g, 'bg-[#F5F7FA] border border-slate-200');
content = content.replace(/text-purple-700/g, 'text-[#002A57]');
content = content.replace(/text-purple-500/g, 'text-slate-500');

// Hero
content = content.replace(/bg-mandiri-700/g, 'bg-[#003B79]');
content = content.replace(/bg-green-500/g, 'bg-[#F5A623]');
content = content.replace(/text-white/g, 'text-white'); // keep
content = content.replace(/text-mandiri-200/g, 'text-blue-100');
content = content.replace(/className="text-white"/g, 'className="text-[#002A57]"');

// Step 1
content = content.replace(/bg-mandiri-700/g, 'bg-[#003B79]'); // step 1 circle
content = content.replace(/ring-mandiri-300/g, 'ring-[#0064B4]');
content = content.replace(/text-mandiri-600/g, 'text-[#0064B4]');

// Step 2a
content = content.replace(/border-red-100/g, 'border-slate-200');
content = content.replace(/bg-red-500/g, 'bg-slate-600');
content = content.replace(/border-red-500/g, 'border-slate-600');
content = content.replace(/border-red-300/g, 'border-slate-300');

// Step 2b
content = content.replace(/border-mandiri-200/g, 'border-slate-200');
content = content.replace(/bg-mandiri-50/g, 'bg-[#F5F7FA] border border-slate-100');
content = content.replace(/text-mandiri-700/g, 'text-[#003B79]');

// Tarif Bank Existing
content = content.replace(/bg-red-100/g, 'bg-slate-100');
content = content.replace(/ring-red-200/g, 'ring-slate-300');

// Tarif Mandiri
content = content.replace(/bg-mandiri-100/g, 'bg-blue-50');
content = content.replace(/ring-mandiri-200/g, 'ring-[#0064B4]');

// Results - Ringkasan Input
content = content.replace(/bg-red-50/g, 'bg-[#F5F7FA] border border-slate-200');
content = content.replace(/text-red-500/g, 'text-slate-600');
content = content.replace(/text-green-700/g, 'text-[#0064B4]');
// text-blue-700 already replaced to text-[#002A57], let's do it manually below

content = content.replace(/border-red-100/g, 'border-slate-200');
content = content.replace(/text-red-600/g, 'text-slate-700');
content = content.replace(/text-red-400/g, 'text-slate-400');

content = content.replace(/bg-green-600 rounded-2xl/g, 'bg-[#003B79] rounded-2xl');
content = content.replace(/text-green-200/g, 'text-blue-200');
content = content.replace(/text-green-100/g, 'text-blue-100');

// Fix specific texts in results
content = content.replace(/text-slate-600/g, 'text-slate-600'); // No-op
content = content.replace(/text-\[#002A57\]/g, 'text-[#003B79]'); // Bring back blue for values

// CTA
content = content.replace(/bg-mandiri-yellow/g, 'bg-[#F5A623]');
content = content.replace(/bg-mandiri-600\/60/g, 'bg-white border border-[#003B79] text-[#003B79]');
content = content.replace(/hover:bg-mandiri-600/g, 'hover:bg-slate-50');

// PDF Button
content = content.replace(/bg-green-500/g, 'bg-slate-800');
content = content.replace(/hover:bg-green-600/g, 'hover:bg-slate-900');

fs.writeFileSync('src/app/negotiation/page.tsx', content);
