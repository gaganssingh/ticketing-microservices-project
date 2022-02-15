import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";

import { BadRequestError, validateRequest } from "@gsinghtickets/common";
import { User } from "../models/user";

const signupRouter = express.Router();

signupRouter.post(
  "/api/users/signup",
  [
    // Perform validation on req.body
    body("email").isEmail().withMessage("Please enter a valid email address."),
    body("password")
      .trim()
      .isLength({ min: 6, max: 25 })
      .withMessage("Password must be between 6 & 25 characters"),
  ],
  // Perform validation
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new BadRequestError("Email already in use");
    }

    // Construct the new user
    const user = User.build({ email, password });

    // GENERATE JSON WEB TOKEN (JWT)
    const userJWT = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_KEY!
    );

    // STORE JWT ON USER SESSION
    req.session = {
      jwt: userJWT,
    };

    // Save user to db
    await user.save();

    res.status(201).send(user);
  }
);

export { signupRouter };
