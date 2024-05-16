import {type PostData} from '../lib/post';

export function sortPosts([...posts]: PostData[]): PostData[] {
  posts.sort((a, b) => {
		const now = new Date();
		const aPublishDate = a.frontmatter.publishDate;
		const bPublishDate = b.frontmatter.publishDate;
		const aDate = (aPublishDate ? new Date(aPublishDate) : now);
		const bDate = (bPublishDate ? new Date(bPublishDate) : now);
		return bDate.getTime() - aDate.getTime();
	});
  return posts.filter(post => post.frontmatter.published!!);
}
