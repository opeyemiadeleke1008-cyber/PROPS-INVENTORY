import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const adminsCollection = collection(db, 'admins')

const DEFAULT_ADMINS = ['opeyemidelek@outlook.com', 'admin2@example.com', 'admin3@example.com']

export const seedAdmins = async () => {
  const snapshot = await getDocs(adminsCollection)
  const existing = new Set(snapshot.docs.map((item) => item.id.toLowerCase()))

  await Promise.all(
    DEFAULT_ADMINS.filter((email) => !existing.has(email.toLowerCase())).map((email) =>
      setDoc(doc(adminsCollection, email.toLowerCase()), {
        email: email.toLowerCase(),
        createdAt: new Date().toISOString(),
      }),
    ),
  )
}

export const getAdminEmails = async () => {
  const snapshot = await getDocs(adminsCollection)
  return snapshot.docs.map((item) => item.id.toLowerCase())
}
