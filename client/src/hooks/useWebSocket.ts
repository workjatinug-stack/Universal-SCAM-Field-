import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface ScamAnalysisRequest {
  content: string;
  sourceType: "message" | "website" | "email" | "screenshot" | "payment" | "call" | "document";
}

interface ScamAnalysisResponse {
  riskScore: number;
  riskBand: string;
  scamType: string;
  reasons: string[];
  recommendation: string;
  matchedIndicators: string[];
  timestamp: Date;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [queueStats, setQueueStats] = useState({ queueSize: 0, activeConnections: 0 });
  const [lastResult, setLastResult] = useState<ScamAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const analysisCallbacksRef = useRef<Map<string, (result: ScamAnalysisResponse) => void>>(new Map());

  useEffect(() => {
    if (!autoConnect) return;

    const socket = io({
      reconnectionAttempts,
      reconnectionDelay,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err: Error) => {
      console.error("WebSocket connection error:", err);
      setError(err.message);
      setIsConnected(false);
    });

    socket.on("analysis_queued", (data: { queueSize: number }) => {
      console.log("Analysis queued:", data);
      setQueueStats({
        queueSize: data.queueSize,
        activeConnections: queueStats.activeConnections,
      });
    });

    socket.on("analysis_result", (data: { requestId: string; result: ScamAnalysisResponse }) => {
      const { requestId, result } = data;
      console.log("Analysis result received:", requestId);
      
      setLastResult(result);
      setIsAnalyzing(false);
      
      // Call the callback if one exists for this request
      const callback = analysisCallbacksRef.current.get(requestId);
      if (callback) {
        callback(result);
        analysisCallbacksRef.current.delete(requestId);
      }
    });

    socket.on("analysis_error", (data: { requestId: string; error: string }) => {
      console.error("Analysis error:", data);
      setError(data.error);
      setIsAnalyzing(false);
      
      // Remove the callback for this request
      analysisCallbacksRef.current.delete(data.requestId);
    });

    socket.on("high_risk_alert", (data: { requestId: string; riskScore: number; scamType: string; timestamp: Date }) => {
      console.warn("High risk alert:", data);
      // You can trigger a toast notification here
    });

    socket.on("system_alert", (data: { type: string; message: string; severity: string }) => {
      console.log("System alert:", data);
      // You can trigger a system-wide notification here
    });

    // Fetch WebSocket stats periodically
    const statsInterval = setInterval(() => {
      if (isConnected) {
        fetch("/api/stats/websocket")
          .then(res => res.json())
          .then(stats => setQueueStats(stats))
          .catch(err => console.error("Failed to fetch WebSocket stats:", err));
      }
    }, 5000);

    return () => {
      clearInterval(statsInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, reconnectionAttempts, reconnectionDelay]);

  const analyzeScam = (
    request: ScamAnalysisRequest,
    callback?: (result: ScamAnalysisResponse) => void
  ): Promise<ScamAnalysisResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !isConnected) {
        const errorMsg = "WebSocket not connected";
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      const requestId = `${socketRef.current.id}-${Date.now()}`;

      if (callback) {
        analysisCallbacksRef.current.set(requestId, callback);
      }

      // Set up a one-time resolver for this request
      const resolver = (result: ScamAnalysisResponse) => {
        resolve(result);
      };
      analysisCallbacksRef.current.set(requestId, resolver);

      socketRef.current.emit("analyze_scam", request);

      // Set a timeout for the analysis
      setTimeout(() => {
        if (analysisCallbacksRef.current.has(requestId)) {
          analysisCallbacksRef.current.delete(requestId);
          setIsAnalyzing(false);
          reject(new Error("Analysis timeout"));
        }
      }, 30000); // 30 second timeout
    });
  };

  const subscribeToMonitoring = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("subscribe_monitoring");
    }
  };

  const unsubscribeFromMonitoring = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("unsubscribe_monitoring");
    }
  };

  return {
    isConnected,
    isAnalyzing,
    lastResult,
    error,
    queueStats,
    analyzeScam,
    subscribeToMonitoring,
    unsubscribeFromMonitoring,
  };
}
