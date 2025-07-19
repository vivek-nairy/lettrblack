import { updateUser, getUser } from "./firestore-utils";

export async function isAdmin(uid: string) {
  const user = await getUser(uid);
  return user?.roles.includes("admin");
}

export async function isCreator(uid: string) {
  const user = await getUser(uid);
  return user?.roles.includes("creator");
}

export async function promoteToCreator(uid: string) {
  await updateUser(uid, { roles: ["student", "creator"] });
}

export async function promoteToAdmin(uid: string) {
  await updateUser(uid, { roles: ["student", "admin"] });
} 