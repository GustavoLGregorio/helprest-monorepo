export interface SocialLinksProps {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    website?: string;
}

export class SocialLinks {
    readonly instagram?: string;
    readonly facebook?: string;
    readonly twitter?: string;
    readonly tiktok?: string;
    readonly website?: string;

    private constructor(props: SocialLinksProps) {
        this.instagram = props.instagram;
        this.facebook = props.facebook;
        this.twitter = props.twitter;
        this.tiktok = props.tiktok;
        this.website = props.website;
    }

    static create(props: SocialLinksProps): SocialLinks {
        return new SocialLinks(props);
    }

    hasAnyLink(): boolean {
        return !!(this.instagram || this.facebook || this.twitter || this.tiktok || this.website);
    }
}
