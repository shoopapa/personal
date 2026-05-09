# Lightning LMS

A modern Learning Management System built with a full-stack TypeScript monorepo architecture. Lightning LMS provides a comprehensive platform for course creation, student management, and learning analytics with enterprise-grade authentication and deployment.

## Architecture

Lightning LMS uses [Turborepo](https://turborepo.org) with a modular package structure:

**Apps:**

- `apps/nextjs` - Main web application (Next.js 15 + React 19)
- `apps/marketing` - Marketing site and landing pages

**Packages:**

- `packages/api` - tRPC API routes and procedures
- `packages/auth` - Authentication with Better Auth
- `packages/db` - Database layer with Kysely + PostgreSQL
- `packages/ui` - Shared UI components with shadcn/ui
- `packages/communication` - Email/SMS services
- `packages/training` - Learning content schemas

**Tooling:**

- ESLint, Prettier, TypeScript configs
- Tailwind CSS configuration
- Turbo generators for new packages

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Run database migrations
pnpm db:push

# Start development servers
pnpm dev
```

**Requirements:** Node.js ≥22.14.0, PNPM ≥9.6.0

## Most Used Commands

```bash
# Development
pnpm dev              # Start all apps in watch mode
pnpm build            # Build all packages and apps
pnpm typecheck        # Type check all packages

# Database
pnpm db:push          # Push schema changes to database

# Code Quality
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
pnpm format:fix       # Format code with Prettier

# UI Components
pnpm ui-add           # Add new shadcn/ui components

# Infrastructure
pnpm cdk:deploy       # Deploy AWS infrastructure
```

## Deployment

Lightning LMS deploys to AWS using CDK (Cloud Development Kit) with a containerized architecture:

**Infrastructure:**

- **ECS Fargate** - Containerized Next.js app with auto-scaling
- **RDS PostgreSQL** - Managed database with encryption
- **Application Load Balancer** - HTTPS termination with custom domain
- **VPC** - Private subnets with cost-effective NAT instances
- **Route 53** - DNS management for `lightninglms.com`
- **Secrets Manager** - Secure credential storage

**Deployment Process:**

1. GitHub Actions triggers on `main` branch push
2. Builds Docker container with Next.js app
3. Pushes to ECR and deploys via CDK
4. Runs database migrations via bastion host
5. Updates ECS service with zero-downtime deployment

**Production URL:** `app.lightninglms.com`

# spinning up a new env

- create the account and add yourself to it by logging into the root account
- go to aws organizations in us-east-2

- create a hosted zone (env.lightninglms.com)
- copy ALL ns values and add a ns record in prod

- create the secrets using `pnpm --filter scripts create:aws-secrets`
- add your account id into infra-consts and the domain
- cd apps/nextjs && cdk bootstrap
- add the secret arns into the account
- you should generate a new auth secret

- create a keypair named: `dbBastion-key-pair` file in ec2 and download it, move it to ~/.shh file
  - https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#KeyPairs
  - chmod it

- pnpm cdk:deploy

Enjoy, I might have forgotten a step so add it

## Reset Demo Env

This will effect demo.app.lightninglms.com, check with others!

1. `login demo`
2. `pnpm --filter @acme/db get-db-url`
3. copy output into .env (DATABASE_URL=<output of above>)
4. In new terminal run `login demo` and then `bastion`, leave it open
5. in old terminal run `I_KNOW_WHAT_I_AM_DOING=true pf db nuke`
   enjoy clean demo env!

## dump db into local

```
 /opt/homebrew/opt/postgresql@17/bin/pg_dump "postgresql://postgres:<pword>@localhost:5433/postgres?sslmode=require" --no-owner --no-acl --clean --if-exists | psql "postgresql://postgres:postgres@localhost:5100/postgres?sslmode=disable"
```
# personal
