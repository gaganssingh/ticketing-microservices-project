import { useState } from "react";
import Router from "next/router";
import useRequest from "../../hooks/use-request";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { doRequest, errors } = useRequest({
    url: "/api/users/signin",
    method: "post",
    body: { email, password },
    onSuccess: () => Router.push("/"),
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Send user details to the backend for signup
    await doRequest();
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <h1>Sign In</h1>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          // type="email"
          id="email"
          name="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          // minLength={6}
          // maxLength={25}
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {errors && errors}
      <button className="btn btn-primary">Sign In</button>
    </form>
  );
};

export default Signin;
