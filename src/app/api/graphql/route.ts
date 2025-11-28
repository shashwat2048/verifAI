import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { ApolloServer } from "@apollo/server";
import { NextRequest } from "next/server";
import { gql } from "graphql-tag";
import { getUser, me, updateUser, getProfile, createOrUpdateProfile } from "./resolvers/user";
import { updateUserProfile } from "./resolvers/user";
import { analyzeLabel } from "./resolvers/user";
import { myReports, getReports } from "./resolvers/user";
import { getAuth } from "@clerk/nextjs/server";
import { deleteReport } from "./resolvers/feature";
import { signToken } from "@/services/jwt";
import { enforceAnalyzeQuota } from "./rbac";
import db from "@/services/prisma";

export const runtime = "nodejs";

const typeDefs = gql`
  type Query {
    me: User
    getUser(clerkId: String!): User
    getProfile: Profile
    getReports(clerkId: String!): [AnalysisReport!]
    myReports: [AnalysisReport!]
    myQuota: Quota
  }
  type Mutation {
    updateUser(id: String!, name: String, avatar: String): Response
    createOrUpdateProfile: Response
    updateUserProfile(name: String): Response
    analyzeLabel(imageBase64: String!): AnalyzeResult
    deleteReport(id: String!): Response
    migrateGuestAnalyses(items: [GuestAnalysisInput!]!): Response
  }
  type Response {
    success: Boolean
    message: String
  }
  type AnalyzeResult {
    imageUrl: String
    isDeepfake: Boolean
    confidence: Float
    explanation: String
    saved: Boolean
    scanId: String
  }
  type AnalysisReport {
    id: String
    isDeepfake: Boolean
    confidence: Float
    explanation: String
    createdAt: String
    imageUrl: String
    rawResponse: String
  }
  type Profile {
    name: String
  }
  type User {
    id: String
    name: String
    email: String
    avatar: String
    role: String
    analysesDone: Int
  }
  type Quota {
    role: String
    used: Int
    max: Int
    remaining: Int
    unlimited: Boolean
  }

  input GuestAnalysisInput {
    isDeepfake: Boolean
    confidence: Float
    explanation: String
    imageUrl: String
  }
`;

const resolvers = {
  Query: {
    me: me,
    getUser: getUser,
    getProfile: getProfile,
    getReports: getReports,
    myReports: myReports,
    myQuota: async (_: any, __: any, context: any) => {
      return { role: 'pro', used: 0, max: 0, remaining: 0, unlimited: true };
    }
  },
  Mutation: {
    updateUser: updateUser,
    createOrUpdateProfile: createOrUpdateProfile,
    updateUserProfile: updateUserProfile,
    analyzeLabel: async (_: any, args: { imageBase64: string }, context: any) => {
      // Enforce RBAC and quotas before calling resolver
      await enforceAnalyzeQuota(context.req, context.auth);
      return analyzeLabel(_, args, context);
    },
    deleteReport: deleteReport,

    migrateGuestAnalyses: async (_: any, args: { items: Array<{ isDeepfake?: boolean; confidence?: number; explanation?: string; imageUrl?: string | null }> }, context: any) => {
      try {
        const { userId } = context?.auth || {};
        if (!userId) return { success: false, message: 'Unauthorized' };
        const user = await db.user.findUnique({ where: { clerkId: userId } });
        if (!user) return { success: false, message: 'User not found' };

        const role = user.role === 'pro' ? 'pro' : 'free';
        let used = user.analysesDone || 0;
        const max = role === 'free' ? 10 : Number.POSITIVE_INFINITY;
        const remaining = role === 'free' ? Math.max(0, 10 - used) : Number.POSITIVE_INFINITY;
        if (role === 'free' && remaining <= 0) {
          return { success: false, message: 'Free plan limit reached: 10 analyses' };
        }

        const toImport = Array.isArray(args.items) ? args.items : [];
        if (toImport.length === 0) return { success: true, message: 'Nothing to migrate' };

        const allowed = role === 'free' ? Math.min(remaining, toImport.length) : toImport.length;
        const slice = toImport.slice(0, allowed);

        for (const it of slice) {
          await db.scan.create({
            data: {
              userId: user.id,
              mediaType: "image",
              imageUrl: it.imageUrl || null,
              isDeepfake: it.isDeepfake || false,
              confidence: it.confidence || 0,
              explanation: it.explanation || "",
              rawResponse: it,
            },
          });
          used += 1;
        }

        if (role === 'free') {
          await db.user.update({ where: { id: user.id }, data: { analysesDone: used } });
        }

        const skipped = toImport.length - slice.length;
        const msg = skipped > 0 ? `Migrated ${slice.length}, skipped ${skipped} (limit).` : `Migrated ${slice.length} analyses.`;
        return { success: true, message: msg };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Migration failed' };
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Typescript: req has the type NextRequest
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req, auth: getAuth(req) }),
});

function setOrClearAuthCookie(req: NextRequest, res: Response) {
  const { userId } = getAuth(req);
  if (userId) {
    const token = signToken({ id: userId });
    if (token) {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.headers.append(
        "Set-Cookie",
        `token=${token}; Path=/; SameSite=Lax${secure}`
      );
    }
  } else {
    res.headers.append(
      "Set-Cookie",
      "token=; Path=/; Max-Age=0"
    );
  }
}

export async function GET(req: NextRequest) {
  const res = await handler(req);
  setOrClearAuthCookie(req, res);
  return res;
}

export async function POST(req: NextRequest) {
  const res = await handler(req);
  setOrClearAuthCookie(req, res);
  return res;
}