import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import type { User } from '@fitness-tracker/shared';

// Configure Google OAuth Strategy
if (config.google.clientId && config.google.clientSecret && config.google.callbackUrl) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user data from Google profile
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName;
          const profilePictureUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Find or create user in database
          let user = await prisma.user.findUnique({
            where: { googleId },
          });

          if (!user) {
            // Create new user
            user = await prisma.user.create({
              data: {
                googleId,
                email,
                displayName,
                profilePictureUrl,
                preferredWeightUnit: 'lb', // Default to pounds
              },
            });
          } else {
            // Update existing user's profile information
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                email,
                displayName,
                profilePictureUrl,
              },
            });
          }

          // Return user to Passport
          return done(null, user);
        } catch (error) {
          console.error('Error in Google OAuth callback:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
} else {
  console.warn(
    'Google OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in .env file.'
  );
}

// Serialize user to session (store user ID in session)
passport.serializeUser((user: Express.User, done) => {
  const dbUser = user as User;
  done(null, dbUser.id);
});

// Deserialize user from session (retrieve full user object from database)
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return done(new Error('User not found'), null);
    }

    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

export default passport;
