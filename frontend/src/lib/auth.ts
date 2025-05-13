import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter";

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({

      clientId: process.env?.GOOGLE_CLIENT_ID,
      clientSecret: process.env?.GOOGLE_CLIENT_SECRET
    })
  ]
}
