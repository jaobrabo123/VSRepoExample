import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    database: {
        url: process.env.DATABASE_URL!,
    },
}));
