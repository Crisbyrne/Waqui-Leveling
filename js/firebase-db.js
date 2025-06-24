// Firebase Database Service for Challenges
class FirebaseDbService {
  constructor() {
    this.db = firebase.firestore();
    this.challengesCollection = this.db.collection('challenges');
  }

  // Generate UID for challenges
  generateUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get all challenges for a user
  async getUserChallenges(userId) {
    try {
      const snapshot = await this.challengesCollection.where('userId', '==', userId).get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });
    } catch (error) {
      console.error("Error getting user challenges:", error);
      return [];
    }
  }

  // Get a single challenge by ID
  async getChallenge(challengeId) {
    try {
      const doc = await this.challengesCollection.doc(challengeId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      } else {
        console.log("No challenge found with ID:", challengeId);
        return null;
      }
    } catch (error) {
      console.error("Error getting challenge:", error);
      return null;
    }
  }

  // Create a new challenge
  async createChallenge(data, userId) {
    try {
      const sharedId = this.generateUID(); // Common ID for collaborative challenges
      const allParticipants = data.participants || [userId];
      const createdChallenges = [];

      // Create a challenge document for each participant
      for (const participantId of allParticipants) {
        const challenge = {
          sharedId: sharedId,
          userId: participantId,
          name: data.name,
          description: data.description || '',
          type: data.type,
          unit: data.unit,
          goalPerInterval: parseFloat(data.goalPerInterval),
          interval: data.interval,
          deadline: data.deadline || null,
          category: data.category,
          icon: data.icon || '🌟',
          participants: allParticipants,
          progress: 0,
          streak: 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastResetDate: firebase.firestore.Timestamp.fromDate(new Date()),
          history: [],
          apuesta: data.apuesta || null
        };

        const docRef = await this.challengesCollection.add(challenge);
        createdChallenges.push({ id: docRef.id, ...challenge });
      }

      return createdChallenges;
    } catch (error) {
      console.error("Error creating challenge:", error);
      throw error;
    }
  }

  // Update challenge progress
  async updateProgress(challengeId, addedProgress) {
    try {
      // First get the challenge
      const challenge = await this.getChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const todayDate = new Date();
      const todayStr = todayDate.toDateString();

      // Find if there's an entry for today in history
      let todayEntry = challenge.history?.find(h => {
        const entryDate = h.date instanceof firebase.firestore.Timestamp 
          ? h.date.toDate().toDateString() 
          : new Date(h.date).toDateString();
        return entryDate === todayStr;
      });

      // If no history yet, initialize it
      if (!challenge.history) {
        challenge.history = [];
      }

      // Update today's progress
      if (todayEntry) {
        todayEntry.progress += addedProgress;
      } else {
        todayEntry = {
          date: firebase.firestore.Timestamp.fromDate(todayDate),
          progress: addedProgress
        };
        challenge.history.push(todayEntry);
      }

      // Update total progress
      if (challenge.interval === 'daily') {
        challenge.progress = todayEntry.progress;
      } else {
        challenge.progress += addedProgress;
      }

      // Update lastResetDate
      challenge.lastResetDate = firebase.firestore.Timestamp.fromDate(todayDate);

      // Check if challenge is completed and update streak
      const isCompleted = challenge.progress >= challenge.goalPerInterval;
      if (isCompleted && challenge.interval === 'daily') {
        challenge.streak = (challenge.streak || 0) + 1;
      }

      // Save the updated challenge
      await this.challengesCollection.doc(challengeId).update({
        progress: challenge.progress,
        history: challenge.history,
        lastResetDate: challenge.lastResetDate,
        streak: challenge.streak
      });

      // Return the updated challenge
      return challenge;
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      throw error;
    }
  }

  // Reset daily challenges
  async resetDailyChallenges(userId) {
    try {
      const today = new Date().toDateString();
      const challenges = await this.getUserChallenges(userId);
      
      for (const challenge of challenges) {
        // Only process daily challenges
        if (challenge.interval !== 'daily') continue;
        
        // Check if we need to reset
        let lastResetDate;
        if (challenge.lastResetDate instanceof firebase.firestore.Timestamp) {
          lastResetDate = challenge.lastResetDate.toDate().toDateString();
        } else if (typeof challenge.lastResetDate === 'string') {
          lastResetDate = new Date(challenge.lastResetDate).toDateString();
        } else {
          lastResetDate = null;
        }
        
        if (lastResetDate !== today) {
          // Update streak based on yesterday's progress
          let streak = challenge.streak || 0;
          if (challenge.progress >= challenge.goalPerInterval) {
            streak += 1;
          } else {
            streak = 0;
          }
          
          // Reset progress and update lastResetDate
          await this.challengesCollection.doc(challenge.id).update({
            progress: 0,
            streak: streak,
            lastResetDate: firebase.firestore.Timestamp.fromDate(new Date())
          });
        }
      }
    } catch (error) {
      console.error("Error resetting daily challenges:", error);
    }
  }

  // Update challenge
  async updateChallenge(challengeId, data) {
    try {
      await this.challengesCollection.doc(challengeId).update(data);
      return true;
    } catch (error) {
      console.error("Error updating challenge:", error);
      throw error;
    }
  }

  // Delete challenge
  async deleteChallenge(challengeId) {
    try {
      await this.challengesCollection.doc(challengeId).delete();
      return true;
    } catch (error) {
      console.error("Error deleting challenge:", error);
      throw error;
    }
  }

  // Calculate progress percentage
  calculateProgress(challenge) {
    if (!challenge || !challenge.goalPerInterval || challenge.goalPerInterval <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((challenge.progress / challenge.goalPerInterval) * 100));
  }
}

// Initialize Firebase DB Service
const firebaseDbService = new FirebaseDbService(); 