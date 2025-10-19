import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
import { docClient } from '../../server.js';

dotenv.config();

// Helper function to normalize canvas data
function normalizeCanvasData(canvasData) {
  if (!canvasData) return {};
  if (typeof canvasData === 'string') {
    try {
      return JSON.parse(canvasData);
    } catch {
      return {};
    }
  }
  return canvasData;
}

function serializeCanvasDataForStorage(canvasData) {
  try {
    return JSON.stringify(canvasData);
  } catch {
    return JSON.stringify({ error: 'Failed to serialize canvasData' });
  }
}

// ---- Controller ----
export class canvaController {
  static tableName = 'reactify-canvas-data';

  static async createCanva(req, res) {
    try {
      console.log('Creating Canvas with data:', req.body);
      const auth0Id = req.user.sub;
      const now = new Date().toISOString();

      if (!req.body.name) {
        return res.status(400).json({ error: 'Canvas name is required' });
      }

      const canvasId = `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const params = {
        TableName: canvaController.tableName,
        Item: {
          userId: auth0Id,
          canvasId: canvasId,
          name: req.body.name,
          timestamp: now,
          updatedAt: now,
          canvasData: '{}',
        },
      };

      await docClient.send(new PutCommand(params));
    
      res.json({
        message: 'Canvas created successfully',
        canvas: {
          canvasId: canvasId,
          name: req.body.name,
          timestamp: now,
          canvasData: {},
        }
      });

    } catch (error) {
      console.error('Error creating canvas:', error);
      res.status(500).json({ error: 'Failed to create canvas' });
    }
  }

  static async getUserCanvas(req, res) {
    try {
      const auth0Id = req.user.sub;
      const { canvasId } = req.params;

      if (!canvasId) {
        return res.status(400).json({ error: 'canvasId is required' });
      }

      const params = {
        TableName: canvaController.tableName,
        Key: {
          userId: auth0Id,
          canvasId: canvasId,
        },
      };

      const result = await docClient.send(new GetCommand(params));
      
      if (!result.Item) {
        return res.status(404).json({ error: 'Canvas not found' });
      }

      const dataObj = normalizeCanvasData(result.Item.canvasData);

      res.json({
        canvas: {
          ...result.Item,
          canvasData: dataObj,
        }
      });
    } catch (error) {
      console.error('Error getting canvas data:', error);
      res.status(500).json({ error: 'Failed to get canvas data' });
    }
  }

  static async getAllUserCanvas(req, res) {
    try {
      const auth0Id = req.user.sub;

      const params = {
        TableName: canvaController.tableName,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': auth0Id
        }
      };

      const result = await docClient.send(new QueryCommand(params));
      const items = result.Items || [];

      const canvases = items.map((item) => {
        const parsed = normalizeCanvasData(item.canvasData);
        return {
          ...item,
          canvasData: parsed,
        };
      });

      console.log('📋 Canvases response:', JSON.stringify({ canvases, count: canvases.length }, null, 2));

      res.json({
        canvases: canvases,
        count: canvases.length
      });
    } catch (error) {
      console.error('Error getting user canvases:', error);
      res.status(500).json({ error: 'Failed to get user canvases' });
    }
  }

  static async debugGetAllCanvas(req, res) {
    try {
      const auth0Id = req.user.sub;
      console.log('🔍 Debug - Auth0 ID:', auth0Id);
      console.log('🔍 Debug - Table Name:', canvaController.tableName);

      const params = {
        TableName: canvaController.tableName,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': auth0Id
        }
      };

      const result = await docClient.send(new QueryCommand(params));
      console.log('🔍 Debug - Raw DynamoDB result:', JSON.stringify(result, null, 2));

      res.json({
        auth0Id: auth0Id,
        tableName: canvaController.tableName,
        rawResult: result,
        itemCount: result.Items?.length || 0,
      });
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  }

  static async updateCanvasData(req, res) {
    try {
      const auth0Id = req.user.sub;
      const { canvasId } = req.params;
      const { canvasData, name } = req.body;

      if (!canvasId) {
        return res.status(400).json({ error: 'canvasId is required' });
      }

      const now = new Date().toISOString();
      const serializedData = serializeCanvasDataForStorage(canvasData || {});

      // Build update expression dynamically
      let updateExpression = 'SET updatedAt = :now';
      const expressionAttributeValues = { ':now': now };

      if (canvasData !== undefined) {
        updateExpression += ', canvasData = :data';
        expressionAttributeValues[':data'] = serializedData;
      }

      if (name !== undefined) {
        updateExpression += ', #name = :name';
        expressionAttributeValues[':name'] = name;
      }

      const params = {
        TableName: canvaController.tableName,
        Key: {
          userId: auth0Id,
          canvasId: canvasId,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(name !== undefined && { ExpressionAttributeNames: { '#name': 'name' } }),
        ReturnValues: 'ALL_NEW',
      };

      const result = await docClient.send(new UpdateCommand(params));

      res.json({
        message: 'Canvas updated successfully',
        canvas: {
          ...result.Attributes,
          canvasData: normalizeCanvasData(result.Attributes.canvasData),
        }
      });
    } catch (error) {
      console.error('Error updating canvas data:', error);
      res.status(500).json({ error: 'Failed to update canvas' });
    }
  }

  static async updateCanvasPreview(req, res) {
    try {
      const auth0Id = req.user.sub;
      const { canvasId } = req.params;
      const { previewUrl } = req.body;

      if (!canvasId) {
        return res.status(400).json({ error: 'canvasId is required' });
      }

      if (!previewUrl) {
        return res.status(400).json({ error: 'previewUrl is required' });
      }

      const now = new Date().toISOString();

      const params = {
        TableName: canvaController.tableName,
        Key: {
          userId: auth0Id,
          canvasId: canvasId,
        },
        UpdateExpression: 'SET previewUrl = :previewUrl, updatedAt = :now',
        ExpressionAttributeValues: {
          ':previewUrl': previewUrl,
          ':now': now
        },
        ReturnValues: 'ALL_NEW',
      };

      const result = await docClient.send(new UpdateCommand(params));

      res.json({
        message: 'Canvas preview updated successfully',
        canvas: {
          ...result.Attributes,
          canvasData: normalizeCanvasData(result.Attributes.canvasData),
        }
      });
    } catch (error) {
      console.error('Error updating canvas preview:', error);
      res.status(500).json({ error: 'Failed to update canvas preview' });
    }
  }

  static async deleteCanvasData(req, res) {
    try {
      const auth0Id = req.user.sub;
      const { canvasId } = req.params;
  
      if (!canvasId) {
        return res.status(400).json({ error: 'canvasId is required' });
      }
  
      // ✅ Check if the canvas exists first
      const getParams = {
        TableName: canvaController.tableName,
        Key: {
          userId: auth0Id,
          canvasId: canvasId,
        },
      };
  
      const getResult = await docClient.send(new GetCommand(getParams));
  
      if (!getResult.Item) {
        return res.status(404).json({ 
          success: false,
          error: 'Canvas not found, cannot delete' 
        });
      }
  
      // ✅ Canvas exists — proceed to delete
      const deleteParams = {
        TableName: canvaController.tableName,
        Key: {
          userId: auth0Id,
          canvasId: canvasId,
        },
      };
  
      await docClient.send(new DeleteCommand(deleteParams));
  
      res.json({ 
        success: true,
        message: 'Canvas deleted successfully',
        canvasId: canvasId
      });
  
    } catch (error) {
      console.error('Error deleting canvas data:', error);
      res.status(500).json({ error: 'Failed to delete canvas' });
    }
  }
  
}