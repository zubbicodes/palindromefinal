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
import {
  Firestore,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

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
  public db: Firestore;
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
    this.db = getFirestore(this.app);
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

      // Create user document in Firestore
      await this.createUserDocument(userCredential.user.uid, {
        displayName,
        email,
        createdAt: new Date(),
        lastLogin: new Date()
      });

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

      // Update last login in Firestore
      await this.updateUserDocument(userCredential.user.uid, {
        lastLogin: new Date()
      });

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

      // Also update in Firestore
      await this.updateUserDocument(user.uid, updates);

      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== FIRESTORE METHODS ====================

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

  /**
   * Create user document in Firestore
   */
  private async createUserDocument(userId: string, userData: UserProfile): Promise<void> {
    console.log(`[FirebaseService] Starting createUserDocument for ${userId}...`);
    try {
      const userRef = doc(this.db, 'users', userId);

      // Clean data - remove undefined values
      const cleanData: Record<string, any> = {
        uid: userId,
        updatedAt: new Date()
      };

      // Only add properties that are not undefined
      if (userData.displayName !== undefined && userData.displayName !== '') {
        cleanData.displayName = userData.displayName;
      }
      if (userData.email !== undefined) {
        cleanData.email = userData.email;
      }
      if (userData.createdAt !== undefined) {
        cleanData.createdAt = userData.createdAt;
      }
      if (userData.lastLogin !== undefined) {
        cleanData.lastLogin = userData.lastLogin;
      }

      console.log('[FirebaseService] Data prepared, calling setDoc...');

      // Use timeout to prevent hanging
      await this.withTimeout(
        setDoc(userRef, cleanData),
        5000,
        'Firestore: createUserDocument'
      );

      console.log('✅ [FirebaseService] Firestore document created successfully');
    } catch (error: any) {
      // CRITICAL: We catch all errors here so the auth flow doesn't fail
      // just because Firestore is having issues/hanging
      console.error('❌ [FirebaseService] Error creating user document:', error);
      console.warn('[FirebaseService] Continuing auth flow despite Firestore error');
    }
  }

  /**
   * Update user document in Firestore
   */
  private async updateUserDocument(userId: string, updates: Partial<UserProfile>): Promise<void> {
    console.log(`[FirebaseService] Starting updateUserDocument for ${userId}...`);
    try {
      const userRef = doc(this.db, 'users', userId);

      await this.withTimeout(
        updateDoc(userRef, {
          ...updates,
          updatedAt: new Date()
        }),
        5000,
        'Firestore: updateUserDocument'
      );

      console.log('✅ [FirebaseService] User document updated successfully');
    } catch (error: any) {
      console.error('❌ [FirebaseService] Error updating user document:', error);
      console.warn('[FirebaseService] Continuing auth flow despite Firestore error');
    }
  }

  /**
   * Get user document from Firestore
   */
  async getUserDocument(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
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
    // Implementation depends on your file handling
    // This is a placeholder for storage upload logic
    return { success: false, error: 'Storage upload not implemented' };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return !!this.app && !!this.auth && !!this.db;
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