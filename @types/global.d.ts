declare const __DEV__: boolean

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "production" | "test" | (string & {})
  }
}
