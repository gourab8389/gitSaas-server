import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: process.env.GITHUB_CALLBACK_URL!
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { githubId: profile.id }
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { githubId: profile.id },
        data: {
          name: profile.displayName || profile.username,
          avatar: profile.photos?.[0]?.value,
          // Store GitHub access token for API calls
          githubToken: accessToken
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          githubId: profile.id,
          email: profile.emails?.[0]?.value || `${profile.username}@github.user`,
          name: profile.displayName || profile.username,
          avatar: profile.photos?.[0]?.value,
          githubToken: accessToken
        }
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;