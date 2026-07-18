import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
  CheckCircle2,
  Cpu,
  Clock,
  HardDrive,
  Layers
} from "lucide-react";
import { contentData } from "../data/content";

// Retrieve slug data
const dbIndexingContent = contentData.find((item) => item.slug === "db-indexing");
const rawSteps = dbIndexingContent?.steps || [];

const steps = rawSteps.map((stepText, idx) => {
  let title = `Step ${idx + 1}`;
  let desc = stepText;

  if (stepText.includes(" — ")) {
    const parts = stepText.split(" — ");
    title = parts[0];
    desc = parts[1];
  } else if (stepText.includes(" : ")) {
    const parts = stepText.split(" : ");
    title = parts[0];
    desc = parts[1];
  } else if (stepText.includes(": ")) {
    const parts = stepText.split(": ");
    title = parts[0];
    desc = parts[1];
  }

  // Remove markdown bold markings
  title = title.replace(/\*\*/g, "");
  desc = desc.replace(/\*\*/g, "");

  return { title, desc, raw: stepText.replace(/\*\*/g, "") };
});

const total = steps.length;

// Heap file slots (Data Blocks on Disk)
const heapSlots = [
  { id: 4, label: "row_4", val: "42.50", x: 50 },
  { id: 8, label: "row_8", val: "19.99", x: 112 },
  { id: 2, label: "row_2", val: "89.00", x: 174 },
  { id: 10, label: "row_10", val: "150.00", x: 236 },
  { id: 6, label: "row_6", val: "60.40", x: 298 },
  { id: 5, label: "row_5", val: "35.20", x: 360 }, // Appears in Step 2 insertion
  { id: 3, label: "row_3", val: "74.80", x: 422 },
  { id: 7, label: "row_7", val: "12.50", x: 484 },
];

