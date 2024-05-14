export interface Frontmatter {
	id: string;
	title: string;
	preview: string;
	published?: boolean;
	publishDate?: Date;
	tags?: string[];
	links?: Links;
}

export interface Links {
	web?: string;
	github?: string;
	codesandbox?: string;
}

export interface PostData {
	frontmatter: Frontmatter;
}
