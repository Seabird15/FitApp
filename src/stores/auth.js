import { defineStore } from 'pinia'
import { auth, db } from '../services/firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,         // datos básicos (uid, email, etc.)
    profile: null,      // datos extra en Firestore (role, clubId, etc.)
    loading: true,
  }),
  actions: {
    async login(email, password) {
      this.loading = true
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        this.user = user
        await this.fetchUserProfile(user.uid)
      } finally {
        this.loading = false
      }
    },

    async registerAthlete(name, email, passowrd) {
      this.loading = true
      try {
        const {  user  } = await createUserWithEmailAndPassword(auth, email, passowrd)
        //crear perfil en firestore, coleccion users
        const userRef = doc(db, 'users', user.uid)
        const profileData = {
          name,
          email,
          role: 'athlete',
          createdAt: serverTimestamp(),
        }

        await setDoc(userRef, profileData)

        this.user = user
        this.profile = profileData
      }
      finally {
        this.loading = false
      }
    },


    async fetchUserProfile(uid) {
      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        this.profile = snap.data()
      } else {
        this.profile = null
      }
    },

    async logout() {
      await signOut(auth)
      this.user = null
      this.profile = null
    },

    initAuthListener() {
      // Llama a esto una sola vez al inicio de la app (por ejemplo en main.js o en App.vue)
      this.loading = true
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.user = user
          await this.fetchUserProfile(user.uid)
        } else {
          this.user = null
          this.profile = null
        }
        this.loading = false
      })
    },
  },
})
