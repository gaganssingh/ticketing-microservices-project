import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export class Password {
  // Hash password
  static async toHash(password: string) {
    const salt = randomBytes(8).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${buf.toString("hex")}.${salt}`;
  }

  // Compare saved password to the supploed password
  static async compare(storedPassword: string, suppliedPassword: string) {
    // Get Hashed password and salt from the db
    const [hashedPassword, salt] = storedPassword.split(".");

    // Hash password supplied by the user
    // Use the same salt that was used to hash the stored password
    const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

    return buf.toString("hex") === hashedPassword;
  }
}
