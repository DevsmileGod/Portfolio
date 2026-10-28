/** Articles to list under "Writing" in the Open source section. The block is hidden while this is empty. */
export interface Post {
  title: string;
  url: string;
  published: string; // ISO date
  takeaway: string;
}

export const posts: Post[] = [];
