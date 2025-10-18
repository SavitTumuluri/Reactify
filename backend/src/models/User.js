import { ddb } from '../db.js';
import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  ScanCommand,
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';

export class UserModel {
  static TABLE_NAME = process.env.DYNAMODB_USERS_TABLE_NAME || 'users';

  static async create(userData) {
    console.log('UserModel.create called with:', userData);
    console.log('Using table name:', this.TABLE_NAME);
    
    const params = {
      TableName: this.TABLE_NAME,
      Item: {
        id: userData.auth0Id, // Using auth0Id as primary key
        auth0Id: userData.auth0Id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    };

    console.log('DynamoDB params:', params);

    try {
      const result = await ddb.send(new PutCommand(params));
      console.log('User created successfully:', result);
      return params.Item;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByAuth0Id(auth0Id) {
    console.log('UserModel.findByAuth0Id called with:', auth0Id);
    console.log('Using table name:', this.TABLE_NAME);
    
    const params = {
      TableName: this.TABLE_NAME,
      Key: {
        id: auth0Id
      }
    };

    console.log('DynamoDB query params:', params);

    try {
      const result = await ddb.send(new GetCommand(params));
      console.log('DynamoDB query result:', result);
      return result.Item || null;
    } catch (error) {
      console.error('Error finding user by auth0Id:', error);
      throw error;
    }
  }

  static async findById(id) {
    const params = {
      TableName: this.TABLE_NAME,
      Key: {
        id: id
      }
    };

    try {
      const result = await ddb.send(new GetCommand(params));
      return result.Item || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async updateLastLogin(auth0Id) {
    const params = {
      TableName: this.TABLE_NAME,
      Key: {
        id: auth0Id
      },
      UpdateExpression: 'SET lastLogin = :lastLogin',
      ExpressionAttributeValues: {
        ':lastLogin': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await ddb.send(new UpdateCommand(params));
      return result.Attributes;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  static async update(auth0Id, userData) {
    const updateExpressions = [];
    const expressionAttributeValues = {};

    // Build dynamic update expression
    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = userData[key];
      }
    });

    const params = {
      TableName: this.TABLE_NAME,
      Key: {
        id: auth0Id
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await ddb.send(new UpdateCommand(params));
      return result.Attributes;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteAll() {
    // First, get all users
    const users = await this.findAll();
    
    // Delete each user
    const deletePromises = users.map(user => {
      const params = {
        TableName: this.TABLE_NAME,
        Key: {
          id: user.id
        }
      };
      return ddb.send(new DeleteCommand(params));
    });

    try {
      await Promise.all(deletePromises);
      return { count: users.length };
    } catch (error) {
      console.error('Error deleting all users:', error);
      throw error;
    }
  }

  static async findAll() {
    const params = {
      TableName: this.TABLE_NAME
    };

    try {
      const result = await ddb.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }
}
