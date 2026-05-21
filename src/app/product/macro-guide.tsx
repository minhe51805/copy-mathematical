"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Tv,
  ArrowRight,
  RotateCcw,
  Sparkles,
  PartyPopper,
  CheckCircle2,
  FileCode,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MACRO_CODE = `Sub EditPaste()
    Dim startPos As Long
    Dim endPos As Long
    Dim pastedRange As Range
    
    On Error GoTo NormalPaste
    
    startPos = Selection.Start
    
    Selection.Paste

    endPos = Selection.End
    
    Set pastedRange = ActiveDocument.Range(startPos, endPos)
   
    If pastedRange.OMaths.count > 0 Then
  
        pastedRange.Select
        
        Application.Run "MTCommand_ConvertEqns"
    End If
    Exit Sub

NormalPaste:
    On Error Resume Next
    Selection.Paste
End Sub

Sub EditPasteSpecial()
    Dim startPos As Long
    Dim endPos As Long
    Dim pastedRange As Range
    
    On Error GoTo NormalPasteSpecial
    
    startPos = Selection.Start
    
    Dialogs(wdDialogEditPasteSpecial).Show
    
    endPos = Selection.End
    Set pastedRange = ActiveDocument.Range(startPos, endPos)
    
    If pastedRange.OMaths.count > 0 Then
        pastedRange.Select
        Application.Run "MTCommand_ConvertEqns"
    End If
    Exit Sub

NormalPasteSpecial:
    On Error Resume Next
    Dialogs(wdDialogEditPasteSpecial).Show
End Sub`;

function TutorialTooltip({
  text,
  position,
  arrowDir = "left",
}: {
  text: string;
  position: string;
  arrowDir?: "left" | "right" | "top" | "bottom";
}) {
  const arrowCls = {
    left: "absolute -left-1.5 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-ring/30",
    right: "absolute -right-1.5 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-ring/30",
    top: "absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-b-4 border-b-ring/30",
    bottom: "absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-ring/30",
  }[arrowDir];

  return (
    <div className={`absolute ${position} z-30 bg-card/95 border border-ring/30 text-foreground rounded-lg p-2.5 shadow-md text-[10px] max-w-[170px] leading-relaxed transition-all duration-300`}>
      <div className={arrowCls} />
      <div className="flex items-start gap-1.5">
        <span className="w-1.5 h-1.5 mt-1 rounded-full bg-ring shrink-0 animate-pulse" />
        <p className="font-medium text-foreground">{text}</p>
      </div>
    </div>
  );
}

