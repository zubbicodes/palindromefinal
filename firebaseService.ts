// FirebaseService.ts (in project root)
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { FirebaseStorage, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

// Define types for better TypeScript support
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User | null;
  error?: string;
  code?: string;
}

export interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

class FirebaseService {
  // Singleton instance
  private static instance: FirebaseService;

  // Firebase services
  public app: FirebaseApp;
  public auth: Auth;
  public storage: FirebaseStorage;

  private constructor() {
    // Firebase configuration from environment variables
    const firebaseConfig: FirebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    };

    // Validate configuration
    this.validateConfig(firebaseConfig);

    // Initialize Firebase
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.storage = getStorage(this.app);

    console.log('FirebaseService initialized successfully');
  }

  // Singleton pattern - get instance
  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Validate Firebase configuration
  private validateConfig(config: FirebaseConfig): void {
    const requiredFields: (keyof FirebaseConfig)[] = [
      'apiKey', 'authDomain', 'projectId',
      'storageBucket', 'messagingSenderId', 'appId'
    ];

    const missingFields = requiredFields.filter(field => !config[field]?.trim());

    if (missingFields.length > 0) {
      throw new Error(
        `Missing Firebase configuration fields: ${missingFields.join(', ')}. ` +
        'Please check your .env file.'
      );
    }
  }

  // ==================== AUTHENTICATION METHODS ====================

  /**
   * Sign up a new user with email and password
   */
  async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Update profile if displayName provided
      if (displayName && userCredential.user) {
        try {
          console.log('[FirebaseService] Updating profile...');
          await this.withTimeout(
            updateProfile(userCredential.user, { displayName }),
            5000,
            'Auth: updateProfile'
          );
          console.log('[FirebaseService] Profile updated');
        } catch (e) {
          console.warn('[FirebaseService] Profile update failed (non-critical):', e);
        }
      }

      // Send email verification
      try {
        console.log('[FirebaseService] Sending verification email...');
        await this.withTimeout(
          sendEmailVerification(userCredential.user),
          5000,
          'Auth: sendEmailVerification'
        );
        console.log('[FirebaseService] Verification email sent');
      } catch (e) {
        console.warn('[FirebaseService] Email verification failed (non-critical):', e);
      }

      return {
        success: true,
        user: userCredential.user
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Check email verification (optional)
      if (!userCredential.user.emailVerified) {
        // You can choose to sign out or allow access
        console.warn('Email not verified');
      }

      return {
        success: true,
        user: userCredential.user
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        code: error.firebaseCode || error.code
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthResult> {
    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reset password via email
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<AuthResult> {
    const user = this.auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'No user is currently signed in'
      };
    }

    try {
      await updateProfile(user, updates);
      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper to race a promise against a timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000, operationName: string): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutHandle!);
      return result;
    } catch (error) {
      clearTimeout(timeoutHandle!);
      throw error;
    }
  }

  // ==================== STORAGE METHODS ====================

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(
    fileUri: string,
    path: string,
    metadata?: any
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log(`[FirebaseService] Starting upload for ${path}...`);

      // Convert URI to Blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Create storage reference
      const storageRef = ref(this.storage, path);

      // Upload bytes
      console.log('[FirebaseService] Uploading bytes...');
      await uploadBytes(storageRef, blob, metadata);
      console.log('[FirebaseService] Upload complete');

      // Get download URL
      const url = await getDownloadURL(storageRef);
      console.log('[FirebaseService] Download URL:', url);

      return { success: true, url };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return !!this.app && !!this.auth;
  }

  /**
   * Get Firebase configuration (for debugging)
   */
  getConfig(): FirebaseConfig {
    return {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    };
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();
export default firebaseService;