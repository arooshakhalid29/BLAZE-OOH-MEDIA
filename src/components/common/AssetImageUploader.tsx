import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  Sun,
  Moon,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
  Eye,
  Camera,
  Layers,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  UploadedImageItem,
  OOH_STOCK_TEMPLATES,
  StockTemplateItem,
  processUploadedImageFile,
  formatFileSize,
  isSampleTemplateUrl,
} from '../../utils/imageUpload';
import { MediaType } from '../../types/mediaAsset';

interface AssetImageUploaderProps {
  currentType: MediaType;
  primaryImage: string;
  nightImage?: string;
  galleryImages?: string[];
  onChange: (data: {
    primaryImage: string;
    nightImage?: string;
    galleryImages?: string[];
  }) => void;
}

export const AssetImageUploader: React.FC<AssetImageUploaderProps> = ({
  currentType,
  primaryImage,
  nightImage,
  galleryImages = [],
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'samples'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [previewMode, setPreviewMode] = useState<'day' | 'night'>('day');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maintain local state of items
  const [items, setItems] = useState<UploadedImageItem[]>(() => {
    const list: UploadedImageItem[] = [];
    if (primaryImage) {
      list.push({
        id: 'primary-img-1',
        dataUrl: primaryImage,
        name: isSampleTemplateUrl(primaryImage)
          ? 'Sample Visual Placeholder'
          : 'Primary Site Photo',
        isPrimary: true,
        isSamplePlaceholder: isSampleTemplateUrl(primaryImage),
      });
    }
    if (nightImage && nightImage !== primaryImage) {
      list.push({
        id: 'night-img-2',
        dataUrl: nightImage,
        name: isSampleTemplateUrl(nightImage)
          ? 'Sample Night Placeholder'
          : 'Night Illumination Photo',
        isNight: true,
        isSamplePlaceholder: isSampleTemplateUrl(nightImage),
      });
    }
    if (galleryImages && galleryImages.length > 0) {
      galleryImages.forEach((img, idx) => {
        if (img !== primaryImage && img !== nightImage) {
          list.push({
            id: `gallery-img-${idx + 3}`,
            dataUrl: img,
            name: `Site Angle ${idx + 1}`,
            isSamplePlaceholder: isSampleTemplateUrl(img),
          });
        }
      });
    }
    return list;
  });

  // Keep items in sync with incoming parent props if they change externally
  useEffect(() => {
    if (!primaryImage) return;
    setItems((prev) => {
      const alreadyHasPrimary = prev.some((i) => i.isPrimary && i.dataUrl === primaryImage);
      if (alreadyHasPrimary) return prev;

      // Check if primaryImage matches an existing item
      const existingIndex = prev.findIndex((i) => i.dataUrl === primaryImage);
      if (existingIndex >= 0) {
        return prev.map((item, idx) => ({
          ...item,
          isPrimary: idx === existingIndex,
          isNight: idx === existingIndex ? false : item.isNight,
        }));
      }

      // If it's a new primary image from parent (e.g. format type auto-selection)
      const newItem: UploadedImageItem = {
        id: `img-${Date.now()}`,
        dataUrl: primaryImage,
        name: isSampleTemplateUrl(primaryImage)
          ? 'Sample Visual Placeholder'
          : 'Primary Site Photo',
        isPrimary: true,
        isSamplePlaceholder: isSampleTemplateUrl(primaryImage),
      };

      const others = prev.map((item) => ({ ...item, isPrimary: false }));
      return [newItem, ...others];
    });
  }, [primaryImage]);

  const syncToParent = (updatedItems: UploadedImageItem[]) => {
    const primary = updatedItems.find((i) => i.isPrimary)?.dataUrl || updatedItems[0]?.dataUrl || '';
    const night = updatedItems.find((i) => i.isNight)?.dataUrl;
    const gallery = updatedItems.map((i) => i.dataUrl);

    onChange({
      primaryImage: primary,
      nightImage: night,
      galleryImages: gallery,
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError('');
    setIsProcessing(true);

    try {
      let newItems: UploadedImageItem[] = [...items];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          setUploadError(`Skipped "${file.name}": Only image files are allowed.`);
          continue;
        }

        const dataUrl = await processUploadedImageFile(file);

        // Real uploaded photo replaces sample placeholder as primary
        newItems = newItems.map((item) => ({ ...item, isPrimary: false }));

        newItems.unshift({
          id: `upload-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          dataUrl,
          name: file.name,
          sizeBytes: file.size,
          isPrimary: i === 0,
          isSamplePlaceholder: false,
        });
      }

      setItems(newItems);
      syncToParent(newItems);
      setActiveTab('upload');
    } catch (err: any) {
      setUploadError(err.message || 'Error processing uploaded images.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const setItemAsPrimary = (id: string) => {
    const updated = items.map((item) => ({
      ...item,
      isPrimary: item.id === id,
      isNight: item.id === id ? false : item.isNight,
    }));
    setItems(updated);
    syncToParent(updated);
  };

  const setItemAsNight = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, isNight: !item.isNight, isPrimary: false };
      }
      return item;
    });
    setItems(updated);
    syncToParent(updated);
  };

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setItems(updated);
    syncToParent(updated);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();

    // Make new uploaded url primary
    const demoted = items.map((i) => ({ ...i, isPrimary: false }));
    const newItem: UploadedImageItem = {
      id: `url-${Date.now()}`,
      dataUrl: url,
      name: url.split('/').pop()?.split('?')[0] || 'Web Image',
      isPrimary: true,
      isSamplePlaceholder: false,
    };

    const updated = [newItem, ...demoted];
    setItems(updated);
    syncToParent(updated);
    setUrlInput('');
    setShowUrlField(false);
    setActiveTab('upload');
  };

  // Assign template as Day or Night placeholder
  const handleSelectTemplateAsDay = (tmpl: StockTemplateItem) => {
    // Check if template already in items
    const existingIdx = items.findIndex((i) => i.dataUrl === tmpl.url);
    let updated: UploadedImageItem[];

    if (existingIdx >= 0) {
      updated = items.map((item, idx) => ({
        ...item,
        isPrimary: idx === existingIdx,
        isNight: idx === existingIdx ? false : item.isNight,
      }));
    } else {
      const demoted = items.map((i) => ({ ...i, isPrimary: false }));
      const newItem: UploadedImageItem = {
        id: `tpl-${Date.now()}-${tmpl.id}`,
        dataUrl: tmpl.url,
        name: `${tmpl.label} (Sample Placeholder)`,
        isPrimary: true,
        isSamplePlaceholder: true,
      };
      updated = [newItem, ...demoted];
    }

    setItems(updated);
    syncToParent(updated);
    setPreviewMode('day');
  };

  const handleSelectTemplateAsNight = (tmpl: StockTemplateItem) => {
    const existingIdx = items.findIndex((i) => i.dataUrl === tmpl.url);
    let updated: UploadedImageItem[];

    if (existingIdx >= 0) {
      updated = items.map((item, idx) => ({
        ...item,
        isNight: idx === existingIdx ? true : item.isNight,
        isPrimary: idx === existingIdx ? false : item.isPrimary,
      }));
    } else {
      const newItem: UploadedImageItem = {
        id: `tpl-${Date.now()}-${tmpl.id}-night`,
        dataUrl: tmpl.url,
        name: `${tmpl.label} (Sample Night View)`,
        isNight: true,
        isPrimary: false,
        isSamplePlaceholder: true,
      };
      updated = [...items, newItem];
    }

    setItems(updated);
    syncToParent(updated);
    setPreviewMode('night');
  };

  const currentDisplayImage =
    previewMode === 'night' && nightImage
      ? nightImage
      : primaryImage || items[0]?.dataUrl;

  const isCurrentDisplaySample = isSampleTemplateUrl(currentDisplayImage);
  const realPhotosCount = items.filter((i) => !i.isSamplePlaceholder).length;

  return (
    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
      {/* Header and Source Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-100">
                Site Photography & Visual Placeholders
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                  realPhotosCount > 0
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                }`}
              >
                {realPhotosCount > 0
                  ? `${realPhotosCount} Real ${realPhotosCount === 1 ? 'Photo' : 'Photos'}`
                  : 'Sample Placeholder'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Upload real site pictures or pick from restored sample dummy image placeholders
            </span>
          </div>
        </div>

        {/* Tab switch between Upload Real Photos & Sample Placeholders */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload Real Photos</span>
            {realPhotosCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 text-[9px] flex items-center justify-center font-bold">
                {realPhotosCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'samples'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Sample Placeholders</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
              Restored
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: UPLOAD REAL PHOTOS */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Drag and drop real photos of the physical site or installation:</span>
            <button
              type="button"
              onClick={() => setShowUrlField(!showUrlField)}
              className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors px-2 py-0.5 bg-slate-900 border border-slate-800 rounded"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{showUrlField ? 'Hide URL Input' : 'Add via Image URL'}</span>
            </button>
          </div>

          {/* URL Input Bar */}
          {showUrlField && (
            <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-700">
              <input
                type="url"
                placeholder="https://example.com/site-photo.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors"
              >
                Attach Photo
              </button>
            </div>
          )}

          {/* Main Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-950/40 ring-2 ring-amber-500/20'
                : 'border-slate-700 hover:border-amber-500/70 bg-slate-900/60 hover:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 transition-transform">
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-amber-400" />
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-200">
                {isProcessing
                  ? 'Optimizing and encoding real site photos...'
                  : 'Click to upload or drag & drop real asset photographs'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                JPG, PNG, WebP up to 15MB · Admins must upload real asset pictures for active inventory
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded shadow-xs transition-colors flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Select Real Photos from Device</span>
              </span>
            </div>
          </div>

          {uploadError && (
            <div className="p-2.5 bg-red-950/50 border border-red-800 rounded-lg flex items-center gap-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESTORED SAMPLE / DUMMY PLACEHOLDER GALLERY */}
      {activeTab === 'samples' && (
        <div className="space-y-3">
          {/* Informational Banner */}
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Sample Visual Placeholders (Restored)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              These sample dummy images provide standard structural representations for outdoor media formats across Pakistan. You can select any sample as a draft placeholder. For active client campaigns, administrators must still upload their own real site photos.
            </p>
          </div>

          {/* Grid of All Restored Sample Dummy Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {OOH_STOCK_TEMPLATES.map((tmpl) => {
              const isSelectedDay = primaryImage === tmpl.url;
              const isSelectedNight = nightImage === tmpl.url;
              const isRecommended =
                tmpl.type === currentType ||
                tmpl.recommendedFor?.includes(currentType);

              return (
                <div
                  key={tmpl.id}
                  className={`p-2 rounded-lg border transition-all flex flex-col justify-between ${
                    isSelectedDay
                      ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/30'
                      : isSelectedNight
                      ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/30'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative aspect-16/9 rounded overflow-hidden border border-slate-800 bg-slate-950 mb-1.5">
                      <img
                        src={tmpl.url}
                        alt={tmpl.label}
                        className="w-full h-full object-cover"
                      />
                      {isSelectedDay && (
                        <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Active Day</span>
                        </div>
                      )}
                      {isSelectedNight && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                          <Moon className="w-2.5 h-2.5" />
                          <span>Active Night</span>
                        </div>
                      )}
                      {isRecommended && !isSelectedDay && !isSelectedNight && (
                        <div className="absolute top-1 left-1 bg-slate-900/90 text-amber-400 border border-amber-500/50 text-[9px] font-medium px-1.5 py-0.5 rounded">
                          ★ Format Match
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-200 truncate">
                          {tmpl.label}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                          {tmpl.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleSelectTemplateAsDay(tmpl)}
                      className={`px-1.5 py-1 rounded text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                        isSelectedDay
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700'
                      }`}
                    >
                      <Sun className="w-2.5 h-2.5" />
                      <span>{isSelectedDay ? 'Day Active' : 'Set as Day'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTemplateAsNight(tmpl)}
                      className={`px-1.5 py-1 rounded text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                        isSelectedNight
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 hover:bg-blue-500/20 text-slate-200 hover:text-blue-300 border border-slate-700'
                      }`}
                    >
                      <Moon className="w-2.5 h-2.5" />
                      <span>{isSelectedNight ? 'Night Active' : 'Set as Night'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Preview Card */}
      {currentDisplayImage && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Active Site Image Preview
            </span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5">
              <button
                type="button"
                onClick={() => setPreviewMode('day')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                  previewMode === 'day'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Day</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('night')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                  previewMode === 'night'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Night {nightImage ? '✓' : '(Simulated)'}</span>
              </button>
            </div>
          </div>

          <div className="relative aspect-16/9 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 group">
            <img
              src={currentDisplayImage}
              alt="Site preview"
              className={`w-full h-full object-cover transition-all duration-300 ${
                previewMode === 'night' && !nightImage
                  ? 'brightness-75 contrast-125 saturate-120'
                  : ''
              }`}
            />
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 border border-slate-700">
              {currentType} · Active Viewport
            </div>

            {/* Visual Indicator of whether current image is a sample placeholder or real upload */}
            <div className="absolute top-2 right-2">
              {isCurrentDisplaySample ? (
                <div className="bg-amber-950/90 text-amber-300 border border-amber-600/70 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-xs">
                  <Info className="w-3 h-3 text-amber-400" />
                  <span>Sample Visual Placeholder (Admin photo required for live)</span>
                </div>
              ) : (
                <div className="bg-emerald-950/90 text-emerald-300 border border-emerald-600/70 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Real Site Photo Attached</span>
                </div>
              )}
            </div>

            {previewMode === 'night' && (
              <div className="absolute bottom-2 left-2 bg-blue-950/90 text-blue-300 text-[10px] px-2 py-0.5 rounded border border-blue-800 flex items-center gap-1 font-mono">
                <Moon className="w-3 h-3" />
                <span>{nightImage ? 'Night Camera Capture' : 'Night Illumination Simulated'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attached Photos List with Controls */}
      {items.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-300 block">
              Attached Media Photos & Placeholders ({items.length})
            </span>
            <span className="text-[10px] text-slate-500">
              Click &apos;Set as Primary&apos; or &apos;Set as Night&apos; to reassign
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                  item.isPrimary
                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/20'
                    : item.isNight
                    ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/20'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-14 h-14 rounded overflow-hidden shrink-0 border border-slate-700 bg-slate-950">
                  <img
                    src={item.dataUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.isPrimary && (
                    <div className="absolute top-0.5 left-0.5 bg-amber-500 text-slate-950 rounded p-0.5 shadow-xs">
                      <Sun className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  )}
                  {item.isNight && (
                    <div className="absolute top-0.5 left-0.5 bg-blue-500 text-white rounded p-0.5 shadow-xs">
                      <Moon className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Details & Actions */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-200 truncate block">
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.isSamplePlaceholder && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/70 text-amber-400 border border-amber-800/60 font-mono">
                        Placeholder
                      </span>
                    )}

                    {item.isPrimary ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                        ★ Primary Day
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setItemAsPrimary(item.id)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      >
                        Set as Primary
                      </button>
                    )}

                    {item.isNight ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                        🌙 Night Photo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setItemAsNight(item.id)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      >
                        Set as Night
                      </button>
                    )}

                    {item.sizeBytes && (
                      <span className="text-[9px] text-slate-500 font-mono ml-auto">
                        {formatFileSize(item.sizeBytes)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
