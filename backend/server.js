import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import routes from './src/routes/index.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SocketHandler } from './src/websocket/socketHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5006;

// Middleware
app.use(helmet());
const FRONTEND_URL = process.env.FRONTEND_URL;
const PRODUCTION_URL = "http://3.139.56.157";
const allowedOrigins = [FRONTEND_URL, PRODUCTION_URL].filter(Boolean);

app.use(cors({ 
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
  methods: ["GET","POST","DELETE","OPTIONS","PUT"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api', routes);

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const docClient = DynamoDBDocumentClient.from(client);

// Initialize Socket.IO
const socketHandler = new SocketHandler(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}!`);
  console.log(`Socket.IO server initialized`);
});