export function WordMacroGuide() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [timeIndex, setTimeIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const codeCardRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MACRO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy macro code: ", err);
    }
  };

  const handleToggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState) {
      setTimeout(() => {
        codeCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  // Manual navigation pauses the auto-play
  const handleManualStep = (stepNum: number) => {
    setIsPlaying(false);
    setTimeIndex(0);
    setActiveStep(stepNum);
  };

  // Simulated keyboard key press states based on play timeline
  const isAltPressed = isPlaying && timeIndex >= 44 && timeIndex < 52;
  const isF11Pressed = isPlaying && timeIndex >= 46 && timeIndex < 52;
  const isCtrlPressed = isPlaying && timeIndex >= 79 && timeIndex < 88;
  const isSPressed = isPlaying && timeIndex >= 81 && timeIndex < 88;

  // Map timeline tick (100ms units) to states (mouse position, clicked state, active step)
  let currentStep = activeStep;
  let mouseTop = "70%";
  let mouseLeft = "80%";
  let mouseVisible = false;
  let mouseClicked = false;

  if (isPlaying) {
    if (timeIndex < 22) {
      currentStep = 1;
      mouseVisible = true;
      if (timeIndex < 5) {
        mouseTop = "70%";
        mouseLeft = "80%";
      } else if (timeIndex < 15) {
        // Linear interpolation from (70%, 80%) to (20%, 23.3%) - target desktop Word icon
        const ratio = (timeIndex - 5) / 10;
        mouseTop = `${70 + (20 - 70) * ratio}%`;
        mouseLeft = `${80 + (23.3 - 80) * ratio}%`;
      } else {
        mouseTop = "20%";
        mouseLeft = "23.3%";
        if (timeIndex >= 15 && timeIndex <= 18) {
          mouseClicked = true;
        }
      }
    } else if (timeIndex < 39) {
      currentStep = 2;
      mouseVisible = true;
      if (timeIndex < 32) {
        // Interpolate from (20%, 23.3%) to (25%, 14%) - target Word templates Blank Document
        const ratio = (timeIndex - 22) / 10;
        mouseTop = `${20 + (25 - 20) * ratio}%`;
        mouseLeft = `${23.3 + (14 - 23.3) * ratio}%`;
      } else {
        mouseTop = "25%";
        mouseLeft = "14%";
        if (timeIndex >= 32 && timeIndex <= 35) {
          mouseClicked = true;
        }
      }
    } else if (timeIndex < 56) {
      currentStep = 3;
      mouseVisible = false; // Keycaps light up, cursor hidden
    } else if (timeIndex < 74) {
      currentStep = 4;
      mouseVisible = true;
      if (timeIndex < 62) {
        // Interpolate from (25%, 14%) to Normal tree node at (15%, 4%)
        const ratio = (timeIndex - 56) / 6;
        mouseTop = `${25 + (15 - 25) * ratio}%`;
        mouseLeft = `${14 + (4 - 14) * ratio}%`;
      } else if (timeIndex < 65) {
        // Hover at (15%, 4%) and right click Normal
        mouseTop = "15%";
        mouseLeft = "4%";
        if (timeIndex >= 62 && timeIndex <= 63) {
          mouseClicked = true;
        }
      } else if (timeIndex < 69) {
        // Glide to Insert menu at (26%, 8%)
        const ratio = (timeIndex - 65) / 4;
        mouseTop = `${15 + (26 - 15) * ratio}%`;
        mouseLeft = `${4 + (8 - 4) * ratio}%`;
      } else if (timeIndex < 72) {
        // Glide to Module sub-menu option at (29%, 15%)
        const ratio = (timeIndex - 69) / 3;
        mouseTop = `${26 + (29 - 26) * ratio}%`;
        mouseLeft = `${8 + (15 - 8) * ratio}%`;
      } else {
        // Click Module option at (29%, 15%)
        mouseTop = "29%";
        mouseLeft = "15%";
        if (timeIndex >= 72 && timeIndex <= 73) {
          mouseClicked = true;
        }
      }
    } else if (timeIndex < 92) {
      currentStep = 5;
      mouseVisible = false; // Keyboard Ctrl+S lights up, cursor hidden
    } else {
      currentStep = 6;
      mouseVisible = false;
    }
  }

  // Update step rendering based on auto-play or manual state
  const activeStepToRender = isPlaying ? currentStep : activeStep;

  // Listen for Escape key and arrow keys to navigate modal steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      } else if (e.key === "ArrowRight") {
        handleManualStep(activeStepToRender === 6 ? 1 : activeStepToRender + 1);
      } else if (e.key === "ArrowLeft") {
        handleManualStep(activeStepToRender === 1 ? 6 : activeStepToRender - 1);
      }
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, activeStepToRender]);

  // Auto-play timeline control
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeIndex((prev) => {
          const next = prev + 1;
          if (next >= 110) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 140);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const steps = [
    {
      num: 1,
      title: "Mở Word từ màn hình chính Windows",
      desc: "Tìm biểu tượng Microsoft Word trên màn hình nền (Desktop) hoặc trên thanh Taskbar và nhấp đúp chuột để mở ứng dụng.",
      mockup: (
        <div className="relative w-full h-full bg-black rounded-[10px] overflow-hidden border border-white/10 shadow-2xl">
          <img
            src="/guide-step1.jpg"
            alt="Windows Desktop"
            className="w-full h-full object-contain opacity-95"
          />
          <TutorialTooltip
            text="Nhấp đúp chuột để khởi chạy Microsoft Word từ màn hình chính."
            position="top-[17%] left-[31%]"
            arrowDir="left"
          />
        </div>
      ),
    },
    {
      num: 2,
      title: "Chọn Blank Document trong Word",
      desc: "Trình khởi động Word xuất hiện, chọn mục Blank Document để mở một tài liệu soạn thảo trống mới.",
      mockup: (
        <div className="relative w-full h-full bg-black rounded-[10px] overflow-hidden border border-white/10 shadow-2xl">
          <img
            src="/guide-step2.jpg"
            alt="Word Startup"
            className="w-full h-full object-contain opacity-95"
          />
          <TutorialTooltip
            text="Chọn Blank Document để mở ra một trang tài liệu mới."
            position="top-[22%] left-[23%]"
            arrowDir="left"
          />
        </div>
      ),
    },
    {
      num: 3,
      title: "Mở Trình Soạn Thảo VBA (Alt + F11)",
      desc: "Tại cửa sổ soạn thảo Word, nhấn tổ hợp phím Alt + F11 trên bàn phím để kích hoạt giao diện Visual Basic Editor.",
      mockup: (
        <div className="relative w-full h-full bg-black rounded-[10px] overflow-hidden border border-white/10 shadow-2xl">
          <img
            src="/guide-step3.jpg"
            alt="Alt + F11 in Word"
            className="w-full h-full object-contain opacity-95"
          />
          {/* Animated Keycaps */}
          <div className="absolute top-[40%] left-[25%] z-20 bg-black/75 border border-white/10 p-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-sm">
            <span className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs shadow-md transition-all duration-150 ${
              isAltPressed 
                ? "bg-ring border border-ring/50 text-white scale-95 shadow-[0_0_12px_hsl(var(--ring)/0.4)]" 
                : "bg-white/5 border border-white/10 text-white"
            }`}>Alt</span>
            <span className="text-white/40 text-xs font-bold">+</span>
            <span className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs shadow-md transition-all duration-150 ${
              isF11Pressed 
                ? "bg-ring border border-ring/50 text-white scale-95 shadow-[0_0_12px_hsl(var(--ring)/0.4)]" 
                : "bg-ring/10 border border-ring/30 text-ring"
            }`}>F11</span>
          </div>
          <TutorialTooltip
            text="Nhấn tổ hợp Alt + F11 trên bàn phím để mở trình soạn thảo lập trình VBA."
            position="top-[43%] left-[58%]"
            arrowDir="left"
          />
        </div>
      ),
    },
    {
      num: 4,
      title: "Tạo Module trong dự án Normal",
      desc: "Trong trình soạn thảo VBA, nhấp chuột phải vào Normal -> Insert -> Module để khởi tạo tệp chạy mã Macro toàn cục.",
      mockup: (
        <div className="relative w-full h-full bg-black rounded-[10px] overflow-hidden border border-white/10 shadow-2xl">
          <img
            src="/guide-step4.png"
            alt="VBA Explorer Normal"
            className="w-full h-full object-contain opacity-95"
          />
          <TutorialTooltip
            text="Nhấp chuột phải vào Normal, rê đến Insert và click chọn Module."
            position="top-[26%] left-[23%]"
            arrowDir="left"
          />
        </div>
      ),
    },
    {
      num: 5,
      title: "Dán mã Code & Lưu lại (Ctrl + S)",
      desc: "Sao chép mã code VBA ở bảng bên phải, dán (Ctrl+V) vào cửa sổ soạn thảo của Module1 và nhấn Ctrl + S để lưu lại.",
      mockup: (
        <div className="relative w-full h-full bg-black rounded-[10px] overflow-hidden border border-white/10 shadow-2xl">
          <img
            src="/guide-step5.png"
            alt="Paste and Save Macro"
            className="w-full h-full object-contain opacity-95"
          />
          {/* Animated Keycaps */}
          <div className="absolute top-[48%] left-[28%] z-20 bg-black/75 border border-white/10 p-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-sm">
            <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs shadow transition-all duration-150 ${
              isCtrlPressed 
                ? "bg-ring border border-ring/50 text-white scale-95 shadow-[0_0_12px_hsl(var(--ring)/0.4)]" 
                : "bg-white/5 border border-white/10 text-white"
            }`}>Ctrl</span>
            <span className="text-white/40 text-xs font-bold">+</span>
            <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs shadow transition-all duration-150 ${
              isSPressed 
                ? "bg-ring border border-ring/50 text-white scale-95 shadow-[0_0_12px_hsl(var(--ring)/0.4)]" 
                : "bg-ring/10 border border-ring/30 text-ring"
            }`}>S</span>
          </div>
          <TutorialTooltip
            text="Dán đoạn code đã sao chép từ cột bên phải vào đây, và nhấn Ctrl + S để lưu."
            position="top-[42%] left-[55%]"
            arrowDir="left"
          />
        </div>
      ),
    },
    {
      num: 6,
      title: "Hoàn tất! Trải nghiệm chuyển đổi",
      desc: "Mọi thứ đã sẵn sàng. Hãy copy bất kỳ công thức nào trên web và nhấn Ctrl + V trong Word để xem thành quả chuyển đổi.",
      mockup: (
        <div className="relative w-full h-full bg-card rounded-[10px] overflow-hidden border border-border/15 shadow-2xl font-sans text-xs flex flex-col justify-center items-center text-center p-6 gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ring/10 border border-ring/25 text-ring shadow-[0_0_24px_hsl(var(--ring)/0.15)] transition-transform duration-300 hover:scale-105">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ring/50 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-ring"></span>
            </span>
          </div>
          
          <div className="max-w-[290px]">
            <h3 className="text-foreground font-bold text-base tracking-tight">Kích hoạt thành công! 🎉</h3>
            <p className="text-muted-foreground text-[11px] mt-2.5 leading-relaxed">
              Tự động hóa MathType đã được cài đặt. Kể từ lúc này, mọi công thức toán học bạn copy từ website sẽ **tự động chuyển thành đối tượng MathType** ngay khi dán vào Word!
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="relative border-t border-border/10 bg-gradient-to-b from-[#111] to-background px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        {/* Header Section */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ring/20 bg-ring/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ring shadow-sm">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Tích hợp Word & MathType
          </span>
          <h2 className="mt-6 font-serif text-4xl font-normal leading-[1.1] tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
            Tự động chuyển đổi sang MathType
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Bỏ qua mọi thao tác thủ công. Chỉ cần cấu hình Macro trong Word một lần duy nhất, các công thức toán học bạn copy từ app sẽ tự động chuyển thành đối tượng MathType ngay khi dán.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Left Column: Interactive Video Player / Simulation */}
          <div className="relative rounded-2xl border border-border/15 bg-card overflow-hidden shadow-2xl flex flex-col">
            <div className="relative flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-black/45 px-4 text-xs text-white/60">
              <span className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-ring" />
                Hướng dẫn trực quan: Cài đặt Macro vào Word
              </span>
              <span className="rounded bg-ring/10 border border-ring/25 text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider text-ring">
                {isPlaying ? `Tự động chạy: Bước ${activeStepToRender}/6` : `Bước ${activeStepToRender}/6`}
              </span>
            </div>

            {/* Video Canvas */}
            <div className="relative aspect-[16/9] w-full bg-[#111] overflow-hidden">
              {!isPlaying && timeIndex === 0 && activeStep === 1 ? (
                // Video Poster State
                <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center cursor-pointer group" onClick={() => setIsPlaying(true)}>
                  <img
                    src="/word-vba-tutorial.png"
                    alt="VBA Tutorial Mockup"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[2px] transition duration-500 group-hover:scale-105 group-hover:opacity-25"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Big Glowing Play Button */}
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-ring text-white shadow-2xl transition duration-300 transform group-hover:scale-110 group-hover:bg-ring/90">
                    <Play className="h-6 w-6 fill-current ml-0.5" />
                    <span className="absolute inset-0 rounded-full bg-ring/30 animate-ping opacity-75" />
                  </div>
                  
                  <h3 className="relative z-10 mt-4 text-base font-semibold text-white tracking-tight">
                    Bắt đầu phát hướng dẫn tự động
                  </h3>
                  <p className="relative z-10 mt-1 text-[11px] text-white/50 max-w-sm leading-relaxed">
                    Xem mô phỏng video tự động với con chuột ảo di chuyển thao tác trực quan từng bước trên màn hình thực tế.
                  </p>
                </div>
              ) : (
                // Video Playing / Simulation State
                <div 
                  className="absolute inset-0 bg-[#0c0c0e] cursor-zoom-in group/canvas"
                  onClick={() => setIsModalOpen(true)}
                >
                  {steps[activeStepToRender - 1].mockup}

                  {/* Zoom Badge on Hover */}
                  <div className="absolute top-3 right-3 z-30 opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <span className="flex items-center gap-1.5 rounded-full bg-black/75 border border-white/15 px-2.5 py-1 text-[10px] font-medium text-white/90 shadow-lg backdrop-blur-sm">
                      <Maximize2 className="h-3 w-3 text-ring animate-pulse" />
                      Nhấp để phóng to
                    </span>
                  </div>

                  {/* Simulated Virtual Mouse Pointer (Rendered inside the screenshot viewport for 100% accurate coordinates) */}
                  {isPlaying && mouseVisible && (
                    <div
                      className="absolute z-40 pointer-events-none transition-all duration-100 ease-out"
                      style={{
                        top: mouseTop,
                        left: mouseLeft,
                        transform: "translate(-2px, -2px)",
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-black"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                      </svg>
                      {mouseClicked && (
                        <span className="absolute -top-2.5 -left-2.5 w-10 h-10 rounded-full border-2 border-ring bg-ring/25 animate-ping opacity-85" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls Bar (Cleanly separated below the canvas, preventing any layout overlapping) */}
            <div className="bg-[#131316] px-4 py-3 border-t border-white/5 flex items-center justify-between gap-3 text-xs">
              {/* Steps Dots */}
              <div className="flex gap-1.5">
                {steps.map((s) => (
                  <button
                    key={s.num}
                    onClick={() => handleManualStep(s.num)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeStepToRender === s.num ? "w-8 bg-ring" : "w-2 bg-white/10 hover:bg-white/20"
                    }`}
                    title={`Xem bước ${s.num}`}
                  />
                ))}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition shadow-md"
                  title={isPlaying ? "Tạm dừng tự động phát" : "Tiếp tục phát tự động"}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                </button>

                {activeStepToRender > 1 && (
                  <button
                    onClick={() => handleManualStep(activeStepToRender - 1)}
                    className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition font-semibold"
                  >
                    Quay lại
                  </button>
                )}
                {activeStepToRender < 6 ? (
                  <button
                    onClick={() => handleManualStep(activeStepToRender + 1)}
                    className="px-4 py-1.5 rounded-full bg-ring text-white hover:bg-ring/90 transition font-semibold flex items-center gap-1 shadow-md"
                  >
                    Bước tiếp <ArrowRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setTimeIndex(0);
                      setActiveStep(1);
                    }}
                    className="px-4 py-1.5 rounded-full bg-white text-black hover:bg-white/90 transition font-semibold flex items-center gap-1 shadow-md"
                  >
                    <RotateCcw className="h-3 w-3" /> Bắt đầu lại
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Caption Display */}
            <div className="bg-[#131316] p-5 border-t border-white/5 min-h-[96px] flex flex-col justify-center">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-ring animate-pulse" />
                Bước {activeStepToRender}: {steps[activeStepToRender - 1].title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {steps[activeStepToRender - 1].desc}
              </p>
            </div>
          </div>

          {/* Right Column: Code Card with Collapsible Layout */}
          <div ref={codeCardRef} className="flex flex-col rounded-2xl border border-border/15 bg-card overflow-hidden shadow-2xl scroll-mt-24">
            <div className="flex h-12 items-center justify-between border-b border-white/10 bg-black/40 px-4 text-xs">
              <span className="font-mono text-white/70 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-ring" /> Normal.dotm - VBA Module1
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-md bg-ring px-3 py-1 font-sans text-xs font-bold text-white hover:bg-ring/90 transition shadow-lg"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Đã sao chép!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy mã Macro
                  </>
                )}
              </button>
            </div>

            {/* Code Box Canvas (Fully Collapsible: height transitions from 0 to full) */}
            <div className={`relative bg-[#09090b] font-mono text-xs overflow-hidden transition-all duration-500 ease-in-out ${
                   isExpanded ? "p-5 border-b border-white/5" : "h-0 p-0 border-b-0"
                 }`}
                 style={{ maxHeight: isExpanded ? "2000px" : "0px" }}>
              
              {/* Syntax Highlighted Code */}
              <pre className="text-white/85 leading-relaxed overflow-x-auto whitespace-pre font-mono text-[11px] pb-3">
                <code>
                  <span className="text-[#569cd6]">Sub</span> <span className="text-[#dcdcaa]">EditPaste</span>()
                  <br />
                  {"    "}<span className="text-[#569cd6]">Dim</span> startPos <span className="text-[#569cd6]">As</span> <span className="text-[#4ec9b0]">Long</span>
                  <br />
                  {"    "}<span className="text-[#569cd6]">Dim</span> endPos <span className="text-[#569cd6]">As</span> <span className="text-[#4ec9b0]">Long</span>
                  <br />
                  {"    "}<span className="text-[#569cd6]">Dim</span> pastedRange <span className="text-[#569cd6]">As</span> <span className="text-[#4ec9b0]">Range</span>
                  <br />
                  <br />
                  {"    "}<span className="text-[#569cd6]">On Error GoTo</span> <span className="text-[#dcdcaa]">NormalPaste</span>
                  <br />
                  <br />
                  {"    "}startPos = Selection.Start
                  <br />
                  <br />
                  {"    "}Selection.Paste
                  <br />
                  <br />
                  {"    "}endPos = Selection.End
                  <br />
                  <br />
                  {"    "}<span className="text-[#569cd6]">Set</span> pastedRange = ActiveDocument.Range(startPos, endPos)
                  <br />
                  {"   "}
                  <br />
                  {"    "}<span className="text-[#569cd6]">If</span> pastedRange.OMaths.count &gt; <span className="text-[#b5cea8]">0</span> <span className="text-[#569cd6]">Then</span>
                  <br />
                  {"  "}
                  <br />
                  {"        "}pastedRange.Select
                  <br />
                  {"        "}
                  <br />
                  {"        "}Application.Run <span className="text-[#ce9178]">"MTCommand_ConvertEqns"</span>
                  <br />
                  {"    "}<span className="text-[#569cd6]">End If</span>
                  <br />
                  {"    "}<span className="text-[#569cd6]">Exit Sub</span>
                  <br />
                  <br />
                  <span className="text-[#dcdcaa]">NormalPaste</span>:
                  <br />
                  {"    "}<span className="text-[#569cd6]">On Error Resume Next</span>
                  <br />
                  {"    "}Selection.Paste
                  <br />
                  <span className="text-[#569cd6]">End Sub</span>
                  <br />
                  <br />
                  <span className="text-[#569cd6]">Sub</span> <span className="text-[#dcdcaa]">EditPasteSpecial</span>()
                  <br />
                  {"    "}<span className="text-[#569cd6]">Dim</span> startPos <span className="text-[#569cd6]">As</span> <span className="text-[#4ec9b0]">Long</span>
                  <br />
                  {"    "}<span className="text-[#569cd6]">Dim</span> endPos <span className="text-[#569cd6]">As</span> <span className="text-[#4ec9b0]">Long</span>
                  <br />
                  {"    "}<span className="text-[#569cd6]">Dim</span> pastedRange <span className="text-[#569cd6]">As</span> <span className="text-[#4ec9b0]">Range</span>
                  <br />
                  <br />
                  {"    "}<span className="text-[#569cd6]">On Error GoTo</span> <span className="text-[#dcdcaa]">NormalPasteSpecial</span>
                  <br />
                  <br />
                  {"    "}startPos = Selection.Start
                  <br />
                  <br />
                  {"    "}Dialogs(wdDialogEditPasteSpecial).Show
                  <br />
                  <br />
                  {"    "}endPos = Selection.End
                  <br />
                  {"    "}<span className="text-[#569cd6]">Set</span> pastedRange = ActiveDocument.Range(startPos, endPos)
                  <br />
                  <br />
                  {"    "}<span className="text-[#569cd6]">If</span> pastedRange.OMaths.count &gt; <span className="text-[#b5cea8]">0</span> <span className="text-[#569cd6]">Then</span>
                  <br />
                  {"        "}pastedRange.Select
                  <br />
                  {"        "}Application.Run <span className="text-[#ce9178]">"MTCommand_ConvertEqns"</span>
                  <br />
                  {"    "}<span className="text-[#569cd6]">End If</span>
                  <br />
                  {"    "}<span className="text-[#569cd6]">Exit Sub</span>
                  <br />
                  <br />
                  <span className="text-[#dcdcaa]">NormalPasteSpecial</span>:
                  <br />
                  {"    "}<span className="text-[#569cd6]">On Error Resume Next</span>
                  <br />
                  {"    "}Dialogs(wdDialogEditPasteSpecial).Show
                  <br />
                  <span className="text-[#569cd6]">End Sub</span>
                </code>
              </pre>
            </div>

            {/* Bottom Expand Toggle Bar */}
            <div className="bg-[#131316] px-4 py-3.5 flex justify-center z-10">
              <button
                onClick={handleToggleExpand}
                className="flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition duration-200"
              >
                {isExpanded ? (
                  <>
                    Thu gọn mã code VBA <ChevronUp className="h-4 w-4 text-ring" />
                  </>
                ) : (
                  <>
                    Xem toàn bộ mã code VBA (Mở rộng) <ChevronDown className="h-4 w-4 text-ring" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Immersive Mockup Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Prevent clicks on the content from closing the modal */}
          <div 
            className="relative w-full max-w-5xl bg-[#0c0c0e] rounded-xl border border-white/10 overflow-hidden shadow-2xl animate-scale-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex h-12 items-center justify-between border-b border-white/10 bg-black/45 px-4 text-xs text-white/80 shrink-0">
              <span className="font-semibold flex items-center gap-2">
                <Tv className="h-4 w-4 text-ring" />
                Bước {activeStepToRender}/6: {steps[activeStepToRender - 1].title}
              </span>

              {/* Interactive Dots inside the modal header */}
              <div className="hidden sm:flex items-center gap-1.5 mx-4">
                {steps.map((s) => (
                  <button
                    key={s.num}
                    onClick={() => handleManualStep(s.num)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeStepToRender === s.num ? "w-6 bg-ring" : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    title={`Xem bước ${s.num}`}
                  />
                ))}
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition duration-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Large Viewport */}
            <div className="relative aspect-[16/9] bg-[#111] overflow-hidden group/modalbody shrink-0">
              {steps[activeStepToRender - 1].mockup}

              {/* Large Mockup Virtual Mouse overlay (if it is playing) */}
              {isPlaying && mouseVisible && (
                <div
                  className="absolute z-40 pointer-events-none transition-all duration-100 ease-out"
                  style={{
                    top: mouseTop,
                    left: mouseLeft,
                    transform: "translate(-2px, -2px)",
                  }}
                >
                  <svg
                    className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-black"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                  </svg>
                  {mouseClicked && (
                    <span className="absolute -top-3.5 -left-3.5 w-14 h-14 rounded-full border-2 border-ring bg-ring/25 animate-ping opacity-85" />
                  )}
                </div>
              )}

              {/* Left Arrow Button */}
              <button
                onClick={() => handleManualStep(activeStepToRender === 1 ? 6 : activeStepToRender - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/70 hover:text-white hover:bg-black/75 hover:scale-105 active:scale-95 transition-all duration-200 opacity-0 group-hover/modalbody:opacity-100 cursor-pointer shadow-lg backdrop-blur-sm"
                title="Bước trước (Phím mũi tên Trái)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Right Arrow Button */}
              <button
                onClick={() => handleManualStep(activeStepToRender === 6 ? 1 : activeStepToRender + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/70 hover:text-white hover:bg-black/75 hover:scale-105 active:scale-95 transition-all duration-200 opacity-0 group-hover/modalbody:opacity-100 cursor-pointer shadow-lg backdrop-blur-sm"
                title="Bước tiếp theo (Phím mũi tên Phải)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#131316] p-5 border-t border-white/5 flex flex-col justify-center shrink-0">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {steps[activeStepToRender - 1].desc}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
