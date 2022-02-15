import express from "express";
const signoutRouter = express.Router();

signoutRouter.post("/api/users/signout", (req, res) => {
  // empty out the cookies in the browser/client
  req.session = null;

  res.send({});
});

export { signoutRouter };
