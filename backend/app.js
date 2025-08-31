const express = require("express");
const app = express();

require("dotenv").config();
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./src/config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const authService = require("./src/services/authService");

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    // Получить пользователя по id
    const user = await authService.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email)
          return done(null, false, { message: "No email from Google" });
        const user = await authService.findOrCreateGoogleUser(email, profile);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// Сессии должны быть до passport
app.use(
  session({
    store: new pgSession({ pool }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: [
      "http://localhost",
      "http://localhost:80",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use("/auth", require("./src/routes/auth"));
app.use("/auth/jwt", require("./src/routes/jwtAuth"));
app.use("/user", require("./src/routes/user"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Google OAuth2 routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);
app.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err || !user) {
      let msg =
        err && err.message
          ? err.message
          : info && info.message
          ? info.message
          : "Google auth error";
      return res.redirect(`/login?error=${encodeURIComponent(msg)}`);
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.redirect(
          `/login?error=${encodeURIComponent("Session error")}`
        );
      }
      req.session.user = {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name || user.role || "user",
        is_email_confirmed: user.is_email_confirmed,
        is_active: user.is_active,
      };
      return res.redirect("/profile");
    });
  })(req, res, next);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.status(200).send("hello");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`server listening on ${port}`);
});
