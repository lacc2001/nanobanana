
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { InfiniteCanvas, CanvasApi, ViewportData } from './components/InfiniteCanvas';
import { ContextMenu } from './components/ContextMenu';
import { DrawingModal } from './components/DrawingModal';
import { ImageEditModal } from './components/ImageEditModal';
import { Minimap } from './components/Minimap';
import type { CanvasElement, NoteElement, ImageElement, ArrowElement, DrawingElement, Point, ElementType, AnalysisResult } from './types';
import { useHistoryState } from './useHistoryState';

export const COLORS = [
  { name: 'Gray', bg: 'bg-gray-700', text: 'text-gray-700' },
  { name: 'Red', bg: 'bg-red-500', text: 'text-red-500' },
  { name: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500' },
  { name: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  { name: 'Green', bg: 'bg-green-500', text: 'text-green-500' },
  { name: 'Blue', bg: 'bg-blue-600', text: 'text-blue-600' },
  { name: 'Purple', bg: 'bg-purple-600', text: 'text-purple-600' },
  { name: 'Pink', bg: 'bg-pink-500', text: 'text-pink-500' },
];

const INITIAL_ELEMENTS: CanvasElement[] = [
  { id: '1', type: 'note', position: { x: 20, y: -200 }, width: 500, height: 240, rotation: 0, zIndex: 1, content: '[ 🍌 Nano Banana 無限畫布 Infinite Canvas 🍌 ]\n\nThreads: @Prompt_case | 官方社群: @Prompt_case\n\nTutorials: https://www.patreon.com/posts/138078524 | 教學\n\nCopyright: Prompt_case | 版權所有\n述文老師依據原作者 2.5 版進行優化', color: 'bg-blue-600', textAlign: 'center' },
  { id: '2', type: 'note', position: { x: 300, y: 80 }, width: 280, height: 220, rotation: -10, zIndex: 2, content: '🕹️ CONTROL / 控制: \n\n● Pan / 平移:\n   Hold [SPACE] or [Middle Mouse Button]\n   按住 [空白鍵] 或 [滑鼠中鍵]\n\n● Zoom / 縮放: [SCROLL] / [滾輪]\n\n● Options / 選項: [Right-click] / [右鍵]', color: 'bg-green-500' },
  { id: '3', type: 'note', position: { x: -250, y: 80 }, width: 280, height: 160, rotation: 5, zIndex: 0, content: '⚡ Shortcut / 捷徑:\n\n● [Command+Z] for Undo / 復原\n\n● [Shift+Command+Z] for Redo / 重做', color: 'bg-yellow-500' },
];

const translations: Record<string, Record<string, string>> = {
  en: {
    infiniteCanvas: 'Infinite Canvas',
    selectObjectToTransform: 'Select an object to transform it.',
    addNote: 'Add Note',
    addArrow: 'Add Arrow',
    addDrawing: 'Add Drawing',
    addImages: 'Add Image(s)',
    imageEdit: 'Image Edit',
    removeOrEditObject: 'Remove or Edit Object',
    expandImage: 'Expand Image',
    color: 'Color',
    controls: 'Controls',
    settings: 'Settings',
    undo: 'Undo',
    redo: 'Redo',
    export: 'Export',
    import: 'Import',
    bringToFront: '↑ Bring to Front',
    sendToBack: '↓ Send to Back',
    delete: 'Delete',
    resetView: 'Reset View',
    generatingImages: 'Generating Images...',
    thisMayTakeAMoment: 'This may take a moment.',
    chooseAnImage: 'Choose an Image',
    addToCanvas: 'Add to Canvas',
    download: 'Download',
    close: 'Close',
    duplicate: 'Duplicate',
    changeColor: 'Change Color',
    downloadImage: 'Download Image',
    editDrawing: 'Edit Drawing',
    changeLanguage: '中文',
    alignPanelRight: 'Align Panel Right',
    alignPanelLeft: 'Align Panel Left',
    interactionMode: 'Touch Mode',
    panMode: 'Pan',
    selectMode: 'Select',
    analyzeDraft: 'Analyze Draft',
    analyzing: 'Analyzing...',
    contentDescription: 'Content Description',
    styleSuggestions: 'Style Suggestions',
    copy: 'Copy',
    copied: 'Copied!',
    hide: 'Hide',
    show: 'Show',
    clear: 'Clear',
    translate: 'Translate',
    translating: 'Translating...',
    optimizePrompt: 'Optimize Prompt',
    optimizing: 'Optimizing...',
    optimizedPrompt: 'Optimized Prompt',
    variations: 'Variations',
    drawingPad: 'Drawing Pad',
    pencil: 'Pencil',
    eraser: 'Eraser',
    size: 'Size',
    saveDrawing: 'Save Drawing',
    cancel: 'Cancel',
    shapes: 'Shapes',
    line: 'Line',
    rectangle: 'Rectangle',
    circle: 'Circle',
    triangle: 'Triangle',
    star: 'Star',
    arrow: 'Arrow',
    group: 'Group',
    ungroup: 'Ungroup',
  },
  zh: {
    infiniteCanvas: '無限畫布',
    selectObjectToTransform: '選取物件以進行變換。',
    addNote: '新增便利貼',
    addArrow: '新增箭頭',
    addDrawing: '新增繪圖',
    addImages: '新增圖片',
    imageEdit: '圖片編輯',
    removeOrEditObject: '移除或編輯物件',
    expandImage: '擴展圖片',
    color: '顏色',
    controls: '控制',
    settings: '設定',
    undo: '復原',
    redo: '重做',
    export: '匯出',
    import: '匯入',
    bringToFront: '↑ 移到最前',
    sendToBack: '↓ 移到最後',
    delete: '刪除',
    resetView: '重設視圖',
    generatingImages: '正在生成圖片...',
    thisMayTakeAMoment: '這可能需要一些時間。',
    chooseAnImage: '選擇一張圖片',
    addToCanvas: '新增至畫布',
    download: '下載',
    close: '關閉',
    duplicate: '複製',
    changeColor: '更改顏色',
    downloadImage: '下載圖片',
    editDrawing: '編輯繪圖',
    changeLanguage: 'English',
    alignPanelRight: '面板靠右',
    alignPanelLeft: '面板靠左',
    interactionMode: '觸控模式',
    panMode: '平移',
    selectMode: '選取',
    analyzeDraft: '分析草稿',
    analyzing: '分析中...',
    contentDescription: '內容描述',
    styleSuggestions: '風格建議',
    copy: '複製',
    copied: '已複製！',
    hide: '隱藏',
    show: '顯示',
    clear: '清除',
    translate: '翻譯',
    translating: '翻譯中...',
    optimizePrompt: '提示詞優化',
    optimizing: '優化中...',
    optimizedPrompt: '優化版提示詞',
    variations: '創意變化',
    drawingPad: '繪圖板',
    pencil: '鉛筆',
    eraser: '橡皮擦',
    size: '大小',
    saveDrawing: '儲存繪圖',
    cancel: '取消',
    shapes: '圖形',
    line: '線條',
    rectangle: '矩形',
    circle: '圓形',
    triangle: '三角形',
    star: '星形',
    arrow: '箭頭',
    group: '建立群組',
    ungroup: '取消群組',
  }
};


interface ContextMenuData {
    x: number;
    y: number;
    worldPoint: Point;
    elementId: string | null;
}

export interface OutpaintingState {
  element: ImageElement;
  frame: {
    position: Point;
    width: number;
    height: number;
  };
}

const App: React.FC = () => {
  const { 
    state: elements, 
    setState: setElements, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistoryState<CanvasElement[]>(INITIAL_ELEMENTS);

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [resetView, setResetView] = useState<() => void>(() => () => {});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [editingDrawing, setEditingDrawing] = useState<DrawingElement | null>(null);
  const [editingImage, setEditingImage] = useState<ImageElement | null>(null);
  const [outpaintingState, setOutpaintingState] = useState<OutpaintingState | null>(null);
  const [imageStyle, setImageStyle] = useState<string>('Default');
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('1:1');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [panelAlignment, setPanelAlignment] = useState<'left' | 'right'>('left');
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('pan');
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});
  const [analyzingElementId, setAnalyzingElementId] = useState<string | null>(null);
  const [analysisVisibility, setAnalysisVisibility] = useState<Record<string, boolean>>({});
  const [translatingElementId, setTranslatingElementId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportData>({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    zoom: 1
  });


  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const canvasApiRef = useRef<CanvasApi>(null);
  const lastImagePosition = useRef<Point | null>(null);
  const zIndexCounter = useRef(INITIAL_ELEMENTS.length);
  const dragCounter = useRef(0);
  const lastWorldMousePosition = useRef<Point | null>(null);
  
  const ai = useRef<GoogleGenAI | null>(null);
  
  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);
  
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  }, []);

  const getAi = useCallback(() => {
    if (!ai.current) {
        if (!process.env.API_KEY) {
            alert("API_KEY environment variable is not set.");
            return null;
        }
        ai.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai.current;
  }, []);

  const getCenterOfViewport = useCallback((): Point => {
    if (canvasApiRef.current) {
        const screenCenter: Point = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        };
        return canvasApiRef.current.screenToWorld(screenCenter);
    }
    return {x: 0, y: 0};
  }, []);

  const getTargetPosition = useCallback((): Point => {
    // 1. Priority: selected elements
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    if (selected.length > 0) {
        const getRotatedCorners = (el: CanvasElement): Point[] => {
            const { x, y } = el.position;
            const { width, height, rotation } = el;
            const rad = rotation * (Math.PI / 180);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const halfW = width / 2;
            const halfH = height / 2;
            const corners = [
                { x: -halfW, y: -halfH }, { x: halfW, y: -halfH },
                { x: halfW, y: halfH },   { x: -halfW, y: halfH }
            ];
            return corners.map(corner => ({
                x: x + corner.x * cos - corner.y * sin,
                y: y + corner.x * sin + corner.y * cos,
            }));
        };
        
        const allCorners = selected.flatMap(getRotatedCorners);
        const maxX = Math.max(...allCorners.map(c => c.x));
        const minY = Math.min(...allCorners.map(c => c.y));
        const maxY = Math.max(...allCorners.map(c => c.y));
        
        return { x: maxX + 250, y: (minY + maxY) / 2 };
    }

    // 2. Fallback: last mouse position
    if (lastWorldMousePosition.current) {
        return { x: lastWorldMousePosition.current.x + 20, y: lastWorldMousePosition.current.y + 20 };
    }

    // 3. Last resort: center of viewport
    return getCenterOfViewport();
  }, [elements, selectedElementIds, getCenterOfViewport]);

  const handleCanvasMouseMove = (worldPoint: Point) => {
    lastWorldMousePosition.current = worldPoint;
  };
  
  const handleViewportChange = useCallback((newViewport: ViewportData) => {
    setViewport(newViewport);
  }, []);

  const handleZoomIn = () => canvasApiRef.current?.zoomIn();
  const handleZoomOut = () => canvasApiRef.current?.zoomOut();
  const handlePanTo = (worldPoint: Point) => canvasApiRef.current?.panTo(worldPoint);

  const addElement = useCallback((newElement: Omit<NoteElement, 'id' | 'zIndex'> | Omit<ImageElement, 'id' | 'zIndex'> | Omit<ArrowElement, 'id' | 'zIndex'> | Omit<DrawingElement, 'id' | 'zIndex'>) => {
    const elementWithId: CanvasElement = {
        ...newElement,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        zIndex: zIndexCounter.current++,
    } as CanvasElement;
     setElements(prev => [...prev, elementWithId]);
  }, [setElements]);

  const addNote = useCallback((position?: Point) => {
    addElement({
      type: 'note',
      position: position || getTargetPosition(),
      width: 150,
      height: 100,
      rotation: 0,
      content: 'New Note',
      color: COLORS[Math.floor(Math.random() * COLORS.length)].bg,
    });
  }, [addElement, getTargetPosition]);
  
  const addDrawing = useCallback((position?: Point) => {
    addElement({
      type: 'drawing',
      position: position || getTargetPosition(),
      width: 400,
      height: 300,
      rotation: 0,
      src: '',
    });
  }, [addElement, getTargetPosition]);
  
  const handleEditDrawing = useCallback((elementId: string) => {
      const element = elements.find(el => el.id === elementId);
      if (element && element.type === 'drawing') {
          setEditingDrawing(element);
      }
  }, [elements]);
  
  const handleSaveDrawing = (elementId: string, dataUrl: string) => {
      setElements(prev => prev.map(el =>
          el.id === elementId ? { ...el, src: dataUrl } : el
      ));
      setEditingDrawing(null);
  };
    
  const handleStartImageEdit = useCallback((elementId: string) => {
      const element = elements.find(el => el.id === elementId);
      if (element && element.type === 'image') {
          setEditingImage(element);
      }
  }, [elements]);

  const handleSaveImageEdit = (elementId: string, newSrc: string) => {
      setElements(prev => prev.map(el =>
          el.id === elementId && el.type === 'image' ? { ...el, src: newSrc } : el
      ));
      setEditingImage(null);
  };

    const handleStartOutpainting = useCallback((elementId: string) => {
        const element = elements.find(el => el.id === elementId && el.type === 'image') as ImageElement | undefined;
        if (element) {
            setOutpaintingState({
                element,
                frame: {
                    position: { ...element.position },
                    width: element.width,
                    height: element.height,
                }
            });
            setSelectedElementIds([]); // Deselect to hide default controls
            setContextMenu(null);
        }
    }, [elements]);

    const handleUpdateOutpaintingFrame = useCallback((newFrame: { position: Point; width: number; height: number; }) => {
        setOutpaintingState(prev => prev ? { ...prev, frame: { ...prev.frame, ...newFrame } } : null);
    }, []);

    const handleCancelOutpainting = () => {
        setOutpaintingState(null);
    };

    const handleOutpaintingGenerate = useCallback(async (prompt: string) => {
        if (!outpaintingState) return;

        const genAI = getAi();
        if (!genAI) return;

        setIsGenerating(true);
        const { element, frame } = outpaintingState;

        try {
            const taskCanvas = document.createElement('canvas');
            taskCanvas.width = Math.ceil(frame.width);
            taskCanvas.height = Math.ceil(frame.height);
            const ctx = taskCanvas.getContext('2d');
            if (!ctx) throw new Error('Could not create canvas context');

            const originalImage = new Image();
            originalImage.src = element.src;
            await new Promise<void>((resolve, reject) => {
                originalImage.onload = () => resolve();
                originalImage.onerror = reject;
            });

            const drawX = (frame.width / 2) + (element.position.x - frame.position.x) - (element.width / 2);
            const drawY = (frame.height / 2) + (element.position.y - frame.position.y) - (element.height / 2);
            ctx.drawImage(originalImage, drawX, drawY, element.width, element.height);

            const taskImageB64 = taskCanvas.toDataURL('image/png');
            const [header, data] = taskImageB64.split(',');
            const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
            const imagePart = { inlineData: { data, mimeType } };
            const finalPrompt = `This is an outpainting task. The existing image is part of a larger scene. Fill the surrounding transparent areas to naturally and seamlessly extend the image. User guidance: "${prompt || 'Continue the scene naturally.'}"`;
            const textPart = { text: finalPrompt };

            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });

            const part = response.candidates[0].content.parts.find(p => p.inlineData);
            if (!part?.inlineData) throw new Error("AI did not return an image.");
            const newImageSrc = `data:image/png;base64,${part.inlineData.data}`;

            const updatedElement: ImageElement = { ...element, src: newImageSrc, position: { ...frame.position }, width: frame.width, height: frame.height };
            setElements(prev => prev.map(el => el.id === element.id ? updatedElement : el));
        } catch (error) {
            console.error("Error during outpainting:", error);
            alert("Failed to expand the image. Please check the console.");
        } finally {
            setIsGenerating(false);
            setOutpaintingState(null);
        }
    }, [outpaintingState, getAi, setElements]);

    const handleAutoPromptGenerate = useCallback(async (state: OutpaintingState): Promise<string> => {
        const genAI = getAi();
        if (!genAI) {
            throw new Error("AI not initialized.");
        }

        const { element, frame } = state;

        // Create a canvas representing the expansion task
        const taskCanvas = document.createElement('canvas');
        taskCanvas.width = Math.ceil(frame.width);
        taskCanvas.height = Math.ceil(frame.height);
        const ctx = taskCanvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        const originalImage = new Image();
        originalImage.src = element.src;
        await new Promise<void>((resolve, reject) => {
            originalImage.onload = () => resolve();
            originalImage.onerror = reject;
        });

        const drawX = (frame.width / 2) + (element.position.x - frame.position.x) - (element.width / 2);
        const drawY = (frame.height / 2) + (element.position.y - frame.position.y) - (element.height / 2);
        ctx.drawImage(originalImage, drawX, drawY, element.width, element.height);

        const taskImageB64 = taskCanvas.toDataURL('image/png');
        const [header, data] = taskImageB64.split(',');
        const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
        const imagePart = { inlineData: { data, mimeType } };

        const analysisPrompt = "Analyze the provided image, which shows a smaller picture placed on a larger transparent canvas for an expansion task. Based on the picture's content and its placement, infer the user's intent. Generate a concise, direct prompt for another AI to fill the transparent area. For example, if the expansion is below a person, suggest 'add their legs and feet.' If it's to the sides of a landscape, suggest 'expand the beautiful mountain scenery.' The prompt should be short, clear, and contain only the instruction.";
        const textPart = { text: analysisPrompt };

        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const generatedPrompt = response.text.trim();
        if (!generatedPrompt) {
            throw new Error("AI failed to generate a descriptive prompt.");
        }
        return generatedPrompt;
    }, [getAi]);


  const addArrow = useCallback((position?: Point) => {
    const start = position || getTargetPosition();
    const end = { x: start.x + 150, y: start.y };

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const width = Math.sqrt(dx * dx + dy * dy);
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    const centerPosition = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    addElement({
      type: 'arrow',
      start,
      end,
      position: centerPosition,
      width,
      height: 30,
      rotation,
      color: 'text-red-500',
    });
  }, [addElement, getTargetPosition]);
  
  const triggerImageUpload = (position?: Point) => {
    lastImagePosition.current = position || null;
    imageInputRef.current?.click();
  };

  const addImagesToCanvas = useCallback((files: File[], basePosition: Point) => {
    const imagePromises = files.map((file, index) => {
      return new Promise<Omit<ImageElement, 'id' | 'zIndex'> | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          if (!src) return resolve(null);

          const img = new Image();
          img.onload = () => {
            const MAX_DIMENSION = 300;
            let { width, height } = img;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
              if (width > height) {
                height = (height / width) * MAX_DIMENSION;
                width = MAX_DIMENSION;
              } else {
                width = (width / height) * MAX_DIMENSION;
                height = MAX_DIMENSION;
              }
            }
            const position = { x: basePosition.x + index * 20, y: basePosition.y + index * 20 };
            resolve({ type: 'image', position, src, width, height, rotation: 0 });
          };
          img.onerror = () => resolve(null);
          img.src = src;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(results => {
      const newElements = results.filter((el): el is Omit<ImageElement, 'id' | 'zIndex'> => el !== null);
      if (newElements.length > 0) {
        setElements(prev => [
          ...prev,
          ...newElements.map(el => ({
            ...el,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            zIndex: zIndexCounter.current++,
          } as CanvasElement))
        ]);
      }
    });
  }, [setElements]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const position = lastImagePosition.current || getTargetPosition();
    addImagesToCanvas(Array.from(files), position);

    lastImagePosition.current = null;

    if (imageInputRef.current) {
        imageInputRef.current.value = "";
    }
  }, [addImagesToCanvas, getTargetPosition]);
  
  const handleGenerate = useCallback(async (selectedElements: CanvasElement[]) => {
    const genAI = getAi();
    if (!genAI) return;

    const imageElements = selectedElements.filter(el => el.type === 'image' || el.type === 'drawing') as (ImageElement | DrawingElement)[];
    const noteElements = selectedElements.filter(el => el.type === 'note') as NoteElement[];

    if (imageElements.length === 0 && noteElements.length === 0) {
        alert("Please select at least one image, drawing, or note to provide context for generation.");
        return;
    }

    setIsGenerating(true);
    setGeneratedImages(null);
    
    try {
      const instructions = noteElements.map(note => note.content).join(' \n');
      let finalInstructions = instructions;
      if (imageStyle && imageStyle !== 'Default') {
          finalInstructions = instructions ? `${instructions}, ${imageStyle} Style` : `${imageStyle} Style`;
      }

      let parts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[];
      
      if (imageElements.length > 0) { // Editing with existing image(s)
          const imageParts = imageElements.filter(el => el.src).map(el => {
              const [header, data] = el.src.split(',');
              const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
              return { inlineData: { data, mimeType } };
          });

          const promptForEditing = finalInstructions || "Creatively reimagine and enhance the image(s).";
          const textPart = { text: promptForEditing };
          parts = [...imageParts, textPart];

      } else { // Generating new image from text
          const promptText = `Generate a completely new image based on this description: "${finalInstructions}"`;
          const textPart = { text: promptText };
          parts = [textPart];
      }
      
      const generateSingleImage = async () => {
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                imageConfig: {
                    aspectRatio: imageAspectRatio,
                }
            },
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
      };

      const [image1, image2] = await Promise.all([generateSingleImage(), generateSingleImage()]);
      const validImages = [image1, image2].filter((img): img is string => img !== null);
      setGeneratedImages(validImages);

    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image. Please check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  }, [getAi, imageStyle, imageAspectRatio]);


  const handleSelectElement = useCallback((id: string | null, shiftKey: boolean) => {
    if (contextMenu) setContextMenu(null);

    if (id === null) {
      if (!shiftKey) setSelectedElementIds([]);
      return;
    }
    
    const clickedElement = elements.find(el => el.id === id);

    if (clickedElement?.groupId && !shiftKey) {
        const groupMemberIds = elements
            .filter(el => el.groupId === clickedElement.groupId)
            .map(el => el.id);
        setSelectedElementIds(groupMemberIds);
        return;
    }

    setSelectedElementIds(prevIds => {
      if (shiftKey) {
        return prevIds.includes(id) ? prevIds.filter(prevId => prevId !== id) : [...prevIds, id];
      } else {
        return prevIds.includes(id) ? prevIds : [id];
      }
    });
  }, [contextMenu, elements]);

  const handleMarqueeSelect = useCallback((ids: string[], shiftKey: boolean) => {
    setSelectedElementIds(prevIds => {
      if (shiftKey) {
        const newIds = ids.filter(id => !prevIds.includes(id));
        return [...prevIds, ...newIds];
      } else {
        return ids;
      }
    });
  }, []);


  const updateElements = useCallback((updatedElement: CanvasElement, dragDelta?: Point) => {
    setElements(prevElements => {
      if (dragDelta && selectedElementIds.length > 1 && selectedElementIds.includes(updatedElement.id)) {
        const selectedSet = new Set(selectedElementIds);
        return prevElements.map(el => {
          if (el.id === updatedElement.id) {
            return updatedElement;
          }
          if (selectedSet.has(el.id)) {
             return { ...el, position: { x: el.position.x + dragDelta.x, y: el.position.y + dragDelta.y } };
          }
          return el;
        });
      } else {
        return prevElements.map(el => (el.id === updatedElement.id ? updatedElement : el));
      }
    }, { addToHistory: false });
  }, [selectedElementIds, setElements]);
  
  const updateMultipleElements = useCallback((updates: (Partial<CanvasElement> & { id: string })[]) => {
      const updatesMap = new Map(updates.map(u => [u.id, u]));
      setElements(prev => prev.map(el => {
          if (updatesMap.has(el.id)) {
              return { ...el, ...updatesMap.get(el.id) };
          }
          return el;
      }), { addToHistory: false });
  }, [setElements]);

  const handleInteractionEnd = useCallback(() => {
    setElements(currentElements => currentElements, { addToHistory: true });
  }, [setElements]);

  const deleteElement = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.filter(el => !selectedSet.has(el.id)));
    setSelectedElementIds([]);
  }, [selectedElementIds, setElements]);
  
  const getSelectedGroupInfo = useMemo(() => {
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    if (selected.length === 0) return { canGroup: false, canUngroup: false, isGroup: false };

    const groupIds = new Set(selected.map(el => el.groupId).filter(Boolean));
    const hasUngrouped = selected.some(el => !el.groupId);

    const canGroup = selected.length > 1 && !(groupIds.size === 1 && !hasUngrouped);
    const canUngroup = selected.length > 0 && groupIds.size === 1 && !hasUngrouped;

    return { canGroup, canUngroup, isGroup: canUngroup };
  }, [elements, selectedElementIds]);

  const groupElements = useCallback(() => {
    if (!getSelectedGroupInfo.canGroup) return;
    const newGroupId = `group-${Date.now()}`;
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.map(el => 
        selectedSet.has(el.id) ? { ...el, groupId: newGroupId } : el
    ));
  }, [selectedElementIds, setElements, getSelectedGroupInfo.canGroup]);

  const ungroupElements = useCallback(() => {
    if (!getSelectedGroupInfo.canUngroup) return;
    
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    const groupIdToUngroup = selected[0]?.groupId;
    if (!groupIdToUngroup) return;

    setElements(prev => prev.map(el => {
        if (el.groupId === groupIdToUngroup) {
            // FIX: Spreading a discriminated union (`{ ...el }`) can cause TypeScript to widen its type,
            // losing the specific type information. The original implementation grouped all cases, which
            // prevented type narrowing. By handling each element type in a separate case, we ensure `el`
            // is narrowed to its specific type (e.g., NoteElement) before destructuring. This preserves
            // the element's type integrity when removing the `groupId`.
            switch (el.type) {
                case 'note': {
                    const { groupId, ...rest } = el;
                    return rest;
                }
                case 'image': {
                    const { groupId, ...rest } = el;
                    return rest;
                }
                case 'arrow': {
                    const { groupId, ...rest } = el;
                    return rest;
                }
                case 'drawing': {
                    const { groupId, ...rest } = el;
                    return rest;
                }
            }
        }
        return el;
    }));
  }, [elements, selectedElementIds, setElements, getSelectedGroupInfo.canUngroup]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If a modal is open, let it handle its own keyboard shortcuts.
      if (editingDrawing || editingImage || outpaintingState) {
        return;
      }

      const target = e.target as HTMLElement;
      const isEditingText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText) {
        e.preventDefault();
        deleteElement();
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrlOrCmd && !isEditingText) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteElement, undo, redo, editingDrawing, editingImage, outpaintingState]);
  
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
        preventDefaults(e);
        dragCounter.current++;
        if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
            if (Array.from(e.dataTransfer.items).some(item => item.kind === 'file' && item.type.startsWith('image/'))) {
                 setIsDraggingOver(true);
            }
        }
    };
    
    const handleDragLeave = (e: DragEvent) => {
        preventDefaults(e);
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDraggingOver(false);
        }
    };
    
    const handleDrop = (e: DragEvent) => {
        preventDefaults(e);
        dragCounter.current = 0;
        setIsDraggingOver(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0 && canvasApiRef.current) {
            const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

            if (imageFiles.length > 0) {
                const dropPoint = { x: e.clientX, y: e.clientY };
                const worldPoint = canvasApiRef.current.screenToWorld(dropPoint);
                addImagesToCanvas(imageFiles, worldPoint);
            }
        }
    };
    
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
        window.removeEventListener('dragenter', handleDragEnter);
        window.removeEventListener('dragover', preventDefaults);
        window.removeEventListener('dragleave', handleDragLeave);
        window.removeEventListener('drop', handleDrop);
    };
  }, [addImagesToCanvas]);

  const bringToFront = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const maxZ = Math.max(...elements.map(el => el.zIndex), 0);
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.map(el => selectedSet.has(el.id) ? { ...el, zIndex: maxZ + 1 } : el));
    zIndexCounter.current = maxZ + 2;
  }, [selectedElementIds, elements, setElements]);

  const sendToBack = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const minZ = Math.min(...elements.map(el => el.zIndex), 0);
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.map(el => selectedSet.has(el.id) ? { ...el, zIndex: minZ - 1 } : el));
  }, [selectedElementIds, elements, setElements]);

  const getResetViewCallback = useCallback((callback: () => void) => {
    setResetView(() => callback);
  }, []);

  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  const canChangeColor = selectedElements.some(el => el.type === 'note' || el.type === 'arrow');
  const showImageEditInMenu = selectedElements.length === 1 && selectedElements[0].type === 'image';

  const handleColorChange = (newColor: string) => {
      if (!canChangeColor) return;
      const selectedSet = new Set(selectedElementIds);
      setElements(prev => prev.map(el => {
          if (selectedSet.has(el.id)) {
              if (el.type === 'note') return { ...el, color: newColor };
              if (el.type === 'arrow') {
                  const newTextColor = newColor.replace('bg-', 'text-');
                  return { ...el, color: newTextColor };
              }
          }
          return el;
      }));
  };
  
  const downloadGeneratedImage = (imageUrl: string) => {
      if (!imageUrl) return;
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `generated-canvas-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const addGeneratedImageToCanvas = useCallback((imageUrl: string) => {
    if (!imageUrl) return;

    const src = imageUrl;
    const img = new Image();
    img.onload = () => {
      const MAX_DIMENSION = 400;
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_DIMENSION;
          width = MAX_DIMENSION;
        } else {
          width = (width / height) * MAX_DIMENSION;
          height = MAX_DIMENSION;
        }
      }
      addElement({
        type: 'image',
        position: getTargetPosition(),
        src,
        width,
        height,
        rotation: 0,
      });
    };
    img.src = src;
  }, [addElement, getTargetPosition]);

  const downloadImage = useCallback((elementId: string) => {
    if (!elementId) return;
    const element = elements.find(el => el.id === elementId);
    if (element && (element.type === 'image' || element.type === 'drawing') && element.src) {
        const link = document.createElement('a');
        link.href = element.src;
        const mimeType = element.src.match(/data:(.*);base64/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1] || 'png';
        link.download = `canvas-image-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }, [elements]);

  const handleContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent, worldPoint: Point, elementId: string | null) => {
      e.preventDefault();
      
      const point = 'touches' in e ? e.touches[0] : e;
      if (!point) return;

      if (elementId && !selectedElementIds.includes(elementId)) {
        handleSelectElement(elementId, false);
      }
      setContextMenu({ x: point.clientX, y: point.clientY, worldPoint, elementId });

  }, [selectedElementIds, handleSelectElement]);
  
  const handleExportCanvas = () => {
    const elementsWithAnalysis = elements.map(el => {
        const analysis = analysisResults[el.id];
        if (analysis) {
            return { ...el, analysis };
        }
        return el;
    });

    const dataStr = JSON.stringify(elementsWithAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = 'infinite-canvas-export.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result !== 'string') {
                throw new Error("File could not be read as text.");
            }
            const data = JSON.parse(result);
            
            let finalElements: CanvasElement[] = [];
            let finalAnalysisResults: Record<string, AnalysisResult> = {};

            if (Array.isArray(data)) {
                // Handles both old format (array of elements) and new format (array of elements with optional 'analysis' property).
                data.forEach((item: any) => {
                    if (item && typeof item === 'object' && item.id) {
                        const { analysis, ...elementData } = item;
                        finalElements.push(elementData as CanvasElement);
                        if (analysis) {
                            finalAnalysisResults[item.id] = analysis;
                        }
                    }
                });
            } else if (data && typeof data === 'object' && Array.isArray(data.elements)) {
                // Handles the intermediate format: { elements: [], analysisResults: {} }
                finalElements = data.elements;
                finalAnalysisResults = data.analysisResults || {};
            } else {
                throw new Error("Invalid or unsupported file format.");
            }
            
            if (finalElements.length > 0 && finalElements.some(el => typeof el.id === 'undefined')) {
                throw new Error("Invalid file format: some elements are missing the 'id' property.");
            }
            
            setElements(finalElements);
            setAnalysisResults(finalAnalysisResults);
            setAnalysisVisibility({}); // Always reset transient visibility state
            
            const maxZ = Math.max(0, ...finalElements.map(el => el.zIndex || 0));
            zIndexCounter.current = maxZ + 1;

            alert('Canvas imported successfully!');
        } catch (error) {
            const err = error as Error;
            console.error("Error importing canvas:", err);
            alert(`Failed to import canvas. ${err.message}`);
        }
    };
    reader.onerror = () => {
        alert("Error reading file.");
    };
    reader.readAsText(file);

    if (event.target) {
        event.target.value = "";
    }
  };

  const duplicateElement = useCallback((elementId: string) => {
    const elementToDuplicate = elements.find(el => el.id === elementId);
    if (!elementToDuplicate) return;

    const commonProperties = {
        position: {
            x: elementToDuplicate.position.x + 20,
            y: elementToDuplicate.position.y + 20,
        },
        width: elementToDuplicate.width,
        height: elementToDuplicate.height,
        rotation: elementToDuplicate.rotation,
    };

    let newElement: Omit<NoteElement, 'id' | 'zIndex'> | Omit<ImageElement, 'id' | 'zIndex'> | Omit<DrawingElement, 'id' | 'zIndex'> | Omit<ArrowElement, 'id' | 'zIndex'>;

    switch (elementToDuplicate.type) {
        case 'note':
            newElement = {
                ...commonProperties,
                type: 'note',
                content: elementToDuplicate.content,
                color: elementToDuplicate.color,
                textAlign: elementToDuplicate.textAlign,
            };
            break;
        case 'image':
            newElement = {
                ...commonProperties,
                type: 'image',
                src: elementToDuplicate.src,
            };
            break;
        case 'drawing':
            newElement = {
                ...commonProperties,
                type: 'drawing',
                src: elementToDuplicate.src,
            };
            break;
        case 'arrow':
            newElement = {
                ...commonProperties,
                type: 'arrow',
                start: { x: elementToDuplicate.start.x + 20, y: elementToDuplicate.start.y + 20 },
                end: { x: elementToDuplicate.end.x + 20, y: elementToDuplicate.end.y + 20 },
                color: elementToDuplicate.color,
            };
            break;
        default:
            return;
    }
    addElement(newElement);
  }, [elements, addElement]);

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
        const target = event.target as HTMLElement;
        const isEditingText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if(isEditingText) return;

        event.preventDefault();
        const items = event.clipboardData?.items;
        if (!items) return;

        const position = getTargetPosition();

        // Prefer images over text
        const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
        if (imageItem) {
            const file = imageItem.getAsFile();
            if (file) {
                addImagesToCanvas([file], position);
            }
            return;
        }
        
        const textItem = Array.from(items).find(item => item.type === 'text/plain');
        if (textItem) {
            textItem.getAsString(text => {
                 addElement({
                    type: 'note',
                    position: position,
                    width: 200,
                    height: 150,
                    rotation: 0,
                    content: text,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)].bg,
                });
            });
        }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addElement, addImagesToCanvas, getTargetPosition]);

    const handleAnalyzeElement = useCallback(async (elementId: string) => {
        const genAI = getAi();
        if (!genAI) return;

        const element = elements.find(el => el.id === elementId);
        if (!element || (element.type !== 'image' && element.type !== 'drawing') || !element.src) {
            return;
        }

        setAnalyzingElementId(elementId);
        try {
            const [header, data] = element.src.split(',');
            const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
            const imagePart = { inlineData: { data, mimeType } };
    
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { 
                    parts: [
                        imagePart,
                        { text: "Analyze this image. Provide a detailed description and 2-3 creative style or composition suggestions to help optimize a prompt for image generation." }
                    ] 
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            description: {
                                type: Type.STRING,
                                description: 'A detailed description of the objects, scene, and actions in the image.'
                            },
                            suggestions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.STRING
                                },
                                description: 'An array of 2-3 creative style or composition suggestions.'
                            }
                        }
                    }
                }
            });
    
            const resultJson = JSON.parse(response.text);
            setAnalysisResults(prev => ({
                ...prev,
                [elementId]: {
                    en: {
                        description: resultJson.description,
                        suggestions: resultJson.suggestions
                    }
                }
            }));
            setAnalysisVisibility(prev => ({ ...prev, [elementId]: true }));

        } catch (error) {
            console.error("Error analyzing element:", error);
            alert("Failed to analyze the draft. Please check the console.");
        } finally {
            setAnalyzingElementId(null);
        }
    }, [getAi, elements]);

    const handleOptimizeNotePrompt = useCallback(async (elementId: string) => {
        const genAI = getAi();
        if (!genAI) return;
    
        const element = elements.find(el => el.id === elementId);
        if (!element || element.type !== 'note' || !element.content.trim()) {
            return;
        }
    
        setAnalyzingElementId(elementId);
        try {
            const userPrompt = element.content;
            const systemInstruction = `You are a prompt engineering expert for image generation AIs. Optimize the user-provided text into a high-quality, descriptive prompt. Provide one main, enhanced prompt as 'description'. Then, provide 2-3 creative variations or style suggestions as an array of strings in 'suggestions'. The suggestions should be complete, standalone prompts or significant stylistic additions. Respond ONLY with a valid JSON object matching the specified schema.`;
            
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            description: {
                                type: Type.STRING,
                                description: 'The main, optimized, and detailed image generation prompt.'
                            },
                            suggestions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.STRING
                                },
                                description: 'An array of 2-3 creative variations or alternative prompts.'
                            }
                        }
                    }
                }
            });
    
            const resultJson = JSON.parse(response.text);
            setAnalysisResults(prev => ({
                ...prev,
                [elementId]: {
                    en: {
                        description: resultJson.description,
                        suggestions: resultJson.suggestions
                    }
                }
            }));
            setAnalysisVisibility(prev => ({ ...prev, [elementId]: true }));
    
        } catch (error) {
            console.error("Error optimizing prompt:", error);
            alert("Failed to optimize the prompt. Please check the console.");
        } finally {
            setAnalyzingElementId(null);
        }
    }, [getAi, elements]);

    const handleToggleAnalysisVisibility = useCallback((elementId: string) => {
        setAnalysisVisibility(prev => ({
          ...prev,
          [elementId]: !prev[elementId]
        }));
      }, []);
    
      const handleClearAnalysis = useCallback((elementId: string) => {
        setAnalysisResults(prev => {
          const next = { ...prev };
          delete next[elementId];
          return next;
        });
        setAnalysisVisibility(prev => {
          const next = { ...prev };
          delete next[elementId];
          return next;
        });
      }, []);

    const handleTranslateAnalysis = useCallback(async (elementId: string) => {
        const genAI = getAi();
        if (!genAI) return;

        const analysis = analysisResults[elementId];
        if (!analysis || analysis.zh) return;
        
        setTranslatingElementId(elementId);
        try {
            const textToTranslate = JSON.stringify(analysis.en);
            const prompt = `Translate the following JSON object's 'description' and 'suggestions' values into Traditional Chinese (繁體中文). Maintain the exact JSON structure and keys. Do not add any extra text or explanations outside the JSON object.\n\n${textToTranslate}`;

            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });
            const translatedJson = JSON.parse(response.text);

            setAnalysisResults(prev => ({
                ...prev,
                [elementId]: {
                    ...prev[elementId],
                    zh: translatedJson,
                }
            }));

        } catch (error) {
            console.error("Error translating analysis:", error);
            alert("Failed to translate the analysis. Please check the console.");
        } finally {
            setTranslatingElementId(null);
        }
    }, [getAi, analysisResults]);


  const contextMenuElement = contextMenu?.elementId ? elements.find(el => el.id === contextMenu.elementId) : null;

  return (
    <main className="relative w-screen h-screen bg-gray-100 font-sans" onClick={() => setContextMenu(null)}>
      <div 
        className={`absolute top-4 z-20 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 w-64 flex flex-col gap-4 transition-transform duration-300 ease-in-out ${isMenuCollapsed ? (panelAlignment === 'left' ? '-translate-x-full' : 'translate-x-full') : 'translate-x-0'} ${panelAlignment === 'left' ? 'left-4' : 'right-4'}`}
      >
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('infiniteCanvas')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('selectObjectToTransform')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addNote()} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors col-span-1">{t('addNote')}</button>
            <button onClick={() => addArrow()} className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors col-span-1">{t('addArrow')}</button>
            <button onClick={() => addDrawing()} className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors col-span-2">{t('addDrawing')}</button>
            <label className="cursor-pointer px-3 py-2 text-sm text-center bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors col-span-2">
                {t('addImages')}
                <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageUpload} multiple />
            </label>
        </div>

        {showImageEditInMenu && (
            <div className="border-t pt-3 mt-1 flex flex-col gap-2">
                <h2 className="text-md font-semibold text-gray-700 mb-1">{t('imageEdit')}</h2>
                <button
                    onClick={() => handleStartImageEdit(selectedElementIds[0])}
                    className="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
                >
                    {t('removeOrEditObject')}
                </button>
                <button
                    onClick={() => handleStartOutpainting(selectedElementIds[0])}
                    className="w-full px-3 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-colors"
                >
                    {t('expandImage')}
                </button>
            </div>
        )}

        {selectedElementIds.length > 0 && canChangeColor && (
            <div className="border-t pt-3 mt-1">
                <h2 className="text-md font-semibold text-gray-700 mb-2">{t('color')}</h2>
                <div className="grid grid-cols-8 gap-1.5">
                    {COLORS.map(color => (
                        <button
                            key={color.name}
                            onClick={() => handleColorChange(color.bg)}
                            className={`w-6 h-6 rounded-full border-2 ${color.bg} border-white`}
                            aria-label={`Change color to ${color.name}`}
                        />
                    ))}
                </div>
            </div>
        )}
        
         <div className="flex flex-col gap-2 border-t pt-3 mt-1">
            <h2 className="text-md font-semibold text-gray-700">{t('settings')}</h2>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={toggleLanguage} className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">{t('changeLanguage')}</button>
                <button onClick={() => setPanelAlignment(p => p === 'left' ? 'right' : 'left')} className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">{panelAlignment === 'left' ? t('alignPanelRight') : t('alignPanelLeft')}</button>
             </div>
         </div>


         <div className="flex flex-col gap-2 border-t pt-3 mt-3">
            <h2 className="text-md font-semibold text-gray-700">{t('controls')}</h2>
            <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('interactionMode')}</h3>
                <div className="w-full bg-gray-200 rounded-md p-1 grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setInteractionMode('pan')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${interactionMode === 'pan' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600 hover:bg-white/50'}`}
                    >
                      {t('panMode')}
                    </button>
                    <button
                      onClick={() => setInteractionMode('select')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${interactionMode === 'select' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600 hover:bg-white/50'}`}
                    >
                      {t('selectMode')}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={handleExportCanvas} className="px-3 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">{t('export')}</button>
                <label className="cursor-pointer text-center px-3 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">
                    {t('import')}
                    <input type="file" accept=".json" ref={importInputRef} className="hidden" onChange={handleImportCanvas} />
                </label>
                <button onClick={deleteElement} disabled={selectedElementIds.length === 0} className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{t('delete')}</button>
                <button onClick={undo} disabled={!canUndo} className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{t('undo')}</button>
                <button onClick={redo} disabled={!canRedo} className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{t('redo')}</button>
                <button onClick={groupElements} disabled={!getSelectedGroupInfo.canGroup} className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{t('group')}</button>
                <button onClick={ungroupElements} disabled={!getSelectedGroupInfo.canUngroup} className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{t('ungroup')}</button>
                <button onClick={bringToFront} disabled={selectedElementIds.length === 0} className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{t('bringToFront')}</button>
                <button onClick={sendToBack} disabled={selectedElementIds.length === 0} className="px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{t('sendToBack')}</button>
                <button onClick={resetView} className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors">{t('resetView')}</button>
            </div>
        </div>
      </div>
      
      <button
        onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
        className="absolute top-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300 ease-in-out"
        style={{ [panelAlignment]: isMenuCollapsed ? '1rem' : 'calc(1rem + 16rem + 0.5rem)' }}
        aria-label={isMenuCollapsed ? 'Expand menu' : 'Collapse menu'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {panelAlignment === 'left' ? (
                isMenuCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                )
            ) : (
                 isMenuCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                )
            )}
        </svg>
      </button>

      <InfiniteCanvas 
        ref={canvasApiRef}
        elements={elements} 
        selectedElementIds={selectedElementIds}
        onSelectElement={handleSelectElement}
        onMarqueeSelect={handleMarqueeSelect}
        onUpdateElement={updateElements}
        onUpdateMultipleElements={updateMultipleElements}
        onInteractionEnd={handleInteractionEnd}
        setResetViewCallback={getResetViewCallback} 
        onGenerate={handleGenerate}
        onContextMenu={handleContextMenu}
        onEditDrawing={handleEditDrawing}
        onMouseMove={handleCanvasMouseMove}
        onViewportChange={handleViewportChange}
        imageStyle={imageStyle}
        onSetImageStyle={setImageStyle}
        imageAspectRatio={imageAspectRatio}
        onSetImageAspectRatio={setImageAspectRatio}
        outpaintingState={outpaintingState}
        onUpdateOutpaintingFrame={handleUpdateOutpaintingFrame}
        onCancelOutpainting={handleCancelOutpainting}
        onOutpaintingGenerate={handleOutpaintingGenerate}
        onAutoPromptGenerate={handleAutoPromptGenerate}
        interactionMode={interactionMode}
        t={t}
        language={language}
        analysisResults={analysisResults}
        analyzingElementId={analyzingElementId}
        onAnalyzeElement={handleAnalyzeElement}
        onOptimizeNotePrompt={handleOptimizeNotePrompt}
        analysisVisibility={analysisVisibility}
        onToggleAnalysisVisibility={handleToggleAnalysisVisibility}
        onClearAnalysis={handleClearAnalysis}
        onTranslateAnalysis={handleTranslateAnalysis}
        translatingElementId={translatingElementId}
      />

      <Minimap
        elements={elements}
        viewport={viewport}
        onPanTo={handlePanTo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      {isGenerating && (
        <div className="absolute inset-0 z-30 bg-black/50 flex flex-col items-center justify-center text-white">
            <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-semibold">{t('generatingImages')}</p>
            <p className="text-sm">{t('thisMayTakeAMoment')}</p>
        </div>
      )}

      {generatedImages && generatedImages.length > 0 && (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center p-4" onClick={() => setGeneratedImages(null)}>
          <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{t('chooseAnImage')}</h2>
              <button onClick={() => setGeneratedImages(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              {generatedImages.map((imgSrc, index) => (
                <div key={index} className="border rounded-lg p-2 flex flex-col gap-2">
                  <div className="bg-gray-100 rounded-md flex items-center justify-center flex-grow">
                     <img src={imgSrc} alt={`Generated by AI ${index + 1}`} className="w-full h-auto object-contain rounded-md max-h-[60vh]" />
                  </div>
                  <div className="flex-shrink-0 mt-auto flex justify-center gap-2">
                    <button onClick={() => addGeneratedImageToCanvas(imgSrc)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors">{t('addToCanvas')}</button>
                    <button onClick={() => downloadGeneratedImage(imgSrc)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors">{t('download')}</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2 flex-shrink-0">
              <button onClick={() => setGeneratedImages(null)} className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('close')}</button>
            </div>
          </div>
        </div>
      )}
      
      {editingDrawing && (
        <DrawingModal 
          element={editingDrawing}
          onSave={handleSaveDrawing}
          onClose={() => setEditingDrawing(null)}
          t={t}
        />
      )}

      {editingImage && (
        <ImageEditModal
          element={editingImage}
          onSave={handleSaveImageEdit}
          onClose={() => setEditingImage(null)}
          ai={getAi()}
          t={t}
        />
      )}

      {contextMenu && (
        <ContextMenu
          menuData={contextMenu}
          onClose={() => setContextMenu(null)}
          actions={{
            addNote,
            addArrow,
            addDrawing,
            editDrawing: handleEditDrawing,
            startImageEdit: handleStartImageEdit,
            startOutpainting: handleStartOutpainting,
            addImage: triggerImageUpload,
            deleteElement,
            bringToFront,
            sendToBack,
            changeColor: handleColorChange,
            downloadImage,
            duplicateElement,
            toggleLanguage,
            groupElements,
            ungroupElements,
          }}
          canChangeColor={canChangeColor}
          canGroup={getSelectedGroupInfo.canGroup}
          canUngroup={getSelectedGroupInfo.canUngroup}
          elementType={contextMenuElement?.type || null}
          t={t}
        />
      )}

      {isDraggingOver && (
        <div className="absolute inset-0 z-[100] bg-black/50 flex items-center justify-center pointer-events-none">
          <div className="text-white text-2xl font-bold p-8 border-4 border-dashed rounded-lg bg-gray-800/50">
            Drop images to add to canvas
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
