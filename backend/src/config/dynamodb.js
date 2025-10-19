// config/dynamodb.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

// ---- DynamoDB clients ----
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// ---- Helpers ----
/**
 * Ensure canvasData is an object (not a string), parsing when needed.
 * Also de-stringify canvasData.ir if it happens to be a JSON string.
 */
function normalizeCanvasData(maybeData) {
  let data = maybeData;

  // If the whole canvasData is stored as a string, parse it
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // keep as string if it can't be parsed
      return maybeData;
    }
  }

  // If IR is a stringified JSON, parse it to an object
  if (data && typeof data.ir === 'string') {
    try {
      data.ir = JSON.parse(data.ir);
    } catch {
      // ignore if it can't be parsed
    }
  }

  return data;
}

/**
 * Prepare canvasData for storage: keep as a JSON string in DynamoDB.
 * If ir is an object, we can keep it as is; the whole canvasData is stringified anyway.
 */
function serializeCanvasDataForStorage(canvasData) {
  try {
    return JSON.stringify(canvasData);
  } catch {
    // As a last resort, store a minimal payload
    return JSON.stringify({ error: 'Failed to serialize canvasData' });
  }
}

// ---- Services ----
export class CanvasDataService {
  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'reactify-canvas-data';
    console.log(`[CanvasDataService] Using canvas table: ${this.tableName}`);
  }

  /**
   * Upsert canvas data
   */
  async saveCanvasData(userId, canvasId, canvasData, canvasName = null) {
    try {
      const now = new Date().toISOString();

      // Check if canvas exists to determine whether to use Put or Update
      let existingCanvas = null;
      try {
        existingCanvas = await this.getCanvasData(userId, canvasId);
      } catch {
        // Canvas doesn't exist yet
      }

      if (existingCanvas) {
        // Canvas exists - use UpdateCommand to only update canvasData and updatedAt
        // This preserves the existing name and other fields
        const params = {
          TableName: this.tableName,
          Key: {
            userId: userId,
            canvasId: canvasId,
          },
          UpdateExpression: 'SET canvasData = :data, updatedAt = :now',
          ExpressionAttributeValues: {
            ':data': serializeCanvasDataForStorage(canvasData),
            ':now': now,
          },
        };

        await docClient.send(new UpdateCommand(params));
      } else {
        // Canvas doesn't exist - use PutCommand with default name
        const params = {
          TableName: this.tableName,
          Item: {
            userId: userId,
            canvasId: canvasId,
            canvasData: serializeCanvasDataForStorage(canvasData),
            name: canvasName || `Canvas ${canvasId.slice(-8)}`,
            timestamp: now,
            updatedAt: now,
          },
        };

        await docClient.send(new PutCommand(params));
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving canvas data:', error);
      throw error;
    }
  }

  /**
   * Get a single canvas
   * Returns: { userId, canvasId, name, timestamp, updatedAt, canvasData: <object> } | undefined
   */
  async getCanvasData(userId, canvasId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          userId: userId,
          canvasId: canvasId,
        },
      };

      console.log(`[CanvasDataService] Getting canvas data for userId=${userId}, canvasId=${canvasId}`);
      const result = await docClient.send(new GetCommand(params));
      if (!result.Item) {
        console.log(`[CanvasDataService] No canvas found for userId=${userId}, canvasId=${canvasId}`);
        return undefined;
      }

      console.log(`[CanvasDataService] Raw canvas data from DB:`, JSON.stringify(result.Item, null, 2));
      const dataObj = normalizeCanvasData(result.Item.canvasData);
      console.log(`[CanvasDataService] Normalized canvas data:`, JSON.stringify(dataObj, null, 2));

      return {
        ...result.Item,
        canvasData: dataObj, // <-- object returned to callers
      };
    } catch (error) {
      console.error('Error getting canvas data:', error);
      throw error;
    }
  }

  /**
   * List all canvases for a user
   * Returns array of items with canvasData as an object (NOT a string)
   */
  async getUserCanvases(userId) {
    try {
      const params = {
        TableName: this.tableName,
        // MUST include the partition key in the KeyConditionExpression
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': userId,
        },
      };

      const result = await docClient.send(new QueryCommand(params));
      const items = result.Items || [];

      return items.map((item) => {
        const parsed = normalizeCanvasData(item.canvasData);
        return {
          ...item,
          canvasData: parsed, // <-- object returned to callers
        };
      });
    } catch (error) {
      console.error('Error getting user canvases:', error);
      throw error;
    }
  }

  /**
   * Delete a canvas
   */
  async deleteCanvasData(userId, canvasId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          userId: userId,
          canvasId: canvasId,
        },
      };

      await docClient.send(new DeleteCommand(params));
      return { success: true };
    } catch (error) {
      console.error('Error deleting canvas data:', error);
      throw error;
    }
  }
}

export class UserService {
  constructor() {
    this.usersTableName = process.env.DYNAMODB_USERS_TABLE_NAME || 'users';
  }

  async getUserById(userId) {
    try {
      const params = {
        TableName: this.usersTableName,
        Key: { id: userId },
      };
      const result = await docClient.send(new GetCommand(params));
      return result.Item;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async verifyUserExists(userId) {
    try {
      const user = await this.getUserById(userId);
      return !!user;
    } catch (error) {
      console.error('Error verifying user:', error);
      return false;
    }
  }
}

export default docClient;
