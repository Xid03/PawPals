export function publicUser<T extends {
  id: string;
  email?: string;
  name: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  createdAt?: Date;
}>(user: T) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    city: user.city,
    createdAt: user.createdAt
  };
}

export function privateUser<T extends Parameters<typeof publicUser>[0] & { email: string }>(user: T) {
  return {
    ...publicUser(user),
    email: user.email
  };
}
