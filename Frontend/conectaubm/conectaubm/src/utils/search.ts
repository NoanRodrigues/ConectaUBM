import { COURSES, INTERESTS } from '@/data/catalog';
import type { ID, Post, User } from '@/types';
import { normalize } from './format';

function scoreUser(user: User, terms: string[]): number {
  const name = normalize(user.name);
  const course = normalize(user.course);
  const interests = user.interests.map(normalize);
  const bio = normalize(user.bio);
  let total = 0;
  for (const term of terms) {
    let score = 0;
    if (name.startsWith(term) || name.split(' ').some((word) => word.startsWith(term))) score = 5;
    else if (name.includes(term)) score = 4;
    else if (course.includes(term)) score = 3;
    else if (interests.some((interest) => interest.includes(term))) score = 2;
    else if (bio.includes(term)) score = 1;
    if (score === 0) return 0; // todos os termos precisam aparecer
    total += score;
  }
  return total;
}

/** Pesquisa estudantes por nome, curso, interesses e palavras da biografia. */
export function searchUsers(users: User[], query: string): User[] {
  const terms = normalize(query.replace(/^#/, '')).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return users
    .map((user) => ({ user, score: scoreUser(user, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.user.name.localeCompare(b.user.name))
    .map((entry) => entry.user);
}

export function searchPosts(posts: Post[], users: Record<ID, User>, query: string): Post[] {
  const term = normalize(query);
  if (!term) return [];
  return posts.filter((post) => {
    const text = normalize(post.text);
    if (term.startsWith('#')) return text.includes(term);
    return text.includes(term) || normalize(users[post.authorId]?.name ?? '').includes(term);
  });
}

export function searchCourses(query: string): string[] {
  const term = normalize(query);
  if (!term) return [];
  return COURSES.filter((course) => normalize(course).includes(term));
}

export function searchInterests(query: string, users: User[]): string[] {
  const term = normalize(query.replace(/^#/, ''));
  if (!term) return [];
  const all = new Set<string>(INTERESTS);
  users.forEach((user) => user.interests.forEach((interest) => all.add(interest)));
  return [...all].filter((interest) => normalize(interest).includes(term));
}
