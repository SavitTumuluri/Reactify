import { Save, Load } from "./Save"
import { IR } from "../core/IR"
import {saveToDB, loadFromDB} from "./DatabaseService"
import websocketService from "../../lib/websocketService";
import { useAuth } from "../../lib/AuthContext";
import {useState, useEffect} from "react"
import {HistoryManager} from "./HistoryManager"
import { useParams, useNavigate } from "react-router-dom";


// ---------------- GlobalStateManager unchanged except for export ----------------

class GlobalStateManager {
  root
  setRoot
  history

  canvasId
  userId
  connected
  constructor() { this.history = new HistoryManager() }
  init(ir, setIR) {
    this.root = ir;
    this.setRoot = setIR
    const { user } = useAuth();
    const userId = user?.sub;
    const [isConnected, setIsConnected] = useState(false);
    this.connected=isConnected

    if(!userId) {
        console.error("No user ID!")
    }
    if(userId) {
        this.userId = userId
    }
    const navigate = useNavigate();


    const { canvasId: urlCanvasId } = useParams();
    const [canvasId, setCanvasId] = useState(() => urlCanvasId);


    //this.canvasId = canvasId
    // Keep URL in sync with canvasId (no reload)
    useEffect(() => {
    if (canvasId && canvasId !== urlCanvasId) 
        navigate(`/editor/${canvasId}`, { replace: true });
    }, [canvasId, urlCanvasId, navigate]);
    

      // --- SOCKET: connect + live status subscription
    useEffect(() => {
        const serverUrl = import.meta.env?.VITE_BACKEND_URL || "http://localhost:5006";
        websocketService.connect(serverUrl);
        const handler = ({ isConnected }) => setIsConnected(isConnected);
        websocketService.onStatusChange(handler);
        return () => websocketService.offStatusChange(handler);
    }, []);
    
      // Load canvas data from DB on mount / id change
    useEffect(() => {
        this.canvasId = canvasId
        stateman.load(canvasId,userId)
    }, [userId, canvasId]);
    
}


  async save() {
    if(!this.canvasId || !this.userId || !this.root) {
        console.error("Could not save: Canvas/User ID missing")
        return
    }
    const payload = {
        ir: Save(this.root),
        timestamp: new Date().toISOString(),
    };
    console.log(payload);
    await saveToDB(payload, this.userId, this.canvasId, this.root._data.componentName);
  }
  async load(canvasId, userId) {
    this.canvasId=canvasId
    this.userId=userId
    
    if (!userId || !canvasId) return;
        try {
        const dataString = await loadFromDB(userId, canvasId);
        if (dataString) {
            const parsed = dataString;
            const maybeIR = parsed?.ir ?? parsed;
            const loaded = Load(maybeIR);
            if (loaded) {
                this.history.clear()
                this.setRoot(loaded);
            }
        }}
    catch (error) {
        console.error("Error loading canvas:", error);
    }
  }
}

let stateman = new GlobalStateManager()
window.stateman=stateman
window.hist=stateman.history
export default function getStateManager() { return stateman }
