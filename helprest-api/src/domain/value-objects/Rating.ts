export class Rating {
    readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    static create(value: number): Rating {
        if (value < 0 || value > 5) {
            throw new Error("Rating must be between 0 and 5");
        }
        return new Rating(Math.round(value * 10) / 10);
    }

    static fromAverage(total: number, count: number): Rating {
        if (count === 0) return new Rating(0);
        return Rating.create(total / count);
    }

    equals(other: Rating): boolean {
        return this.value === other.value;
    }
}
