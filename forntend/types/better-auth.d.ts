import "better-auth/react";

declare module "better-auth/react" {
  interface AuthClient {
    checkout(options: { products: string[] }): Promise<void>;
  }
}
