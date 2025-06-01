import dotenv from 'dotenv';
dotenv.config();

export const config = {
    app: {
        port: process.env.PORT || 4000,
    },
    DATABASE_URL: process.env.DATABASE_URL
};
