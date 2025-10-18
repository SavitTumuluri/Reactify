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
    
}