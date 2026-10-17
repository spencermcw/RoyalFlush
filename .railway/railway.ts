import { defineRailway, project, service } from "railway/iac";

// This repository manages only its own resources in the environment.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "web";

export default defineRailway(() => {
  // The dApp: Dockerfile at the repo root (Vite testnet build of dApp/ -> static-base Caddy on $PORT).
  const web = service("web", {
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    deploy: { restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 5 },
    healthcheck: "/",
    healthcheckTimeout: 60,
    replicas: { sfo: 1 },
  });

  return project("royal-flush", {
    variables: { managed: false },
    resources: [web],
  });
});
