export interface Frontmatter {
	id: string;
	title: string;
	preview: string;
	published?: boolean;
	publishDate?: Date;
	tags?: string[];
}

export interface PostData {
	frontmatter: Frontmatter;
}
