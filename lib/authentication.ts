import { getMongoCollection } from "./mongodb";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import NextAuth from "next-auth";
import { verifyPassword } from "./users";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: "agent-ai.session-token",
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },

      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };
        if (!email || !password) {
          return null;
        }

        const user = await verifyPassword(email, password);
        if (!user) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  events: {
    async signIn({ user }) {
      if (!user.email) return;

      try {
        const users = await getMongoCollection("users");
        await users.updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name ?? "",
              image: user.image ?? "",
              updatedAt: new Date(),
            },
            $setOnInsert: {
              email: user.email,
              createdAt: new Date(),
            },
          },
          { upsert: true },
        );
      } catch (error) {
        console.error(error || "Failed to update user");
      }
    },
  },
});

export async function getSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}
