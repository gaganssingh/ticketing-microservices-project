## SERVER SIDE

### Server tech stack

- Expressjs (node.js framework)
- express-validator (validation for data on incoming requests)

### General Notes on docker/kubernetes deployment

#### Server prep & local deployment (Per service)

- At the root of the MAIN file structure, configure a server that you want to deploy. e.g. auth
- At the root of the SERVER file structure, create a file named "Dockerfile" without any extension

  ```
  FROM node:alpine

  WORKDIR /app
  COPY package.json .
  RUN npm install --only=prod
  COPY . .

  CMD ["npm", "start"]
  ```

- At the root of the SERVER file structure, create a file named ".dockerignore"

  ```
  node_modules
  .vscode
  .DS_Store
  ```

- From INSIDE THE SERVER DIRECTORY, run the docker build command `docker build -t therealdarkdev/auth` to build the docker image
- At the root of the main file structure, create the following folder structure:
  `./infra/k8s`
- Create a deployment configuration file inside the k8s directory (e.g. `auth-depl.yaml`):
- Append the service configuration to the deployment config file from the last step (e.g. append to `auth-depl.yaml`):
  ```
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: auth-depl
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: auth
    template:
      metadata:
        labels:
          app: auth
      spec:
        containers:
          - name: auth
            image: therealdarkdev/auth
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: auth-srv
  spec:
    selector:
      app: auth
    ports:
      - name: auth
        protocol: TCP
        port: 3000
        targetPort: 3000
  ```
- At the root of the MAIN file structure, create a `skaffold.yaml` file:
  ```
  apiVersion: skaffold/v2alpha3
  kind: Config
  deploy:
    kubectl:
      manifests:
        - ./infra/k8s/*
  build:
    local:
      push: false
    artifacts:
      - image: therealdarkdev/auth
        context: auth
        docker:
          dockerfile: Dockerfile
        sync:
          manual:
            - src: "src/**/*.ts"
              dest: .
  ```
- Run the skaffold service using `skaffold dev` command

#### Adding a DB to a service

- Create the kubernetes deployment & service config for mongodb (eg: `./infra/k8s/auth-mongo-depl.yaml`):

  ```
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: auth-mongo-depl
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: auth-mongo
    template:
      metadata:
        labels:
          app: auth-mongo
      spec:
        containers:
          - name: auth-mongo
            image: mongo
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: auth-mongo-srv
  spec:
    selector:
      app: auth-mongo
    ports:
      - name: db
        protocol: TCP
        port: 27017
        targetPort: 27017
  ```

- Inside the service (e.g. `auth`), connect to mongodb service and start the server:

  ```
  (async () => {
    try {
      await mongoose.connect("mongodb://auth-mongo-srv:27017/auth");
      console.log("🟢 Connected to MongoDB");
    } catch (err) {
      console.error("🛑", err);
    }

    // START SERVER
    app.listen(3000, () =>
      console.log(`✅✅✅ Listening at http://localhost:3000`)
    );
  })();
  ```

#### NATS Streaming Server

- Kill the skaffold dev process
- Create a new Deployment & Service config for the NATS Streaming Server in `<ROOT>/infra/k8s` directory named `nats-depl.yaml`:
  ```
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: nats-depl
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: nats
    template:
      metadata:
        labels:
          app: nats
      spec:
        containers:
          - name: nats
            image: nats-streaming:0.17.0
            args:
              [
                "-p",
                "4222",
                "-m",
                "8222",
                "-hbi",
                "5s",
                "-hbt",
                "5s",
                "-hbf",
                "2",
                "-SD",
                "-cid",
                "ticketing",
              ]
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: nats-srv
  spec:
    selector:
      app: nats
    ports:
      - name: client
        protocol: TCP
        port: 4222
        targetPort: 4222
      - name: monitoring
        protocol: TCP
        port: 8222
        targetPort: 8222
  ```

#### Commands

- Create a secret for JWT `kubectl create secret generic jwt-secret --from-literal=JWT_KEY=<key here>`
- k8s port forwarding `kubectl port-forward <POD NAME> <from port>:<to port>`

## CLIENT SIDE

### Client SideTech Stack

- Server side rendered React.js using NextJS

### MOCKING code for testing a service

- In the services src directory, create a mock folder: `src/__mocks__`.
- In `src/__mocks__`, create a file whose name is identical to the file that needs to be mocked. E.g. `src/__mocks__/nats-wrapper.ts`.
- Create a MOCK implementation of the actual business logic.
- Tell jest what source file to mock by pointing to the source file in `src/test/setup.ts`
  ```
  jest.mock("../../nats-wrapper.ts");
  ```

### Client side prep and development

- At the ROOT, create a folder for the client using `mkdir client` and enter it `cd client/`
- `npm init -y` inside the client directory to generate a new package.json file and run `npm install react react-dom next`
- Create a `pages` directory at the root of the client directory. This will contain the entry and all other JS files for the client.
- Create an "entry-point" file inside the /pages directory `index.js`, and initialize it with a basic react component.
- Create a new Docker Deploymeny & Service in the `<ROOT>/infra/k8s` directory named `client-depl.yaml`:
  ```
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: client-depl
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: client
    template:
      metadata:
        labels:
          app: client
      spec:
        containers:
          - name: client
            image: therealdarkdev/client
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: client-srv
  spec:
    selector:
      app: client
    ports:
      - name: client
        protocol: TCP
        port: 3000
        targetPort: 3000
  ```
- Build and push the docker image for the client:
  `docker build -t therealdarkdev/client .`
  `docker push therealdarkdev/client`
- Append client related configuration into the `<ROOT>/skaffold.yaml` file:
  ```
  - image: therealdarkdev/client
      context: client
      docker:
        dockerfile: Dockerfile
      sync:
        manual:
          - src: "**/*.js"
            dest: .
  ```
- At the `<ROOT>` of the client directory, create a new next config file named `next.config.js`. Add the following code to ensure hot-reload of the browser contents:
  ```
  module.exports = {
    webpackDevMiddleware: (config) => {
      config.watchOptions.poll = 300;
      return config;
    },
  };
  ```
- Run `skaffold dev` at the <ROOT> to deploy containers and navigate to the project's url

### Publish a package on npm

- Create a directory that need to be published, and generate a `package.json` file in it:
  ```
  mkdir common
  cd common/
  npm init -y
  ```
- Add package name to the package.json file: `@gsinghtickets/<package-name>`. Note `@gsinghtickets` is the organization name the package is to be published under.
- Init and commit a new git repository
- Publish to npm using `npm publish -- access public`
