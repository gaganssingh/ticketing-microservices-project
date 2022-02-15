import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";

import { BadRequestError, validateRequest } from "@gsinghtickets/common";
import { User } from "../models/user";
import { Password } from "../services/password";

const signinRouter = express.Router();

signinRouter.post(
  "/api/users/signin",
  [
    // Perform validation on req.body
    body("email").isEmail().withMessage("Please enter a valid email address."),
    body("password").trim().notEmpty().withMessage("Password can't be empty."),
  ],
  // Perform validation
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    // If user doesn't exist, throw error
    if (!existingUser) {
      throw new BadRequestError("Email or password is not valid");
    }

    // Check if stored user password match the password used to login
    const passwordsMatch = await Password.compare(
      existingUser.password,
      password
    );
    // If passwords don't match, throw error
    if (!passwordsMatch) {
      throw new BadRequestError("Email or password is not valid");
    }

    // If both email & password are correct:
    // GENERATE JSON WEB TOKEN (JWT)
    const userJWT = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY!
    );

    // STORE JWT ON USER SESSION
    req.session = {
      jwt: userJWT,
    };

    // Save user to db
    await existingUser.save();

    res.status(200).send(existingUser);
  }
);

export { signinRouter };
