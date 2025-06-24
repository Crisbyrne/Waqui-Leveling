// Firebase Authentication Service
class FirebaseAuthService {
  constructor() {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.usersCollection = this.db.collection('users');
    this.currentUser = null;

    // Set up auth state listener
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.getCurrentUserData(user.uid)
          .then(userData => {
            this.currentUser = {
              id: user.uid,
              name: userData.name,
              email: user.email,
              stars: userData.stars || 0,
              avatar: userData.avatar,
              lastStarDate: userData.lastStarDate || null
            };
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            console.log('User authenticated:', this.currentUser);
          });
      } else {
        this.currentUser = null;
        localStorage.removeItem('user');
        console.log('User signed out');
      }
    });
  }

  // Register a new user
  async register(name, email, password) {
    try {
      // Create user in Firebase Authentication
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userData = {
        id: user.uid,
        name: name,
        email: email,
        stars: 0,
        avatar: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastStarDate: null
      };

      // Save user data to Firestore
      await this.usersCollection.doc(user.uid).set(userData);
      
      return user;
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  }

  // Login existing user
  async login(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  }

  // Sign out user
  async logout() {
    try {
      await this.auth.signOut();
      localStorage.removeItem('user');
      router.navigate('home');
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  // Get user data from Firestore
  async getCurrentUserData(userId) {
    try {
      const doc = await this.usersCollection.doc(userId).get();
      if (doc.exists) {
        return doc.data();
      } else {
        console.log("No user data found in Firestore");
        return {};
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return {};
    }
  }

  // Update user profile
  async updateProfile(userId, userData) {
    try {
      await this.usersCollection.doc(userId).update(userData);
      
      // Update local storage user data
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  // Update user stars
  async updateStars(userId, stars) {
    try {
      await this.usersCollection.doc(userId).update({
        stars: stars,
        lastStarDate: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update local storage
      const user = this.getCurrentUser();
      if (user && user.id === userId) {
        user.stars = stars;
        user.lastStarDate = new Date().toISOString();
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error("Error updating stars:", error);
    }
  }
}

// Initialize Firebase Auth Service
const firebaseAuthService = new FirebaseAuthService(); 