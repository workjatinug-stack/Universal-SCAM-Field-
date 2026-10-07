import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { analyzeContent, SourceType } from "../scamAnalyzer";

interface ScamAnalysisRequest {
  content: string;
  sourceType: SourceType;
  userId?: number;
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

export class WebSocketManager {
  private io: SocketIOServer;
  private analysisQueue: Map<string, ScamAnalysisRequest> = new Map();
  private analysisResults: Map<string, ScamAnalysisResponse> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    this.setupAnalysisQueue();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle real-time scam analysis requests
      socket.on("analyze_scam", async (data: ScamAnalysisRequest) => {
        const requestId = `${socket.id}-${Date.now()}`;
        
        try {
          // Add to queue
          this.analysisQueue.set(requestId, data);
          
          // Emit acknowledgment
          socket.emit("analysis_queued", { requestId, queueSize: this.analysisQueue.size });

          // Process analysis
          const result = await analyzeContent(data.content, data.sourceType);
          
          const response: ScamAnalysisResponse = {
            ...result,
            timestamp: new Date(),
          };

          // Store result
          this.analysisResults.set(requestId, response);
          
          // Send result back to client
          socket.emit("analysis_result", { requestId, result: response });
          
          // Clean up
          this.analysisQueue.delete(requestId);
          
          // Broadcast to admin dashboard if high risk
          if (result.riskScore >= 60) {
            this.io.emit("high_risk_alert", {
              requestId,
              riskScore: result.riskScore,
              scamType: result.scamType,
              timestamp: response.timestamp,
            });
          }
        } catch (error) {
          socket.emit("analysis_error", { 
            requestId, 
            error: error instanceof Error ? error.message : "Analysis failed" 
          });
          this.analysisQueue.delete(requestId);
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Clean up any pending requests for this socket
        const keysToDelete: string[] = [];
        this.analysisQueue.forEach((_, key) => {
          if (key.startsWith(socket.id)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => this.analysisQueue.delete(key));
      });

      // Handle real-time monitoring subscription
      socket.on("subscribe_monitoring", () => {
        socket.join("monitoring");
        socket.emit("monitoring_subscribed", { active: true });
      });

      socket.on("unsubscribe_monitoring", () => {
        socket.leave("monitoring");
        socket.emit("monitoring_unsubscribed", { active: false });
      });
    });
  }

  private setupAnalysisQueue() {
    // Process queue every 100ms to prevent overwhelming the system
    setInterval(() => {
      if (this.analysisQueue.size > 0) {
        console.log(`Processing ${this.analysisQueue.size} queued analyses`);
      }
    }, 100);
  }

  // Broadcast system-wide alerts
  public broadcastAlert(alert: {
    type: "system" | "security" | "maintenance";
    message: string;
    severity: "low" | "medium" | "high" | "critical";
  }) {
    this.io.emit("system_alert", alert);
  }

  // Get active connections count
  public getActiveConnections(): number {
    return this.io.engine.clientsCount;
  }

  // Get queue statistics
  public getQueueStats() {
    return {
      queueSize: this.analysisQueue.size,
      activeConnections: this.getActiveConnections(),
      resultsCached: this.analysisResults.size,
    };
  }

  // Close the WebSocket server
  public close() {
    this.io.close();
  }
}

let wsManager: WebSocketManager | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(httpServer);
    console.log("WebSocket server initialized");
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}
