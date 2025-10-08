### Github Saas server using node.js

A comprehensive Node.js API for managing projects with GitHub integration, AI-powered suggestions, and automated CI/CD deployment.

## Features

- 🔐 JWT Authentication + GitHub OAuth
- 📊 Project Management with GitHub Integration
- 🚀 Automated CI/CD Pipeline
- 🤖 AI-Powered Code Analysis (Google Gemini)
- 🐳 Docker Support
- ☁️ AWS EC2 Deployment Ready
- 📈 Real-time Deployment Status
- 📝 Comprehensive API Documentation

## Quick Start

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd project-manager-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. **Set up the database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start development server**
```bash
npm run dev
```

## API Testing Examples

### Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Projects (with JWT token)
```bash
# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"My Project","githubUrl":"https://github.com/username/repo","description":"Test project"}'

# Get projects
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Deploy project
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/deploy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment

### Local Development with Docker
```bash
docker-compose up -d
```

### Production Build
```bash
docker build -t project-manager-api .
docker run -p 3000:3000 project-manager-api
```

## Environment Setup

### Required Secrets for GitHub Actions
- `EC2_HOST` - Your EC2 instance IP
- `EC2_USERNAME` - EC2 username (usually ubuntu)  
- `EC2_PRIVATE_KEY` - Your EC2 private key
- `GITHUB_TOKEN` - GitHub personal access token

### AWS EC2 Setup Commands
```bash
# Install Docker on EC2
sudo apt update
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Create environment file
nano /home/ubuntu/.env
# Add all production environment variables
```

### GitHub OAuth Setup
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set callback URL: `http://your-domain.com/api/auth/github/callback`
4. Add Client ID and Secret to environment variables

### Google Gemini API Setup
1. Visit Google AI Studio
2. Generate API key
3. Add to environment as `GEMINI_API_KEY`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/github` - GitHub OAuth
- `GET /api/auth/profile` - Get user profile

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List user projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/deploy` - Deploy project
- `GET /api/projects/:id/commits` - Get project commits
- `GET /api/projects/:id/analysis` - Get AI analysis

### Users  
- `GET /api/users/dashboard` - User dashboard with stats
- `PUT /api/users/profile` - Update user profile

## License

MIT License

---

🚀 **Ready for production deployment with complete CI/CD pipeline!**
