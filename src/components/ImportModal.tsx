import React, { useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { X, Upload, ShieldCheck, FileText, Database } from 'lucide-react';
import DOMPurify from 'dompurify';
import { parsePDFFile } from '../lib/pdfParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { importState, showToast } = useResumeStore();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;
  const sanitizeData = (data: any): any => {
    if (typeof data === 'string') return DOMPurify.sanitize(data);
    if (Array.isArray(data)) return data.map(sanitizeData);
    if (typeof data === 'object' && data !== null) {
      const sanitizedObj: Record<string, any> = {};
      for (const key in data) sanitizedObj[key] = sanitizeData(data[key]);
      return sanitizedObj;
    }
    return data; 
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      if (file.type === 'application/pdf') {
        showToast("Running Local PDF Parser...");
        const parsedState = await parsePDFFile(file);
        const safeState = sanitizeData(parsedState);
        importState(safeState);
        
        showToast("PDF Successfully Imported!");
        onClose();

      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const rawJson = JSON.parse(event.target?.result as string);
            const sanitizedJson = sanitizeData(rawJson);
            importState(sanitizedJson);
            showToast("Backup Imported Successfully!");
            onClose();
          } catch (error) {
            window.alert("Invalid backup file. Please ensure it is a valid Svalekh JSON export.");
          }
        };
        reader.readAsText(file);
      } else {
        window.alert("Unsupported file type. Please upload a .json backup or a .pdf file.");
      }
    } catch (error) {
      console.error("Extraction error:", error);
      window.alert("Failed to process the file. Please try again.");
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#18181A] border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-zinc-400" />
            Import Data
          </h2>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="text-zinc-500 hover:text-white transition-colors bg-zinc-800/50 p-1.5 rounded-md hover:bg-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-6">
          Upload a <strong className="text-zinc-200">JSON Backup</strong> to restore your workspace, or a <strong className="text-zinc-200">PDF</strong> to extract raw text.
        </p>

        <div className="relative border-2 border-dashed border-zinc-700 rounded-xl p-8 hover:bg-zinc-900/50 transition-colors text-center group cursor-pointer">
          <input 
            type="file" 
            accept=".json,application/pdf" 
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-wait"
            title="Upload JSON or PDF"
          />
          {isProcessing ? (
            <div className="animate-pulse">
               <Database className="w-8 h-8 text-blue-500 mx-auto mb-3" />
               <span className="text-sm font-bold text-blue-400">Processing File...</span>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-4 mb-4">
                <Database className="w-8 h-8 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                <FileText className="w-8 h-8 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                Click or drag file here
              </span>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center gap-2 text-xs text-emerald-500/80 font-medium justify-center">
          <ShieldCheck className="w-4 h-4" />
          Processed locally. No data leaves your machine.
        </div>
      </div>
    </div>
  );
}