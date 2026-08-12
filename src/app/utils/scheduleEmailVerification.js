import { after } from "next/server";

import { getEmailVerificationTokensCollection } from "./database";
import { createEmailVerificationToken } from "./emailVerification";
import { sendEmailVerificationEmail } from "./emailVerificationEmail";

export function scheduleEmailVerification(user) {
  after(async () => {
    const collection = await getEmailVerificationTokensCollection();
    const verificationToken = createEmailVerificationToken();

    try {
      await collection.deleteMany({ userId: user._id });
      await collection.insertOne({
        userId: user._id,
        tokenHash: verificationToken.tokenHash,
        createdAt: verificationToken.issuedAt,
        expiresAt: verificationToken.expiresAt,
      });

      await sendEmailVerificationEmail({
        email: user.email,
        name: user.name,
        token: verificationToken.token,
      });
    } catch (error) {
      await collection
        .deleteOne({ tokenHash: verificationToken.tokenHash })
        .catch(() => {});
      console.error("Email verification delivery failed:", {
        userId: user._id.toString(),
        error,
      });
    }
  });
}

