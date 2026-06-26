declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      DATABASE_URL: string;
      API_KEY: string;
      VEX_API_TOKEN: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

// If this file has no imports/exports, force it to be treated as a module.
export {};