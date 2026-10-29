import unipoleImg from '../assets/images/unipole_billboard_1790581927863.jpg';
import doohSmdImg from '../assets/images/dooh_smd_screen_1790581912551.jpg';
import bridgePanelImg from '../assets/images/bridge_panel_1790581944286.jpg';
import gantryImg from '../assets/images/gantry_urban_1790581956476.jpg';

export interface UploadedImageItem {
  id: string;
  dataUrl: string;
  name: string;
  sizeBytes?: number;
  isPrimary?: boolean;
  isNight?: boolean;
  isSamplePlaceholder?: boolean;
}

export interface StockTemplateItem {
  id: string;
  label: string;
  type: string;
  url: string;
  description: string;
  recommendedFor?: string[];
  isNight?: boolean;
}

export const OOH_STOCK_TEMPLATES: StockTemplateItem[] = [
  {
    id: 'stock-unipole',
    label: 'Standard Unipole Billboard',
    type: 'Billboard',
    url: unipoleImg,
    description: 'High-impact roadside unipole billboard in prime arterial urban corridor',
    recommendedFor: ['Billboard', 'Unipole', 'Cantilever'],
  },
  {
    id: 'stock-dooh',
    label: 'Digital SMD Screen',
    type: 'Digital Screen',
    url: doohSmdImg,
    description: 'High-refresh P4/P6 digital SMD LED screen on commercial boulevard',
    recommendedFor: ['Digital Screen', 'Digital SMD Screen'],
  },
  {
    id: 'stock-gantry',
    label: 'Highway Overhead Gantry',
    type: 'Gantry',
    url: gantryImg,
    description: 'Dual-span heavy steel overhead gantry spanning multi-lane expressway',
    recommendedFor: ['Gantry'],
  },
  {
    id: 'stock-bridge',
    label: 'Bridge / Flyover Panel',
    type: 'Bridge Panel',
    url: bridgePanelImg,
    description: 'Continuous horizontal bridge face panel mounted directly on flyover deck',
    recommendedFor: ['Bridge Panel', 'Building Wrap'],
  },
];

export const getDefaultTemplateForType = (type: string): StockTemplateItem => {
  const match = OOH_STOCK_TEMPLATES.find(
    (t) => t.type === type || t.recommendedFor?.includes(type)
  );
  return match || OOH_STOCK_TEMPLATES[0];
};

export const isSampleTemplateUrl = (url?: string): boolean => {
  if (!url) return false;
  return OOH_STOCK_TEMPLATES.some((t) => t.url === url);
};

/**
 * Reads a File and resizes it to max 1600px for optimal in-memory/browser performance
 */
export const processUploadedImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image (JPEG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG 0.88 for crisp quality with tiny size
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        resolve(compressed);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
