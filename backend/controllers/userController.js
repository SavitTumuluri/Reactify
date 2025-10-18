import { UserModel } from '../src/models/User.js';

export class UserController {
  static async createUser(req, res) {
    try {
      console.log('Creating user with data:', req.body);
      const { auth0Id, email, name, picture } = req.body;
      
      if (!auth0Id || !email || !name) {
        console.log('Missing required fields:', { auth0Id, email, name });
        return res.status(400).json({ error: 'Missing required user data' });
      }
      
      // Check if user already exists
      const existingUser = await UserModel.findByAuth0Id(auth0Id);
      
      if (existingUser) {
        // Update last login for existing user
        const updatedUser = await UserModel.updateLastLogin(auth0Id);
        return res.json({
          message: 'User already exists, login updated',
          user: updatedUser
        });
      }
      
      // Create new user
      const newUser = await UserModel.create({
        auth0Id,
        email,
        name,
        picture
      });
      
      res.json({
        message: 'User created successfully',
        user: newUser
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async getUserById(req, res) {
    try {
      const userId = req.params.id;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        message: 'User data retrieved successfully',
        user
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  static async getUserByAuth0Id(req, res) {
    try {
      console.log('Getting user by Auth0 ID:', req.user);
      const auth0Id = req.user.sub;
      console.log('Auth0 ID:', auth0Id);
      
      const user = await UserModel.findByAuth0Id(auth0Id);
      console.log('Found user:', user);
      
      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({ error: 'User not found in database' });
      }
      
      res.json({
        message: 'User data retrieved successfully',
        user,
        auth0User: req.user
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  }

}
