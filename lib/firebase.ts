import { initializeApp, getApps } from 'firebase/app';

export const initFirebase = () => {
  if (getApps().length === 0) {
    initializeApp({
      apiKey: 'AIzaSyBjQaDg06dTovICU6UOTtRS_To8fH3rdhk',
      authDomain: 'onub2b-25a95.firebaseapp.com',
      projectId: 'onub2b-25a95',
      storageBucket: 'onub2b-25a95.firebasestorage.app',
      messagingSenderId: '533522327136',
      appId: '1:533522327136:ios:4f6acabdf6c2037cb58505',
    });
  }
};
