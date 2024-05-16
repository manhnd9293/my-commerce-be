import * as process from 'node:process';

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
  },
  appUrl: process.env.APP_URL,

  jwt: {
    secret: process.env.JWT_SECRET,
  },

  aws: {
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    bucketRegion: process.env.AWS_S3_BUCKET_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  version: process.env.VERSION,
});