export default function DbIndexingViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDone, setIsDone] = useState(false);

  // Sub-animation states
  const [scanIdx, setScanIdx] = useState(-1);
  const [insertSubStep, setInsertSubStep] = useState(0);
  const [traverseSubStep, setTraverseSubStep] = useState(0);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setActiveStep(0);
    setIsPlaying(false);
    setIsDone(false);
    setScanIdx(-1);
    setInsertSubStep(0);
    setTraverseSubStep(0);
  }, []);

  // 1. Auto-cycling loop
  useEffect(() => {
    if (!isPlaying) return;

    if (activeStep === total - 1) {
      setIsDone(true);
      const t = setTimeout(() => {
        setIsDone(false);
        setActiveStep(0);
      }, 5500); // Wait on performance comparison step
      return () => clearTimeout(t);
    }

    const nextStep = activeStep + 1;
    let duration = 3000;
    if (activeStep === 0) duration = 5600; // Time for Full Scan animation
    if (activeStep === 2) duration = 9200; // Time for insert & split timeline
    if (activeStep === 4) duration = 6200; // Time for B+ Tree traversal

    const t = setTimeout(() => {
      setActiveStep(nextStep);
      if (nextStep === total - 1) {
        setIsDone(true);
      }
    }, duration);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep]);

  // 2. Step 0 (Full Scan) animation sequence
  useEffect(() => {
    if (activeStep !== 0) {
      setScanIdx(-1);
      return;
    }

    setScanIdx(0);
    const interval = setInterval(() => {
      setScanIdx((prev) => {
        if (prev >= 7) {
          clearInterval(interval);
          return 7;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [activeStep]);

  // 3. Step 2 (Data Insert & Node Split) timeline
  useEffect(() => {
    if (activeStep !== 2) {
      setInsertSubStep(0);
      return;
    }

    setInsertSubStep(0);
    const timeline = [
      { step: 0, delay: 0 },    // Record written to disk
      { step: 1, delay: 1800 }, // Key 5 floats to Memory Index Leaf
      { step: 2, delay: 3600 }, // Leaf 1 overflows [2, 4, 5]
      { step: 3, delay: 5400 }, // Node Split occurs, key 4 promoted
      { step: 4, delay: 7400 }  // Tree balanced
    ];

    const timers = timeline.map((item) =>
      setTimeout(() => {
        setInsertSubStep(item.step);
      }, item.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [activeStep]);

  // 4. Step 4 (B+ Tree Traversal) timeline
  useEffect(() => {
    if (activeStep !== 4) {
      setTraverseSubStep(0);
      return;
    }

    setTraverseSubStep(0);
    const timeline = [
      { step: 0, delay: 0 },    // Root Node highlight
      { step: 1, delay: 1500 }, // Branch pointer selection
      { step: 2, delay: 3000 }, // Leaf 2 Node highlight
      { step: 3, delay: 4500 }  // Key matching
    ];

    const timers = timeline.map((item) =>
      setTimeout(() => {
        setTraverseSubStep(item.step);
      }, item.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [activeStep]);

  const handlePlay = useCallback(() => {
    if (activeStep === total - 1) {
      setActiveStep(0);
      setIsPlaying(true);
      setIsDone(false);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [activeStep]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
      setIsDone(activeStep + 1 === total - 1);
    } else {
      setActiveStep(0);
      setIsDone(false);
    }
  }, [activeStep]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setIsDone(false);
    if (activeStep > 0) {
      setActiveStep((p) => p - 1);
    } else {
      setActiveStep(total - 1);
      setIsDone(true);
    }
  }, [activeStep]);

  // Performance HUD configuration
  const getHUDMetrics = () => {
    switch (activeStep) {
      case 0:
        return [
          { label: "Execution Mode", value: "Full Table Scan", status: "error", desc: "No index used" },
          { label: "Disk reads (I/O)", value: `${scanIdx + 1} / 8 Pages`, status: "error", desc: "Sequential disk I/O" },
          { label: "Memory Cache hit", value: "0% (Cache Miss)", status: "error", desc: "Bypassed buffer pool" },
          { label: "CPU comparisons", value: `${scanIdx + 1} ops`, status: "warning", desc: "Key evaluation count" },
          { label: "Query Latency", value: "12.4 ms (High)", status: "error", desc: "Physical disk bottleneck" }
        ];
      case 1:
        return [
          { label: "Execution Mode", value: "Index Construction", status: "purple", desc: "Building B+ Tree structure" },
          { label: "Disk reads (I/O)", value: "8 Pages (Scan)", status: "warning", desc: "Initial data load" },
          { label: "Index state", value: "Active", status: "success", desc: "Keys sorted & indexed" },
          { label: "Tree Height", value: "2 (Root & 2 Leaves)", status: "purple", desc: "Balanced tree depth" },
          { label: "Latency", value: "4.2 ms", status: "success", desc: "One-off creation overhead" }
        ];
      case 2:
        const subLabels = [
          "1. Disk Write Row",
          "2. Index Leaf Insertion",
          "3. Capacity Overflow",
          "4. Node Split & Promote",
          "5. Split Finished"
        ];
        return [
          { label: "Execution Mode", value: "Insert & Index Split", status: "green", desc: "Write query execution" },
          { label: "Write status", value: subLabels[insertSubStep], status: "orange", desc: "Split pipeline stage" },
          { label: "Disk writes (I/O)", value: insertSubStep >= 3 ? "2 Pages" : "1 Page", status: "green", desc: "Physical log and data write" },
          { label: "Tree Height", value: "2 (Root & 3 Leaves)", status: "purple", desc: "B+ Tree balanced" },
          { label: "Write overhead", value: insertSubStep >= 3 ? "High (Node Split)" : "Normal", status: insertSubStep >= 3 ? "warning" : "success", desc: "B+ Tree re-linking" }
        ];
      case 3:
        return [
          { label: "Execution Mode", value: "SELECT Index Init", status: "blue", desc: "Index point lookup beginning" },
          { label: "Disk reads (I/O)", value: "0 Pages", status: "success", desc: "No disk read triggered yet" },
          { label: "Memory Cache check", value: "Analyzing Cache", status: "yellow", desc: "Checking buffer page directory" },
          { label: "Target key", value: "8", status: "blue", desc: "Filter condition key" },
          { label: "Latency", value: "0.0 ms", status: "success", desc: "Pre-processing state" }
        ];
      case 4:
        return [
          { label: "Execution Mode", value: "B+ Tree Search", status: "blue", desc: "Root-to-Leaf key navigation" },
          { label: "Disk reads (I/O)", value: "0 Pages", status: "success", desc: "Traversing in-memory nodes" },
          { label: "Active Node", value: traverseSubStep >= 2 ? "Leaf 2 (Page 103)" : "Root (Page 101)", status: "purple", desc: "Current page memory address" },
          { label: "Node comparisons", value: `${traverseSubStep >= 2 ? 2 : 1} ops`, status: "blue", desc: "Binary/Linear search in node" },
          { label: "Traverse depth", value: `${traverseSubStep >= 2 ? 2 : 1} / 2`, status: "purple", desc: "Memory page hops" }
        ];
      case 5:
        return [
          { label: "Execution Mode", value: "Bookmark / RID Lookup", status: "blue", desc: "Resolving row address to disk page" },
          { label: "Disk reads (I/O)", value: "1 Page (Page 2)", status: "warning", desc: "Direct disk I/O fetch" },
          { label: "Memory reads", value: "2 Pages (Root + Leaf)", status: "purple", desc: "Loaded from cache / buffer pool" },
          { label: "Buffer Pool status", value: "Page 2 Cached", status: "yellow", desc: "Loaded page into buffer cache" },
          { label: "Query Latency", value: "0.8 ms (Low)", status: "success", desc: "Bypassed sequential scans" }
        ];
      case 6:
        return [
          { label: "Search Strategy", value: "Index Point Lookup", status: "success", desc: "O(log N) random lookup" },
          { label: "Full Scan Reads", value: "8 Pages (100% table)", status: "error", desc: "Sequential sweep overhead" },
          { label: "Index Scan Reads", value: "1 Disk + 2 Memory Pages", status: "success", desc: "Direct indexed paths" },
          { label: "I/O Reduction", value: "62.5% decrease", status: "success", desc: "Bypassed 5 unnecessary disk pages" },
          { label: "Query Latency", value: "0.8 ms vs 12.4 ms", status: "success", desc: "15x performance increase" }
        ];
      default:
        return [];
    }
  };

  // Developer terminal logs simulation
  const getTerminalLogs = () => {
    const logs: string[] = [];
    logs.push("mysql> -- DBMS Engine Debug Trace Console");

    if (activeStep >= 0) {
      logs.push("mysql> SELECT * FROM users WHERE id = 8;");
      if (activeStep === 0) {
        logs.push("[engine] Checking index metadata for table 'users'...");
        logs.push("[engine] Warning: Column 'id' has no index. Falling back to Table Scan.");
        logs.push("[storage] Initiating Sequential Page Directory scan...");
        
        const slotsOrder = [4, 8, 2, 10, 6, 5, 3, 7];
        for (let i = 0; i <= scanIdx; i++) {
          if (i === 5) continue; // Skip slot 5 (not inserted yet)
          const targetId = slotsOrder[i];
          if (targetId === 8) {
            logs.push(`[storage] Reading disk Page ${i+1} (RowID: ${targetId}) -> MATCH!`);
          } else {
            logs.push(`[storage] Reading disk Page ${i+1} (RowID: ${targetId}) -> Mismatch`);
          }
        }

        if (scanIdx === 7) {
          logs.push("[engine] Row retrieved successfully. Sequential scan terminated.");
          logs.push("[engine] Output: { id: 8, val: 'row_8' } (1 row, Latency: 12.4ms)");
        }
      }
    }

    if (activeStep >= 1) {
      if (activeStep === 1) {
        logs.push("mysql> CREATE INDEX idx_users_id ON users(id);");
        logs.push("[engine] DDL request received. Locking index schema...");
        logs.push("[engine] Scanning table records sequentially: extracting keys...");
        logs.push("[engine] Keys extracted: [2, 4, 6, 8, 10]");
        logs.push("[index] Allocating memory buffer pool node structures:");
        logs.push("  - Root Node  (Page 101, Addr: 0x5a10): Key [6]");
        logs.push("  - Leaf Node 1 (Page 102, Addr: 0x5b20): Keys [2, 4]");
        logs.push("  - Leaf Node 2 (Page 103, Addr: 0x5c30): Keys [6, 8, 10]");
        logs.push("[index] Hooking dual pointers for sequential Leaf Scan paths...");
        logs.push("[engine] Index idx_users_id successfully compiled (4.2ms).");
      } else {
        logs.push("mysql> -- Index idx_users_id is active on column 'id'");
      }
    }

    if (activeStep >= 2) {
      if (activeStep === 2) {
        logs.push("mysql> INSERT INTO users (id, val) VALUES (5, 35.20);");
        logs.push("[storage] Allocating space on disk Heap Page 6 (offset 0x3d0)...");
        logs.push("[storage] Disk block write successful (1 record appended).");

        if (insertSubStep >= 1) {
          logs.push("[index] Commencing index insertion path mapping for key: 5");
          logs.push("[index] Traversing: Root [6] -> 5 < 6 -> routing to Left Leaf Page 102");
        }
        if (insertSubStep >= 2) {
          logs.push("[index] Attempting write to Leaf Node Page 102 [2, 4]...");
          logs.push("[index] Alert: Leaf Page 102 keys: [2, 4, 5] -> Node capacity overflow (Max: 2)");
        }
        if (insertSubStep >= 3) {
          logs.push("[index] Split triggered on Leaf Page 102! Allocating Page 104 (Addr: 0x5d40)...");
          logs.push("  - Re-distributing keys: Page 102 -> [2], Page 104 -> [4, 5]");
          logs.push("  - Promoting median key 4 to parent Root Page 101");
        }
        if (insertSubStep >= 4) {
          logs.push("[index] Root Node updated. Keys: [4, 6]");
          logs.push("[index] Updating leaf pointer chains: Page 102 <-> Page 104 <-> Page 103");
          logs.push("[engine] Write transaction completed. B+ Tree self-balanced (8.5ms).");
        }
      } else {
        logs.push("mysql> -- Database record inserted. Index tree successfully self-balanced.");
      }
    }

    if (activeStep >= 3) {
      if (activeStep === 3) {
        logs.push("mysql> SELECT * FROM users WHERE id = 8;");
        logs.push("[engine] Query parser checked: Filter column 'id' has active index 'idx_users_id'");
        logs.push("[engine] Optimizer chosen strategy: Index Point Lookup (bypassing full scan)");
        logs.push("[storage] Checking cache directory for index Pages...");
        logs.push("[storage] Index Pages 101 & 103 loaded in Memory Buffer Pool (Cache Hit)");
      }
    }

    if (activeStep >= 4) {
      if (activeStep === 4) {
        logs.push("[index] Accessing Root Page 101 (Keys: [4, 6] or [6])");
        if (traverseSubStep >= 1) {
          logs.push("[index] Comparing search key 8: 8 >= 6 -> route to right branch pointer");
        }
        if (traverseSubStep >= 2) {
          logs.push("[index] Accessing Leaf Page 103 (Keys: [6, 8, 10]) in Buffer Pool");
          logs.push("[index] Running linear search in Leaf Page...");
        }
        if (traverseSubStep >= 3) {
          logs.push("[index] Key 8 match found. Extracted ROWID pointer -> Heap Page 2, offset 0x88");
        }
      } else {
        logs.push("[index] Target key 8 matched on Leaf Page 103. Pointer retrieved.");
      }
    }

    if (activeStep >= 5) {
      if (activeStep === 5) {
        logs.push("[storage] Reading database Heap Page 2 directly from physical disk...");
        logs.push("[storage] Page 2 content loaded to Memory Buffer Pool (0x7f8d9)");
        logs.push("[engine] Mapping row data: ID = 8, val = 19.99");
        logs.push("[engine] Output: { id: 8, val: 'row_8' } (1 row, Latency: 0.8ms)");
      }
    }

    if (activeStep >= 6) {
      if (activeStep === 6) {
        logs.push("mysql> EXPLAIN SELECT * FROM users WHERE id = 8;");
        logs.push("+------------------+------------+-------------+--------------+");
        logs.push("| scan_strategy    | table_name | select_type | key_selected |");
        logs.push("+------------------+------------+-------------+--------------+");
        logs.push("| INDEX POINT LOOK | users      | SIMPLE      | idx_users_id |");
        logs.push("+------------------+------------+-------------+--------------+");
        logs.push("[performance] Execution Cost Summary:");
        logs.push("  - Table scan sequential reads: 8 blocks");
        logs.push("  - Index scan targeted reads  : 3 blocks (2 Memory, 1 Disk)");
        logs.push("  - Savings: 62.5% physical disk IO read operations");
        logs.push("[engine] Execution profile complete.");
      }
    }

    return logs;
  };

  const progress = ((isDone ? total : Math.max(0, activeStep + 1)) / total) * 100;
  const isSplit = activeStep > 2 || (activeStep === 2 && insertSubStep >= 3);
  const hasIndex = activeStep >= 1;
  const isEveAppended = activeStep > 2 || (activeStep === 2 && insertSubStep >= 0);

  return (
    <div className="space-y-6">
      {/* Playback Controls Panel - Minimalist layout, auto-running by default */}
      <div className="flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30 px-3 py-1.5 rounded-xl border border-border/60 text-xs shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={reset}
            className="p-1 rounded bg-card hover:bg-muted border border-border/80 text-muted-foreground transition-colors"
            title="Reset simulation"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={handlePrev}
            className="p-1 rounded bg-card hover:bg-muted border border-border/80 text-muted-foreground transition-colors"
            title="Previous step"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={handlePlay}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 font-medium text-[10px] transition-opacity"
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded bg-card hover:bg-muted border border-border/80 text-muted-foreground transition-colors"
            title="Next step"
          >
            <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex-1 max-w-md flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground font-bold whitespace-nowrap">
            {isDone ? "DONE" : `STEP ${activeStep + 1}/${total}`}
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Row 1: Standalone visual canvas (full width & enlarged for better readability) */}
      <div className="w-full relative border border-border/65 rounded-2xl bg-card overflow-hidden shadow-sm">
        <svg viewBox="0 0 620 440" className="w-full h-auto rounded-2xl overflow-hidden bg-slate-50/10 dark:bg-neutral-950/20">
              <defs>
                <pattern id="canvas-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-neutral-200/30 dark:stroke-neutral-800/10" strokeWidth="0.5" />
                </pattern>
                <marker id="node-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-neutral-400 dark:fill-neutral-600" />
                </marker>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#canvas-grid)" />

              {/* Legend Indicator */}
              <g transform="translate(18, 418)" className="text-[7.5px] font-mono font-semibold fill-muted-foreground select-none">
                <circle cx={10} cy={-2} r={3.5} className="fill-blue-500" />
                <text x={18} y={1.5}>Read (SELECT)</text>

                <circle cx={110} cy={-2} r={3.5} className="fill-green-500" />
                <text x={118} y={1.5}>Write (INSERT)</text>

                <circle cx={210} cy={-2} r={3.5} className="fill-orange-500" />
                <text x={218} y={1.5}>Processing</text>

                <circle cx={305} cy={-2} r={3.5} className="fill-purple-500" />
                <text x={313} y={1.5}>Memory Node</text>

                <circle cx={410} cy={-2} r={3.5} className="fill-neutral-400" />
                <text x={418} y={1.5}>Disk Page</text>

                <circle cx={500} cy={-2} r={3.5} className="fill-yellow-500" />
                <text x={508} y={1.5}>Buffer Pool / Cache</text>
              </g>

              {/* 1. CLIENT / QUERY AREA (TOP) */}
              <g>
                <rect
                  x={30}
                  y={15}
                  width={560}
                  height={45}
                  rx={6}
                  className={`stroke-[1.5px] transition-all duration-300 ${
                    activeStep === 2
                      ? "stroke-green-500/80 fill-green-500/5"
                      : activeStep === 1
                      ? "stroke-purple-500/80 fill-purple-500/5"
                      : "stroke-blue-500/80 fill-blue-500/5"
                  }`}
                />
                
                {/* Terminal dots */}
                <circle cx="48" cy="37.5" r="3.5" fill="#ef4444" opacity="0.8" />
                <circle cx="60" cy="37.5" r="3.5" fill="#eab308" opacity="0.8" />
                <circle cx="72" cy="37.5" r="3.5" fill="#22c55e" opacity="0.8" />

                {/* Display current SQL executing */}
                <text x="92" y="41" className="text-[10px] font-mono font-bold fill-foreground">
                  {activeStep === 0 && "SELECT * FROM users WHERE id = 8;"}
                  {activeStep === 1 && "CREATE INDEX idx_users_id ON users(id);"}
                  {activeStep === 2 && "INSERT INTO users (id, val) VALUES (5, 35.20);"}
                  {activeStep === 3 && "SELECT * FROM users WHERE id = 8;"}
                  {activeStep === 4 && "SELECT * FROM users WHERE id = 8; (B+ Tree Navigation)"}
                  {activeStep === 5 && "SELECT * FROM users WHERE id = 8; (Physical Fetch)"}
                  {activeStep === 6 && "-- Performance Optimization Metric comparison"}
                </text>
                
                <text x="580" y="41" textAnchor="end" className="text-[7.5px] font-mono font-semibold fill-muted-foreground uppercase tracking-widest">
                  {activeStep === 2 ? "Write Query" : activeStep === 1 ? "DDL Query" : "Read Query"}
                </text>
              </g>

              {/* Connecting Flow from Client to Engine */}
              {isPlaying && (
                <motion.line
                  key={`flow-beam-${activeStep}`}
                  x1={310}
                  y1={60}
                  x2={310}
                  y2={85}
                  className={`stroke-2 stroke-dashed ${
                    activeStep === 2
                      ? "stroke-green-500"
                      : activeStep === 1
                      ? "stroke-purple-500"
                      : "stroke-blue-500"
                  }`}
                  strokeDasharray="4,4"
                  animate={{ strokeDashoffset: [-10, 0] }}
                  transition={{ ease: "linear", repeat: Infinity, duration: 0.8 }}
                />
              )}

              {/* 2. DBMS MEMORY ENGINE AREA (MIDDLE) */}
              <g>
                <rect
                  x={30}
                  y={85}
                  width={560}
                  height={205}
                  rx={8}
                  className="fill-purple-500/5 stroke-purple-500/20 stroke-1 stroke-dashed"
                />
                <text x="42" y="100" className="text-[8px] font-mono font-bold fill-purple-500/80 uppercase tracking-wider">
                  Memory Space: DBMS Engine Buffer Pool & Index Cache
                </text>

                {/* Left side: Cache & Buffer Pool Slot Blocks */}
                <g>
                  <rect
                    x={45}
                    y={110}
                    width={100}
                    height={165}
                    rx={6}
                    className="fill-yellow-500/5 stroke-yellow-500/20 stroke-1"
                  />
                  <text x="95" y="122" textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-yellow-500/90 uppercase tracking-widest">
                    Buffer Pool
                  </text>

                  {/* Buffer slots */}
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const isCheckActive = activeStep === 3;
                    const isSlotLoaded = activeStep === 5 && slotIdx === 3;
                    
                    return (
                      <g key={`buf-slot-${slotIdx}`} transform={`translate(52, ${130 + slotIdx * 34})`}>
                        <motion.rect
                          key={`buf-rect-${activeStep}-${slotIdx}`}
                          width={86}
                          height={28}
                          rx={3}
                          className={`stroke-[1px] ${
                            isSlotLoaded
                              ? "stroke-yellow-500 fill-yellow-500/10"
                              : isCheckActive
                              ? "stroke-orange-500 fill-orange-500/5 animate-pulse"
                              : "stroke-neutral-300 dark:stroke-neutral-800 fill-card"
                          }`}
                        />
                        <text x="43" y="17" textAnchor="middle" className="text-[7px] font-mono fill-muted-foreground">
                          {slotIdx === 0 && "Page 101 (Root)"}
                          {slotIdx === 1 && "Page 102 (Leaf)"}
                          {slotIdx === 2 && "Page 103 (Leaf)"}
                          {slotIdx === 3 && (isSlotLoaded ? "Page 2 (Data)" : "Empty Slot")}
                        </text>

                        {/* Scan Sweep overlay inside Slot when check is active */}
                        {isCheckActive && (
                          <motion.rect
                            key={`buf-sweep-${activeStep}`}
                            x={0}
                            y={0}
                            width={86}
                            height={28}
                            rx={3}
                            className="fill-yellow-500/10 stroke-none"
                            animate={{ opacity: [0.1, 0.4, 0.1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* Right/Center side: B+ Tree Representation */}
                <g>
                  {/* Boundary Box for Index */}
                  <rect
                    x={155}
                    y={110}
                    width={425}
                    height={165}
                    rx={6}
                    className="fill-card/40 stroke-purple-500/10 stroke-1"
                  />
                  <text x="165" y="122" className="text-[7.5px] font-mono font-semibold fill-muted-foreground uppercase tracking-widest">
                    Index Range Space
                  </text>

                  {!hasIndex ? (
                    // Display index not created state
                    <g transform="translate(155, 110)">
                      <rect
                        width={425}
                        height={165}
                        rx={6}
                        className="fill-red-500/5 stroke-red-500/20 stroke-1 stroke-dashed"
                      />
                      <text x="212" y="85" textAnchor="middle" className="text-[11px] font-bold fill-red-500/80">
                        No Index Available on column 'id'
                      </text>
                      <text x="212" y="103" textAnchor="middle" className="text-[8px] font-mono fill-muted-foreground">
                        Queries will sequential scan Disk Block Pages directly
                      </text>
                    </g>
                  ) : (
                    // Display B+ Tree Nodes and Links
                    <g>
                      {/* 1. Branch Pointer Lines */}
                      {/* Pointer Root -> Leaf Left */}
                      <motion.line
                        key={`line-left-${activeStep}`}
                        x1={isSplit ? 340 : 365}
                        y1={148}
                        x2={isSplit ? 230 : 285}
                        y2={205}
                        className={`stroke-[1.5px] stroke-dashed transition-colors duration-300 ${
                          activeStep === 4 && traverseSubStep === 1 && false
                            ? "stroke-blue-500 stroke-2"
                            : "stroke-neutral-300 dark:stroke-neutral-700"
                        }`}
                      />

                      {/* Pointer Root -> Leaf Middle (Only exists if Node Split occurred) */}
                      {isSplit && (
                        <motion.line
                          key={`line-mid-${activeStep}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          x1={365}
                          y1={148}
                          x2={340}
                          y2={205}
                          className="stroke-[1.5px] stroke-neutral-300 dark:stroke-neutral-700 stroke-dashed"
                        />
                      )}

                      {/* Pointer Root -> Leaf Right */}
                      <motion.line
                        key={`line-right-${activeStep}`}
                        x1={isSplit ? 390 : 385}
                        y1={148}
                        x2={isSplit ? 465 : 445}
                        y2={205}
                        className={`stroke-[1.5px] stroke-dashed transition-colors duration-300 ${
                          activeStep === 4 && traverseSubStep === 1
                            ? "stroke-blue-500 stroke-[2.5px]"
                            : "stroke-neutral-300 dark:stroke-neutral-700"
                        }`}
                      />

                      {/* Horizontal Node Pointer links */}
                      {!isSplit ? (
                        // Leaf 1 <-> Leaf 2
                        <g>
                          <path d="M 315 218 L 395 218" markerEnd="url(#node-arrow)" fill="none" className="stroke-neutral-300 dark:stroke-neutral-800 stroke-[1px]" />
                          <path d="M 395 222 L 315 222" markerEnd="url(#node-arrow)" fill="none" className="stroke-neutral-300 dark:stroke-neutral-800 stroke-[1px]" />
                        </g>
                      ) : (
                        // Leaf 1A <-> Leaf 1B <-> Leaf 2
                        <g>
                          {/* 1A -> 1B */}
                          <path d="M 215 218 L 285 218" markerEnd="url(#node-arrow)" fill="none" className="stroke-neutral-300 dark:stroke-neutral-800 stroke-[1px]" />
                          <path d="M 285 222 L 215 222" markerEnd="url(#node-arrow)" fill="none" className="stroke-neutral-300 dark:stroke-neutral-800 stroke-[1px]" />
                          {/* 1B -> 2 */}
                          <path d="M 360 218 L 425 218" markerEnd="url(#node-arrow)" fill="none" className="stroke-neutral-300 dark:stroke-neutral-800 stroke-[1px]" />
                          <path d="M 425 222 L 360 222" markerEnd="url(#node-arrow)" fill="none" className="stroke-neutral-300 dark:stroke-neutral-800 stroke-[1px]" />
                        </g>
                      )}

                      {/* 2. ROOT NODE */}
                      <g>
                        <motion.rect
                          key={`root-node-${activeStep}-${isSplit}`}
                          layout
                          x={isSplit ? 325 : 350}
                          y={125}
                          width={isSplit ? 80 : 40}
                          height={24}
                          rx={4}
                          className={`stroke-2 transition-all duration-350 ${
                            activeStep === 4 && traverseSubStep === 0
                              ? "stroke-orange-500 fill-orange-500/10 shadow-sm"
                              : "stroke-purple-500 fill-purple-500/5 fill-card"
                          }`}
                        />
                        {!isSplit ? (
                          <>
                            <text x="370" y="141" textAnchor="middle" className="text-[10px] font-mono font-bold fill-foreground">6</text>
                            <text x="370" y="121" textAnchor="middle" className="text-[6.5px] font-mono fill-muted-foreground font-bold tracking-wider">ROOT P101</text>
                          </>
                        ) : (
                          <>
                            <text x="345" y="141" textAnchor="middle" className="text-[10px] font-mono font-bold fill-foreground">4</text>
                            <line x1="365" y1="125" x2="365" y2="149" className="stroke-purple-500/20" />
                            <text x="385" y="141" textAnchor="middle" className="text-[10px] font-mono font-bold fill-foreground">6</text>
                            <text x="365" y="121" textAnchor="middle" className="text-[6.5px] font-mono fill-muted-foreground font-bold tracking-wider">ROOT P101</text>
                          </>
                        )}
                      </g>

                      {/* 3. LEAF NODES */}
                      {!isSplit ? (
                        // Leaf 1: Keys [2, 4]
                        <g>
                          <motion.rect
                            key={`leaf1-rect-${activeStep}`}
                            layout
                            x={235}
                            y={205}
                            width={70}
                            height={25}
                            rx={4}
                            className={`stroke-2 fill-card ${
                              activeStep === 2 && insertSubStep === 2
                                ? "stroke-red-500 fill-red-500/10 animate-pulse"
                                : "stroke-purple-500 fill-purple-500/5"
                            }`}
                            animate={activeStep === 2 && insertSubStep === 2 ? {
                              x: [235, 232, 238, 232, 238, 235],
                              transition: { duration: 0.3, repeat: Infinity }
                            } : {}}
                          />
                          {activeStep === 2 && insertSubStep === 2 ? (
                            <>
                              <text x="247" y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">2</text>
                              <line x1="258" y1="205" x2="258" y2="230" className="stroke-purple-500/20" />
                              <text x="270" y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">4</text>
                              <line x1="282" y1="205" x2="282" y2="230" className="stroke-purple-500/20" />
                              <text x="294" y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-red-500 animate-pulse">5</text>
                              <text x="270" y="244" textAnchor="middle" className="text-[6.5px] font-mono font-bold fill-red-500 uppercase tracking-widest">Overflow!</text>
                            </>
                          ) : (
                            <>
                              <text x="252" y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">2</text>
                              <line x1="270" y1="205" x2="270" y2="230" className="stroke-purple-500/20" />
                              <text x="288" y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">4</text>
                              <text x="270" y="244" textAnchor="middle" className="text-[6.5px] font-mono fill-muted-foreground font-bold tracking-wider">LEAF P102</text>
                            </>
                          )}
                        </g>
                      ) : (
                        // Leaf 1A and Leaf 1B after split
                        <g>
                          {/* Leaf 1A: Keys [2] */}
                          <g>
                            <motion.rect
                              key={`leaf1a-rect-${activeStep}`}
                              initial={{ opacity: 0, x: 235 }}
                              animate={{ opacity: 1, x: 170 }}
                              y={205}
                              width={45}
                              height={25}
                              rx={4}
                              className="stroke-purple-500 fill-purple-500/5 stroke-2 fill-card"
                            />
                            {/* Adjusted coordinate text for Leaf 1A */}
                            <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="192" y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">2</motion.text>
                            <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="192" y="244" textAnchor="middle" className="text-[6.5px] font-mono fill-muted-foreground font-bold tracking-wider">LEAF P102</motion.text>
                          </g>

                          {/* Leaf 1B: Keys [4, 5] (The split resulting block) */}
                          <g>
                            <motion.rect
                              key={`leaf1b-rect-${activeStep}`}
                              initial={{ opacity: 0, x: 235 }}
                              animate={{ opacity: 1, x: 290 }}
                              y={205}
                              width={70}
                              height={25}
                              rx={4}
                              className={`stroke-2 fill-card ${
                                activeStep === 2
                                  ? "stroke-green-500 fill-green-500/10"
                                  : "stroke-purple-500 fill-purple-500/5"
                              }`}
                            />
                            <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="307" y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">4</motion.text>
                            <line x1="325" y1="205" x2="325" y2="230" className="stroke-purple-500/20" />
                            <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="343" y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">5</motion.text>
                            <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="325" y="244" textAnchor="middle" className="text-[6.5px] font-mono fill-muted-foreground font-bold tracking-wider">LEAF P104</motion.text>
                          </g>
                        </g>
                      )}

                      {/* Leaf 2: Keys [6, 8, 10] */}
                      <g>
                        <motion.rect
                          key={`leaf2-rect-${activeStep}`}
                          layout
                          x={isSplit ? 430 : 410}
                          y={205}
                          width={95}
                          height={25}
                          rx={4}
                          className={`stroke-2 fill-card transition-all duration-300 ${
                            activeStep === 4 && traverseSubStep === 2
                              ? "stroke-orange-500 fill-orange-500/10"
                              : activeStep === 4 && traverseSubStep === 3
                              ? "stroke-blue-500 fill-blue-500/10"
                              : activeStep === 5
                              ? "stroke-blue-500 fill-blue-500/5"
                              : "stroke-purple-500 fill-purple-500/5"
                          }`}
                        />
                        {/* Cell 1: key 6 */}
                        <text x={isSplit ? 445 : 425} y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">6</text>
                        <line x1={isSplit ? 462 : 442} y1="205" x2={isSplit ? 462 : 442} y2="230" className="stroke-purple-500/20" />
                        
                        {/* Cell 2: key 8 (Target matching item) */}
                        <g>
                          {activeStep === 4 && traverseSubStep === 3 ? (
                            <motion.rect
                              key={`match-highlight-${activeStep}`}
                              x={isSplit ? 463 : 443}
                              y={206}
                              width={28}
                              height={23}
                              className="fill-blue-500/20 stroke-none"
                            />
                          ) : activeStep === 5 ? (
                            <motion.rect
                              key={`lookup-highlight-${activeStep}`}
                              x={isSplit ? 463 : 443}
                              y={206}
                              width={28}
                              height={23}
                              className="fill-blue-500/10 stroke-none"
                            />
                          ) : null}
                          <text x={isSplit ? 477 : 457} y="221" textAnchor="middle" className={`text-[9px] font-mono font-bold ${
                            (activeStep === 4 && traverseSubStep === 3) || activeStep === 5
                              ? "fill-blue-500 font-extrabold text-[10px]"
                              : "fill-foreground"
                          }`}>8</text>
                        </g>
                        <line x1={isSplit ? 492 : 472} y1="205" x2={isSplit ? 492 : 472} y2="230" className="stroke-purple-500/20" />

                        {/* Cell 3: key 10 */}
                        <text x={isSplit ? 508 : 488} y="221" textAnchor="middle" className="text-[9px] font-mono font-bold fill-foreground">10</text>
                        
                        <text x={isSplit ? 477 : 457} y="244" textAnchor="middle" className="text-[6.5px] font-mono fill-muted-foreground font-bold tracking-wider">LEAF P103</text>
                      </g>
                    </g>
                  )}
                </g>
              </g>

              {/* 3. PHYSICAL DISK STORAGE AREA (BOTTOM) */}
              <g>
                <rect
                  x={30}
                  y={305}
                  width={560}
                  height={100}
                  rx={8}
                  className="fill-neutral-500/5 stroke-neutral-500/20 stroke-1 stroke-dashed"
                />
                <text x="42" y="320" className="text-[8px] font-mono font-bold fill-neutral-500/80 uppercase tracking-wider">
                  Physical Storage: Heap Table Blocks on Disk Drive
                </text>

                {/* Heap records blocks */}
                {heapSlots.map((slot, idx) => {
                  if (idx === 5 && !isEveAppended) {
                    // Empty disk slot before insertion
                    return (
                      <g key="slot-empty-5" transform="translate(360, 335)">
                        <rect
                          width={52}
                          height={52}
                          rx={5}
                          className="stroke-1 stroke-dashed stroke-neutral-300 dark:stroke-neutral-800 fill-none opacity-40"
                        />
                        <text x="26" y="24" textAnchor="middle" className="text-[7.5px] font-mono fill-muted-foreground/30 font-bold uppercase">
                          Empty
                        </text>
                        <text x="26" y="36" textAnchor="middle" className="text-[6px] fill-muted-foreground/20">
                          Block 6
                        </text>
                      </g>
                    );
                  }

                  const isScanTarget = activeStep === 0 && scanIdx === idx;
                  const isMatch = isScanTarget && slot.id === 8;
                  const isLookupTarget = activeStep === 5 && slot.id === 8;
                  const isInsertedSlot = activeStep === 2 && slot.id === 5 && insertSubStep === 0;

                  return (
                    <g key={`heap-slot-${slot.id}`} transform={`translate(${slot.x}, 335)`}>
                      <motion.rect
                        key={`heap-rect-${activeStep}-${slot.id}`}
                        initial={idx === 5 ? { scale: 0, opacity: 0 } : false}
                        animate={idx === 5 ? { scale: 1, opacity: 1 } : {}}
                        width={52}
                        height={52}
                        rx={5}
                        className={`stroke-2 fill-card transition-all duration-350 ${
                          isScanTarget
                            ? isMatch
                              ? "stroke-blue-500 fill-blue-500/10 shadow-sm"
                              : "stroke-red-500 fill-red-500/10 shadow-sm"
                            : isLookupTarget
                            ? "stroke-blue-500 fill-blue-500/20 shadow-md animate-pulse"
                            : isInsertedSlot
                            ? "stroke-green-500 fill-green-500/10"
                            : "stroke-neutral-300 dark:stroke-neutral-800"
                        }`}
                      />

                      {/* Header block (ID info) */}
                      <rect
                        width={52}
                        height={16}
                        rx={3}
                        className={`transition-colors duration-300 ${
                          isScanTarget
                            ? isMatch
                              ? "fill-blue-500/20"
                              : "fill-red-500/20"
                            : isLookupTarget
                            ? "fill-blue-500/20"
                            : isInsertedSlot
                            ? "fill-green-500/20"
                            : "fill-neutral-100 dark:fill-neutral-900"
                        }`}
                      />
                      <text x="26" y="11" textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-foreground">
                        ID: {slot.id}
                      </text>

                      {/* Data elements */}
                      <text x="26" y="31" textAnchor="middle" className="text-[8px] font-mono font-bold fill-foreground">
                        {slot.label}
                      </text>
                      <text x="26" y="43" textAnchor="middle" className="text-[7px] font-mono fill-muted-foreground">
                        ${slot.val}
                      </text>

                      {/* Overlay Check / Cross markers for sequential sweep */}
                      {isScanTarget && (
                        <motion.g
                          key={`scan-marker-${activeStep}-${idx}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transform="translate(42, -5)"
                        >
                          <circle r={6.5} className={isMatch ? "fill-blue-500" : "fill-red-500"} />
                          <text textAnchor="middle" y="2.5" className="text-[7px] font-bold fill-white">
                            {isMatch ? "✓" : "✗"}
                          </text>
                        </motion.g>
                      )}

                      {/* Comparators floating blocks */}
                      {isScanTarget && (
                        <motion.g
                          key={`comparator-${activeStep}-${idx}`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transform="translate(26, -14)"
                        >
                          <rect x="-18" y="-7" width="36" height="11" rx="2.5" className="fill-slate-900/90 dark:fill-zinc-100/90" />
                          <text textAnchor="middle" y="1.5" className="text-[6px] font-mono font-bold fill-slate-100 dark:fill-slate-900">
                            {isMatch ? "8 == 8" : `${slot.id} != 8`}
                          </text>
                        </motion.g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* 4. HIGH DYNAMIC BEAMS / PARTICLES */}
              {/* Insert Sub-step 1: Key 5 flying into B+ Tree Leaf */}
              {activeStep === 2 && insertSubStep === 1 && (
                <motion.g
                  key="flying-key-5"
                  initial={{ x: 360 + 26, y: 335 + 26, scale: 0.6 }}
                  animate={{ x: 270, y: 217, scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                >
                  <circle r={10} className="fill-green-500 stroke-white stroke-[1.5px] shadow-md" />
                  <text textAnchor="middle" y={3} className="text-[8px] font-mono font-bold fill-white">5</text>
                </motion.g>
              )}

              {/* Insert Sub-step 3: Median key 4 floats to parent Root */}
              {activeStep === 2 && insertSubStep === 3 && (
                <motion.g
                  key="floating-key-4"
                  initial={{ x: 300, y: 217, scale: 0.7 }}
                  animate={{ x: 345, y: 137, scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                >
                  <circle r={10} className="fill-green-500 stroke-white stroke-[1.5px] shadow-md" />
                  <text textAnchor="middle" y={3} className="text-[8px] font-mono font-bold fill-white">4</text>
                </motion.g>
              )}

              {/* Step 4 Sub-step 1: Routing particle down to right branch */}
              {activeStep === 4 && traverseSubStep === 1 && (
                <motion.circle
                  key="routing-particle"
                  cx={385}
                  cy={148}
                  r={3.5}
                  className="fill-blue-500 shadow-md"
                  animate={{ cx: [385, 465], cy: [148, 205] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Step 5: Bookmark Pointer Lookup Line (Leaf 2 -> Page 2) */}
              {activeStep === 5 && (
                <>
                  <motion.line
                    key="laser-line"
                    x1={isSplit ? 477 : 457}
                    y1={230}
                    x2={138}
                    y2={335}
                    className="stroke-blue-500 stroke-[2px]"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                  <motion.circle
                    key="laser-particle"
                    cx={isSplit ? 477 : 457}
                    cy={230}
                    r={4}
                    className="fill-blue-500 shadow"
                    animate={{ cx: [isSplit ? 477 : 457, 138], cy: [230, 335] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                </>
              )}

              {/* Step 5: Loaded Row floating from Heap up to Buffer Pool & Client */}
              {activeStep === 5 && (
                <motion.g
                  key="floating-row"
                  initial={{ x: 138, y: 335, opacity: 0, scale: 0.8 }}
                  animate={{ x: 310, y: 40, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 1.3, ease: "easeOut" }}
                >
                  <rect x="-42" y="-14" width="84" height="28" rx="4" className="fill-slate-900/95 dark:fill-zinc-100/95 stroke-blue-500 stroke-[1.5px] shadow-lg" />
                  <text textAnchor="middle" y="-2" className="text-[6.5px] font-mono font-bold fill-blue-500 tracking-wider">RETRIEVED ROW</text>
                  <text textAnchor="middle" y="8" className="text-[7px] font-mono fill-white dark:fill-black font-semibold">row_8 ($19.99)</text>
                </motion.g>
              )}
            </svg>
        </div>

      {/* Row 2: HUD Metrics (5 cols) & Trace Logs (7 cols) side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* 1. SaaS Dashboard Metrics HUD (5 Columns) */}
        <div className="md:col-span-5 border border-border/65 rounded-2xl bg-card p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-3.5 flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Database size={13} className="text-purple-500" />
              SaaS Engine Metrics HUD
            </h3>
            
            <div className="space-y-3">
              {getHUDMetrics().map((metric, idx) => (
                <div key={`hud-metric-${idx}`} className="flex flex-col space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                      metric.status === "error"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : metric.status === "warning"
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : metric.status === "blue"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : metric.status === "green"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : metric.status === "purple"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        : metric.status === "yellow"
                        ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {metric.value}
                    </span>
                  </div>
                  <span className="text-[8.5px] text-muted-foreground/75 leading-normal">{metric.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Premium Developer Terminal Simulator (7 Columns) */}
        <div className="md:col-span-7 flex flex-col min-h-[220px]">
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Search size={12} className="text-blue-500" />
            Developer Buffer Engine Trace Logs
          </h4>
          <div className="flex-1 bg-neutral-950 text-neutral-200 rounded-xl p-3 font-mono text-[9px] leading-relaxed overflow-y-auto max-h-[240px] border border-neutral-900 shadow-inner">
            <div className="space-y-1.5">
              {getTerminalLogs().map((log, idx) => {
                let logClass = "text-neutral-300";
                if (log.startsWith("mysql>")) {
                  logClass = "text-sky-400 font-bold";
                } else if (log.includes("MATCH!") || log.includes("successfully") || log.includes("construct") || log.includes("completed")) {
                  logClass = "text-blue-400 font-semibold";
                } else if (log.includes("Warning") || log.includes("Overflow") || log.includes("Split triggered")) {
                  logClass = "text-red-400";
                } else if (log.includes("[index]") || log.includes("B+ Tree")) {
                  logClass = "text-purple-400";
                } else if (log.includes("[storage]")) {
                  logClass = "text-neutral-400";
                } else if (log.includes("val = 19.99") || log.includes("Transaction completed")) {
                  logClass = "text-emerald-400 font-semibold";
                }
                
                return (
                  <div key={`term-log-${idx}`} className={logClass}>
                    {log}
                  </div>
                );
              })}
            </div>
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
