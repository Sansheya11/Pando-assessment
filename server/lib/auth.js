const jwt = require('jsonwebtoken');
const User = require('../schemas/user.schema');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

class AuthService {
  // Register new user
  static async register(userData) {
    try {
      const { email, username } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        }
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Login user
  static async login(email, password) {
    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        }
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  // Verify token
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }
}

module.exports = AuthService; 