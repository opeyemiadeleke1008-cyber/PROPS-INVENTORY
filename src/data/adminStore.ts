import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const adminsCollection = collection(db, 'admins')

export const DEFAULT_ADMINS = ['opeyemidelek@outlook.com', 'abuduadebusayo2019@yahoo.com', 'Propsandshops@gmail.com']

export const seedAdmins = async () => {
  const snapshot = await getDocs(adminsCollection)
  const existing = new Set(snapshot.docs.map((item) => item.id))

  await Promise.all(
    DEFAULT_ADMINS.filter((email) => !existing.has(email)).map((email) =>
      setDoc(doc(adminsCollection, email), {
        email,
        createdAt: new Date().toISOString(),
      }),
    ),
  )
}

export const getAdminEmails = async () => {
  const snapshot = await getDocs(adminsCollection)
  return snapshot.docs.map((item) => item.id)
}

export const isAllowedAdmin = async (email: string) => {
  const normalizedEmail = email.trim()
  if (!normalizedEmail) {
    return false
  }

  const adminDoc = await getDoc(doc(adminsCollection, normalizedEmail))
  return adminDoc.exists()
}

export const touchAdminSignin = async (email: string, uid?: string) => {
  const normalizedEmail = email.trim()
  if (!normalizedEmail) {
    return
  }

  await setDoc(
    doc(adminsCollection, normalizedEmail),
    {
      email: normalizedEmail,
      uid: uid ?? null,
      lastLoginAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

export const ensureAdminRecord = async (email: string) => {
  const normalizedEmail = email.trim()
  if (!normalizedEmail) {
    return
  }

  await setDoc(
    doc(adminsCollection, normalizedEmail),
    {
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

export const registerAdminAccount = async (email: string, uid: string) => {
  const normalizedEmail = email.trim()
  if (!normalizedEmail) {
    return
  }

  await setDoc(
    doc(adminsCollection, normalizedEmail),
    {
      email: normalizedEmail,
      uid,
      registered: true,
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
    { merge: true },
  )
}
