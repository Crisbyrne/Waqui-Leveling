// Firebase Data Migration Utility
// This script helps migrate data from localStorage to Firebase

class FirebaseMigration {
  constructor() {
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.hasMigrated = localStorage.getItem('firebase_migration_complete') === 'true';
  }

  // Check if data migration is needed
  needsMigration() {
    // If we've already migrated or there's no localStorage data, no need to migrate
    if (this.hasMigrated) return false;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
    
    return users.length > 0 || challenges.length > 0;
  }

  // Migrate a user from localStorage to Firebase Auth and Firestore
  async migrateUser(localUser, password = 'migrated_user_password') {
    try {
      // Check if user already exists in Firebase Auth
      const existingUsers = await this.db.collection('users')
        .where('email', '==', localUser.email)
        .get();
      
      if (!existingUsers.empty) {
        console.log(`User ${localUser.email} already exists in Firestore`);
        return existingUsers.docs[0].id;
      }
      
      // Create user in Firebase Auth
      const userCredential = await this.auth.createUserWithEmailAndPassword(
        localUser.email, 
        password
      );
      
      // Create user document in Firestore
      const userData = {
        id: userCredential.user.uid,
        name: localUser.name,
        email: localUser.email,
        stars: localUser.stars || 0,
        avatar: localUser.avatar,
        createdAt: firebase.firestore.Timestamp.fromDate(new Date(localUser.createdAt || Date.now())),
        lastStarDate: localUser.lastStarDate ? firebase.firestore.Timestamp.fromDate(new Date(localUser.lastStarDate)) : null
      };
      
      await this.db.collection('users').doc(userCredential.user.uid).set(userData);
      console.log(`User ${localUser.email} migrated to Firebase`);
      
      return userCredential.user.uid;
    } catch (error) {
      console.error(`Error migrating user ${localUser.email}:`, error);
      return null;
    }
  }

  // Migrate challenges from localStorage to Firestore
  async migrateChallenges(localChallenges, userIdMap) {
    try {
      for (const challenge of localChallenges) {
        // Skip if already migrated (check if a challenge with same userId and name exists)
        const existingChallenges = await this.db.collection('challenges')
          .where('name', '==', challenge.name)
          .where('userId', '==', userIdMap[challenge.userId] || challenge.userId)
          .get();
          
        if (!existingChallenges.empty) {
          console.log(`Challenge "${challenge.name}" already exists for user in Firestore`);
          continue;
        }
        
        // Convert dates to Firestore timestamps
        const firestoreChallenge = {
          ...challenge,
          userId: userIdMap[challenge.userId] || challenge.userId,
          participants: challenge.participants?.map(pid => userIdMap[pid] || pid) || [userIdMap[challenge.userId] || challenge.userId],
          createdAt: challenge.createdAt ? firebase.firestore.Timestamp.fromDate(new Date(challenge.createdAt)) : firebase.firestore.FieldValue.serverTimestamp(),
          lastResetDate: challenge.lastResetDate ? firebase.firestore.Timestamp.fromDate(new Date(challenge.lastResetDate)) : firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Convert history dates to Firestore timestamps
        if (firestoreChallenge.history && Array.isArray(firestoreChallenge.history)) {
          firestoreChallenge.history = firestoreChallenge.history.map(entry => ({
            ...entry,
            date: entry.date ? firebase.firestore.Timestamp.fromDate(new Date(entry.date)) : firebase.firestore.FieldValue.serverTimestamp()
          }));
        }
        
        // Add to Firestore
        await this.db.collection('challenges').add(firestoreChallenge);
        console.log(`Challenge "${challenge.name}" migrated to Firebase`);
      }
      
      console.log('All challenges migrated successfully');
    } catch (error) {
      console.error('Error migrating challenges:', error);
    }
  }

  // Run the full migration process
  async runMigration() {
    if (!this.needsMigration()) {
      console.log('No migration needed');
      return;
    }
    
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
      
      // Map old user IDs to new Firebase user IDs
      const userIdMap = {};
      
      // Migrate users
      for (const user of users) {
        const newUserId = await this.migrateUser(user);
        if (newUserId) {
          userIdMap[user.id] = newUserId;
        }
      }
      
      // Migrate challenges
      await this.migrateChallenges(challenges, userIdMap);
      
      // Mark migration as complete
      localStorage.setItem('firebase_migration_complete', 'true');
      this.hasMigrated = true;
      
      console.log('Migration to Firebase completed successfully');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }
  
  // Show migration UI prompt to the user
  showMigrationPrompt() {
    if (!this.needsMigration()) return;
    
    const migrationPrompt = document.createElement('div');
    migrationPrompt.className = 'migration-prompt';
    migrationPrompt.innerHTML = `
      <div class="migration-dialog">
        <h3>Actualización de la aplicación</h3>
        <p>Estamos mejorando tu experiencia en Waqui Leveling. ¿Deseas migrar tus datos para aprovechar las nuevas funcionalidades?</p>
        <div class="migration-buttons">
          <button id="start-migration" class="btn primary">Migrar Datos</button>
          <button id="skip-migration" class="btn secondary">Omitir</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(migrationPrompt);
    
    // Add event listeners
    document.getElementById('start-migration').addEventListener('click', async () => {
      document.getElementById('start-migration').disabled = true;
      document.getElementById('start-migration').textContent = 'Migrando...';
      
      const success = await this.runMigration();
      
      if (success) {
        alert('Tus datos se han migrado correctamente. ¡Disfruta de las nuevas funcionalidades!');
        window.location.reload();
      } else {
        alert('Ocurrió un error durante la migración. Por favor intenta de nuevo más tarde.');
        document.getElementById('start-migration').disabled = false;
        document.getElementById('start-migration').textContent = 'Migrar Datos';
      }
    });
    
    document.getElementById('skip-migration').addEventListener('click', () => {
      migrationPrompt.remove();
    });
  }
}

// Initialize migration utility
const firebaseMigration = new FirebaseMigration();

// Check for migration on page load
document.addEventListener('DOMContentLoaded', () => {
  // Show migration prompt after a short delay
  setTimeout(() => {
    firebaseMigration.showMigrationPrompt();
  }, 2000);
}); 