import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { login } from "./login";
import { v4 as uuid } from "uuid";
import { encode as defaultEncode } from "next-auth/jwt";
import { ServerErrorCode } from "@/enums/common";

class CustomError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
    this.message = code;
    this.stack = undefined;
  }
}

const adapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { user, errorCode } = await login(credentials);

        if (user) {
          return user;
        }

        switch (errorCode) {
          case ServerErrorCode.AUTH_INVALID_CREDENTIALS:
          case ServerErrorCode.AUTH_INVALID_CREDENTIALS_SCHEMA:
            throw new CustomError(`${errorCode}`);
          default:
            throw new CustomError(`${ServerErrorCode.UNEXPECTED_ERROR}`);
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET!,
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }

        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
});
