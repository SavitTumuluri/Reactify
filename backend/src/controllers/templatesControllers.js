import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    DeleteCommand,
    QueryCommand,
    UpdateCommand,
    ScanCommand
} from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
import { docClient } from '../../server.js';
import { error } from 'console';

dotenv.config();

export class templateController{
    static tableName = 'public-canva';

    static async getAllTemplateCanvas(req, res) {
        try {
            const params = {
                TableName: templateController.tableName,
            };

            const result = await docClient.send(new ScanCommand(params));
            const items = result.Items || [];

            // Sort by likes (most popular first)
            const sortedTemplates = items.sort((a, b) => (b.likes || 0) - (a.likes || 0));

            console.log('📋 Public templates:', JSON.stringify({ 
                templates: sortedTemplates, 
                count: sortedTemplates.length 
            }, null, 2));

            res.json({
                templates: sortedTemplates,
                count: sortedTemplates.length
            });
        } catch (error) {
            console.error('Error getting public templates:', error);
            res.status(500).json({ error: 'Failed to get public templates' });
        }
    }

    static async copyTemplateToCanvas(req, res) {
        try {
            const { canvaId } = req.params; // Template canvaId
            const auth0Id = req.user.sub; // User who's copying

            console.log('📋 Copying template:', canvaId, 'for user:', auth0Id);

            // 1. Get the template from public-canva table
            const getParams = {
                TableName: templateController.tableName,
                Key: { canvaId }
            };

            const templateResult = await docClient.send(new GetCommand(getParams));

            if (!templateResult.Item) {
                return res.status(404).json({ error: 'Template not found' });
            }

            const template = templateResult.Item;

            // 2. Create a new canvas for the user with the template data
            const newCanvasId = `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const newCanvas = {
                canvasId: newCanvasId,
                userId: auth0Id,
                name: `Copy of ${template.name}`,
                canvasData: template.canvasData, // Copy the entire canvas data (ir + bo)
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                timestamp: new Date().toISOString()
            };

            // Put into the main canvas table - MAKE SURE THIS TABLE NAME IS CORRECT
            const putParams = {
                TableName: 'reactify-canvas-data', // ⚠️ Change this to your actual canvas table name!
                Item: newCanvas
            };

            await docClient.send(new PutCommand(putParams));

            // 3. Increment the template's copy count
            const updateParams = {
                TableName: templateController.tableName,
                Key: { canvaId },
                UpdateExpression: 'SET copyCount = if_not_exists(copyCount, :zero) + :inc',
                ExpressionAttributeValues: {
                    ':inc': 1,
                    ':zero': 0
                },
                ReturnValues: 'ALL_NEW'
            };

            await docClient.send(new UpdateCommand(updateParams));

            console.log('✅ Template copied successfully:', newCanvasId);

            res.json({
                message: 'Template copied successfully',
                canvas: newCanvas
            });
        } catch (error) {
            console.error('❌ Error copying template:', error);
            res.status(500).json({ error: 'Failed to copy template', details: error.message });
        }
    }

    static async likeTemplate(req, res) {
        try {
            const { canvaId } = req.params;

            console.log('👍 Liking template:', canvaId);

            const updateParams = {
                TableName: templateController.tableName,
                Key: { canvaId },
                UpdateExpression: 'SET likes = if_not_exists(likes, :zero) + :inc',
                ExpressionAttributeValues: {
                    ':inc': 1,
                    ':zero': 0
                },
                ReturnValues: 'ALL_NEW'
            };

            const result = await docClient.send(new UpdateCommand(updateParams));

            if (!result.Attributes) {
                return res.status(404).json({ error: 'Template not found' });
            }

            console.log('✅ Template liked successfully:', canvaId);

            res.json({
                message: 'Template liked successfully',
                likes: result.Attributes.likes || 0
            });
        } catch (error) {
            console.error('❌ Error liking template:', error);
            res.status(500).json({ error: 'Failed to like template', details: error.message });
        }
    }
    
}