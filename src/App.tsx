import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ConfigProvider,
  Button,
  Slider,
  Upload,
  message,
  Modal,
  theme as antTheme,
} from "antd";
import {
  Upload as UploadIcon,
  Zap,
  Download,
  Pipette,
  Image as ImageIcon,
  Check,
  Crop as CropIcon,
  Scissors,
  Info,
  Github,
  Heart,
} from "lucide-react";
import type { UploadProps } from "antd/es/upload/interface";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";

const { Dragger } = Upload;

// --- Helper Functions ---
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Main App Component ---
const App: React.FC = () => {
  // --- State ---
  // NEW FLOW: upload -> erase -> crop -> export
  const [step, setStep] = useState<"upload" | "erase" | "crop">("upload");

  // Modals
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isOpenSourceModalOpen, setIsOpenSourceModalOpen] = useState(false);

  // Image Data
  const [originalFileSrc, setOriginalFileSrc] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null,
  );
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  // Color Removal
  const [targetColor, setTargetColor] = useState<{
    r: number;
    g: number;
    b: number;
  }>({ r: 255, g: 255, b: 255 });
  const [tolerance, setTolerance] = useState<number>(20);
  const [isPickMode, setIsPickMode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Cropping
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  // Debounce
  const debouncedTolerance = useDebounce(tolerance, 150);
  const debouncedTargetColor = useDebounce(targetColor, 100);

  // Refs
  const eraserImgRef = useRef<HTMLImageElement | null>(null);

  // --- Logic: 1. Upload ---
  const handleUpload: UploadProps["onChange"] = (info) => {
    const file = info.file.originFileObj;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const result = e.target.result as string;
          setOriginalFileSrc(result);

          // Load and auto-sample
          const img = new Image();
          img.onload = () => {
            eraserImgRef.current = img;
            const c = document.createElement("canvas");
            const cx = c.getContext("2d");
            if (cx) {
              c.width = 1;
              c.height = 1;
              cx.drawImage(img, 0, 0);
              const [r, g, b] = cx.getImageData(0, 0, 1, 1).data;
              setTargetColor({ r, g, b });
            }
          };
          img.src = result;

          setStep("erase");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Logic: 2. Erase (Background Removal) ---
  const processImage = useCallback(() => {
    if (!eraserImgRef.current || !originalFileSrc) return;

    setIsProcessing(true);
    requestAnimationFrame(() => {
      const img = eraserImgRef.current!;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const { r: tr, g: tg, b: tb } = debouncedTargetColor;
      const tolSq = debouncedTolerance * debouncedTolerance;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const distSq = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2;

        if (distSq < tolSq) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImageUrl(canvas.toDataURL("image/png"));
      setIsProcessing(false);
    });
  }, [originalFileSrc, debouncedTargetColor, debouncedTolerance]);

  useEffect(() => {
    if (step === "erase" && originalFileSrc && eraserImgRef.current) {
      processImage();
    }
  }, [
    debouncedTolerance,
    debouncedTargetColor,
    originalFileSrc,
    step,
    processImage,
  ]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isPickMode || !eraserImgRef.current) return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(eraserImgRef.current, -(x * scaleX), -(y * scaleY));
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      setTargetColor({ r, g, b });
      setIsPickMode(false);
      message.success(`Picked: rgb(${r}, ${g}, ${b})`);
    }
  };

  // --- Logic: 3. Crop (After Erase) ---
  const goToCrop = () => {
    if (processedImageUrl) {
      setStep("crop");
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1)); // Free aspect
  };

  const performCrop = async () => {
    if (completedCrop && imgRef.current && processedImageUrl) {
      const image = imgRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = "high";

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;

      ctx.translate(-cropX, -cropY);
      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
      );

      const base64Crop = canvas.toDataURL("image/png");
      setCroppedImageUrl(base64Crop);
      message.success("Cropped! Ready to export.");
    } else {
      // No crop selected -> use the processed image as is
      setCroppedImageUrl(processedImageUrl);
      message.success("Ready to export!");
    }
  };

  const clearAll = () => {
    setStep("upload");
    setOriginalFileSrc(null);
    setProcessedImageUrl(null);
    setCroppedImageUrl(null);
    setTargetColor({ r: 255, g: 255, b: 255 });
    setCrop(undefined);
    setCompletedCrop(undefined);
    eraserImgRef.current = null;
  };

  const downloadImage = () => {
    const urlToDownload = croppedImageUrl || processedImageUrl;
    if (urlToDownload) {
      const link = document.createElement("a");
      link.download = "pure-eraser-export.png";
      link.href = urlToDownload;
      link.click();
    }
  };

  // --- Render ---
  const customTheme = {
    algorithm: antTheme.darkAlgorithm,
    token: {
      colorPrimary: "#3b82f6",
      fontFamily: "Inter, sans-serif",
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      <div className="flex flex-col-reverse md:flex-row h-dvh w-full bg-background overflow-hidden text-slate-100 font-sans">
        {/* SIDEBAR */}
        <aside className="w-full md:w-80 bg-surface border-t md:border-t-0 md:border-r border-slate-700 flex flex-col p-4 md:p-6 z-10 shadow-xl shrink-0 h-auto md:h-full max-h-[40vh] md:max-h-full overflow-hidden">
          {/* Brand - Hidden on mobile to save space, or kept small */}
          <div className="hidden md:flex items-center gap-3 mb-8 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg">
              <Zap size={24} className="text-white fill-current" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              PureEraser
            </h1>
            <div
              className="ml-auto text-slate-400 hover:text-white cursor-pointer transition-colors"
              onClick={() => setIsTutorialOpen(true)}
            >
              <Info size={20} />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 md:gap-6 overflow-y-auto custom-scrollbar">
            {/* Dynamic Sidebar Content Based on Step */}
            {step === "upload" && (
              <div className="text-slate-400 text-sm animate-fade-in">
                <p>Upload an image to start removing its background.</p>
              </div>
            )}

            {step === "erase" && (
              <div className="flex flex-col gap-8 animate-slide-up">
                {/* Pick Color Control */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Target Color
                  </h3>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl shadow-lg border-2 border-slate-600 transition-all duration-300"
                      style={{
                        backgroundColor: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`,
                      }}
                    />
                    <Button
                      type={isPickMode ? "primary" : "default"}
                      className={`flex-1 h-12 transition-all duration-300 ${isPickMode ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900" : ""}`}
                      icon={<Pipette size={18} />}
                      onClick={() => setIsPickMode(!isPickMode)}
                    >
                      {isPickMode ? "Picking..." : "Pick Color"}
                    </Button>
                  </div>
                  {isPickMode && (
                    <p className="text-xs text-blue-400 animate-pulse">
                      Click on the original image to sample.
                    </p>
                  )}
                </div>

                {/* Tolerance Control */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tolerance
                    </h3>
                    <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
                      {tolerance}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={200}
                    value={tolerance}
                    onChange={setTolerance}
                    className="hover:scale-105 transition-transform"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium uppercase">
                    <span>Strict</span>
                    <span>Loose</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-700 flex flex-col gap-3">
                  <Button
                    type="primary"
                    size="large"
                    icon={<Scissors size={18} />}
                    onClick={goToCrop}
                    disabled={!processedImageUrl}
                    className={`h-12 font-bold shadow-lg transition-all duration-300 ${processedImageUrl ? "hover:scale-105" : ""}`}
                  >
                    Continue to Crop
                  </Button>
                  <Button
                    type="text"
                    className="text-slate-500 hover:text-slate-300"
                    onClick={clearAll}
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            )}

            {step === "crop" && (
              <div className="flex flex-col gap-4 animate-slide-up">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Crop & Export
                </h3>
                <p className="text-slate-400 text-sm">
                  Drag on the image to select the final area.
                </p>

                <Button
                  type="primary"
                  size="large"
                  icon={<Check size={18} />}
                  onClick={performCrop}
                  className="bg-blue-600 hover:bg-blue-500 h-12 font-medium shadow-md transition-all hover:scale-105"
                >
                  Apply Crop
                </Button>

                <Button
                  type="primary"
                  size="large"
                  icon={<Download size={18} />}
                  onClick={downloadImage}
                  disabled={!croppedImageUrl && !processedImageUrl}
                  className={`h-12 font-bold shadow-lg transition-all duration-300 bg-green-600 hover:bg-green-500 ${croppedImageUrl ? "hover:scale-105" : ""}`}
                >
                  Export PNG
                </Button>

                <Button
                  type="text"
                  danger
                  onClick={() => setStep("erase")}
                  className="opacity-80 hover:opacity-100"
                >
                  Back to Erase
                </Button>
                <Button
                  type="text"
                  className="text-slate-500 hover:text-slate-300"
                  onClick={clearAll}
                >
                  Start Over
                </Button>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 text-xs text-slate-500 text-center flex flex-col gap-2">
            <div>v1.1.0 • PureEraser</div>
            <div className="flex items-center justify-center gap-1">
              Made with{" "}
              <Heart size={12} className="text-red-500 fill-current" /> by{" "}
              <a
                href="https://www.instagram.com/bilel.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                @bilel.it
              </a>
            </div>
            <div
              className="flex items-center justify-center gap-1 cursor-pointer hover:text-white transition-colors"
              onClick={() => setIsOpenSourceModalOpen(true)}
            >
              <Github size={12} />
              <span>Open Source</span>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 relative flex flex-col h-full bg-[#0B1120] overflow-hidden">
          {/* Mobile Info Button */}
          <div className="md:hidden absolute top-4 left-4 z-50">
            <div
              className="text-slate-200 cursor-pointer drop-shadow-md hover:text-white transition-colors"
              onClick={() => setIsTutorialOpen(true)}
            >
              <Info size={24} />
            </div>
          </div>

          {step === "upload" && (
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-10 animate-fade-in">
              <div className="w-full max-w-xl h-64 md:h-96 border-4 border-dashed border-slate-700 rounded-3xl flex items-center justify-center hover:border-blue-500/50 hover:bg-slate-800/30 transition-all duration-500 group cursor-pointer overflow-hidden relative">
                <Dragger
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple={false}
                  showUploadList={false}
                  onChange={handleUpload}
                  className="w-full h-full absolute inset-0 opacity-0 z-10 cursor-pointer"
                ></Dragger>
                <div className="text-center space-y-4 pointer-events-none group-hover:scale-105 transition-transform duration-500">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors duration-500 shadow-xl">
                    <UploadIcon
                      size={32}
                      className="text-slate-400 group-hover:text-white transition-colors"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Drop your image here
                  </h2>
                  <p className="text-slate-500">JPG, PNG, WEBP supported</p>
                </div>
              </div>
            </div>
          )}

          {step === "erase" && originalFileSrc && (
            <div className="h-full flex flex-col p-4 md:p-6 animate-fade-in overflow-y-auto md:overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-slate-400 shrink-0">
                <Zap size={16} />
                <span className="text-sm font-medium uppercase tracking-widest">
                  Step 1: Remove Background
                </span>
                {/* Mobile Brand for context */}
                <div className="md:hidden ml-auto font-bold text-white flex items-center gap-2">
                  PureEraser
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-h-0">
                {/* Source Panel */}
                <div className="flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500 group h-64 md:h-auto">
                  <div className="p-3 md:p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/80 backdrop-blur">
                    <ImageIcon size={16} className="text-blue-400" />
                    <span className="text-sm font-semibold text-slate-300">
                      Original
                    </span>
                  </div>
                  <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden cursor-crosshair bg-slate-950">
                    <img
                      src={originalFileSrc}
                      alt="Source"
                      className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      style={{ cursor: isPickMode ? "crosshair" : "default" }}
                      onClick={handleImageClick}
                    />
                    {isPickMode && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded-full text-xs text-white font-medium z-20 pointer-events-none whitespace-nowrap">
                        Click to pick color
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Panel */}
                <div className="flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500 h-64 md:h-auto">
                  <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/80 backdrop-blur">
                    <Zap size={16} className="text-purple-400" />
                    <span className="text-sm font-semibold text-slate-300">
                      Result
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-4 checkerboard-bg overflow-hidden relative">
                    {processedImageUrl ? (
                      <img
                        src={processedImageUrl}
                        alt="Result"
                        className={`max-w-full max-h-full object-contain transition-all duration-300 ${isProcessing ? "opacity-50 scale-95 blur-sm" : "opacity-100 scale-100 blur-0"}`}
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center gap-2 animate-pulse">
                        <Zap size={24} />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "crop" && processedImageUrl && (
            <div className="h-full flex flex-col p-4 md:p-8 animate-fade-in relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <CropIcon size={16} />
                <span className="text-sm font-medium uppercase tracking-widest">
                  Step 2: Crop & Export
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm p-8 checkerboard-bg">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                >
                  <img
                    ref={imgRef}
                    src={processedImageUrl}
                    onLoad={onImageLoad}
                    alt="Crop Source"
                    className="max-h-[70vh] shadow-2xl rounded-sm"
                  />
                </ReactCrop>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Tutorial Modal */}
      <Modal
        title="How to use PureEraser"
        open={isTutorialOpen}
        onCancel={() => setIsTutorialOpen(false)}
        footer={null}
        centered
        className="custom-modal"
      >
        <div className="space-y-4 pt-4 text-white">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Upload Image:</strong> Drag & drop or click to upload your
              image.
            </li>
            <li>
              <strong>Remove Background:</strong> The app will auto-detect the
              background color. Use the "Pick Color" tool if needed. Adjust
              "Tolerance" to fine-tune.
            </li>
            <li>
              <strong>Crop:</strong> Click "Continue to Crop" to refine the
              image boundaries.
            </li>
            <li>
              <strong>Export:</strong> Download your transparent PNG!
            </li>
          </ol>
        </div>
      </Modal>

      {/* Open Source Modal */}
      <Modal
        title="Open Source"
        open={isOpenSourceModalOpen}
        onCancel={() => setIsOpenSourceModalOpen(false)}
        footer={null}
        centered
        className="custom-modal"
      >
        <div className="space-y-4 pt-4 text-slate-800 dark:text-slate-200 flex flex-col items-center text-center">
          <Github
            size={48}
            className="text-slate-700 dark:text-slate-300 mb-2"
          />
          <h3 className="text-lg font-bold">PureEraser is Open Source!</h3>
          <p className="text-slate-500">
            Check out the code, contribute, or leave a star on our repository.
          </p>
          <Button
            type="primary"
            href="https://github.com/bmessaoudi/pure-eraser"
            target="_blank"
            icon={<Github size={16} />}
            className="w-full"
          >
            Visit Repository
          </Button>

          <div className="w-full border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
            <h4 className="text-sm font-semibold mb-2 text-slate-500">
              Tech Stack
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs">
                React
              </span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100 rounded text-xs">
                TypeScript
              </span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 rounded text-xs">
                Vite
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded text-xs">
                Ant Design
              </span>
              <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-100 rounded text-xs">
                TailwindCSS
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default App;
