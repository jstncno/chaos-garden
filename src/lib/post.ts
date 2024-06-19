export interface Frontmatter {
	id: string;
	title: string;
	preview: string;
	published?: boolean;
	// ISO formatted string
	publishDate?: string;
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
