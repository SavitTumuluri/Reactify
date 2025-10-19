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

// Serialization function (same as in canvaController)
function serializeCanvasDataForStorage(canvasData) {
  try {
    return JSON.stringify(canvasData);
  } catch {
    return JSON.stringify({ error: 'Failed to serialize canvasData' });
  }
}

dotenv.config();

export class templateController{
    static tableName = 'public-canva';

    // Generate S3 preview URL for templates
    static generatePreviewUrl(canvaId) {
        const bucket = process.env.S3_BUCKET || 'reactify-canvas-previews';
        const region = process.env.AWS_REGION || 'us-east-1';
        return `https://${bucket}.s3.${region}.amazonaws.com/canvas-previews/templates/${canvaId}.png`;
    }

    static async getAllTemplateCanvas(req, res) {
        try {
            const params = {
                TableName: templateController.tableName,
            };

            const result = await docClient.send(new ScanCommand(params));
            const items = result.Items || [];

            // Sort by likes (most popular first)
            const sortedTemplates = items.sort((a, b) => (b.likes || 0) - (a.likes || 0));

            // Add S3 preview URLs to each template
            const templatesWithPreviews = sortedTemplates.map(template => {
                const previewUrl = template.previewUrl || templateController.generatePreviewUrl(template.canvaId);
                return {
                    ...template,
                    previewUrl,
                    s3: previewUrl // Add data-s3 attribute equivalent
                };
            });

   
            res.json({
                templates: templatesWithPreviews,
                count: templatesWithPreviews.length
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get public templates' });
        }
    }

    static async copyTemplateToCanvas(req, res) {
        try {
            const { canvaId } = req.params; // Template canvaId
            const auth0Id = req.user.sub; // User who's copying


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
            
            // Parse and preserve the original IR data structure
            let canvasData = {};
            try {
                // Parse the template canvaData (note: it's canvaData, not canvasData)
                let parsedTemplateData = {};
                if (typeof template.canvaData === 'string') {
                    parsedTemplateData = JSON.parse(template.canvaData);
                } else if (template.canvaData && typeof template.canvaData === 'object') {
                    parsedTemplateData = template.canvaData;
                }
                
                console.log('Template canvaData type:', typeof template.canvaData);
                console.log('Parsed template data keys:', Object.keys(parsedTemplateData));
                
                // Ensure we have the IR structure properly formatted
                if (parsedTemplateData && Object.keys(parsedTemplateData).length > 0) {
                    // If the data has an 'ir' property, use it directly
                    if (parsedTemplateData.ir) {
                        canvasData = {
                            ir: parsedTemplateData.ir
                        };
                        console.log('Using template IR data directly');
                    } 
                    // If the data IS the IR structure itself, wrap it
                    else if (parsedTemplateData.name === 'IRCanvasContainer') {
                        canvasData = {
                            ir: parsedTemplateData
                        };
                        console.log('Wrapping template data as IR');
                    }
                    // Otherwise, use the data as-is (it might be the full canvas data)
                    else {
                        canvasData = JSON.parse(JSON.stringify(parsedTemplateData)); // Deep clone everything
                        console.log('Using parsed template data as-is');
                    }
                } else {
                    console.log('No valid template data found, using fallback');
                    canvasData = {
                        ir: {
                            name: 'IRCanvasContainer',
                            _data: {
                                size: { w: 1200, h: 800 },
                                styles: { canvasBackground: '#ffffff' }
                            },
                            children: []
                        }
                    };
                }
                
                console.log('Final canvasData structure:', JSON.stringify(canvasData, null, 2));
                
            } catch (error) {
                console.error('Error parsing template canvaData:', error);
                // Fallback if parsing fails
                canvasData = {
                    ir: {
                        name: 'IRCanvasContainer',
                        _data: {
                            size: { w: 1200, h: 800 },
                            styles: { canvasBackground: '#ffffff' }
                        },
                        children: []
                    }
                };
            }
            const newCanvas = {
                canvasId: newCanvasId,
                userId: auth0Id,
                name: template.name,
                canvasData: serializeCanvasDataForStorage(canvasData), // Use proper serialization
                previewUrl: template.previewUrl || templateController.generatePreviewUrl(template.canvaId), // Copy previewUrl from template
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

            res.json({
                message: 'Template copied successfully',
                canvas: newCanvas
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to copy template', details: error.message });
        }
    }

    static async likeTemplate(req, res) {
        try {
            const { canvaId } = req.params;


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

            res.json({
                message: 'Template liked successfully',
                likes: result.Attributes.likes || 0
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to like template', details: error.message });
        }
    }
    
}