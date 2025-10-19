import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const S3_PREVIEW_URL = 'https://reactify-bucket.s3.us-east-2.amazonaws.com/canvas-previews/users/auth0|68f4395d09256080d3c406fe/canvas-1760855095584-o6xkvxrja.png';

async function updateTemplateWithS3() {
  try {
    console.log('Updating template with S3 preview URL...');
    
    // Update the template record with the S3 URL
    const updateParams = {
      TableName: 'public-canva',
      Key: {
        canvaId: 'canvas-1760813729289-pb2argerx'
      },
      UpdateExpression: 'SET previewUrl = :previewUrl, s3 = :s3',
      ExpressionAttributeValues: {
        ':previewUrl': S3_PREVIEW_URL,
        ':s3': S3_PREVIEW_URL
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    
    console.log('Successfully updated template with S3 URL:');
    console.log(JSON.stringify(result.Attributes, null, 2));
    
  } catch (error) {
    console.error('Error updating template:', error);
  }
}

// Run the update
updateTemplateWithS3();
