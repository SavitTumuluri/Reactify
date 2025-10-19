import websocketService from "../../lib/websocketService";

/**
 * Save a string to the database
 * @param {string} data - The string data to save
 * @param {string} userId - The user ID
 * @param {string} canvasId - The canvas ID
 * @param {string} canvasName - Optional canvas name
 * @returns {Promise<void>}
 */
export async function saveToDB(data, userId, canvasId, canvasName = null) {

  if (!userId || !canvasId) {
    console.error('saveToDB: userId and canvasId are required');
    return;
  }

  try {
    // Standardize payload: store IR under `ir`
    const canvasData = {
      ir: (data && data.ir) ? data.ir : data,
    };

    // Save via WebSocket
    const success = websocketService.saveCanvasData(
      userId,
      canvasId,
      canvasData,
      canvasName
    );

    if (success) {
      console.log('saveToDB: Data saved successfully', { userId, canvasId });
    } else {
      console.error('saveToDB: WebSocket not connected');
    }
  } catch (error) {
    console.error('saveToDB: Error saving data', error);
    throw error;
  }
}

/**
 * Load a string from the database
 * @param {string} userId - The user ID
 * @param {string} canvasId - The canvas ID
 * @returns {Promise<string>} - The loaded string data
 */
export async function loadFromDB(userId, canvasId) {
  if (!userId || !canvasId) {
    console.error('loadFromDB: userId and canvasId are required');
    return '';
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('loadFromDB: Timeout waiting for response'));
    }, 5000);

    const handleCanvasData = (data) => {
      if (data.canvasId === canvasId && data.userId === userId) {
        cleanup();

        try {
          // Parse the canvas data (server stores JSON string)
          const parsed = typeof data.canvasData === 'string'
            ? JSON.parse(data.canvasData)
            : data.canvasData;

          // Return IR object when available
          const irObject = parsed?.ir ?? parsed ?? null;
          console.log('loadFromDB: Data loaded successfully', { userId, canvasId });
          resolve(irObject);
        } catch (error) {
          console.error('loadFromDB: Error parsing data', error);
          resolve(null);
        }
      }
    };

    const handleCanvasError = (error) => {
      cleanup();
      console.error('loadFromDB: Error loading data', error);
      resolve(''); // Resolve with empty string instead of rejecting
    };

    const cleanup = () => {
      clearTimeout(timeout);
      websocketService.offCanvasDataResponse(handleCanvasData);
      websocketService.offCanvasDataError(handleCanvasError);
    };

    // Subscribe to WebSocket events
    websocketService.onCanvasDataResponse(handleCanvasData);
    websocketService.onCanvasDataError(handleCanvasError);

    // Request canvas data from backend
    console.log('loadFromDB: Requesting data', { userId, canvasId });
    websocketService.getCanvasData(userId, canvasId);
  });
}

