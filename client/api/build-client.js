import axios from "axios";

const buildClient = ({ req }) => {
  if (typeof window === "undefined") {
    // If this is being run from the server side
    const baseURL = `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local`;
    return axios.create({
      baseURL,
      headers: req.headers,
    });
  } else {
    // If this is being run from the browser
    return axios.create({
      baseURL: "/",
    });
  }
};

export default buildClient;
