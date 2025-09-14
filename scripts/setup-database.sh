#!/bin/bash

# Script to setup and initialize the Supabase database
# This script will apply migrations and seed data

set -e

echo "🚀 Setting up Momento 2.0 Database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed. Please install it first:${NC}"
    echo "npm install -g supabase"
    echo "or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking Supabase project status...${NC}"

# Check if local development is running
if ! supabase status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Starting local Supabase development environment...${NC}"
    supabase start
else
    echo -e "${GREEN}✅ Supabase is already running${NC}"
fi

echo -e "${BLUE}📦 Applying database migrations...${NC}"

# Apply migrations
if supabase db push; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Failed to apply migrations${NC}"
    exit 1
fi

echo -e "${BLUE}🌱 Seeding database with sample data...${NC}"

# Apply seed data
if supabase db reset --seed; then
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Failed to seed database, but continuing...${NC}"
fi

echo -e "${BLUE}🔍 Generating TypeScript types...${NC}"

# Generate types (if the command exists)
if supabase gen types typescript --local > src/types/supabase.ts 2>/dev/null; then
    echo -e "${GREEN}✅ TypeScript types generated${NC}"
else
    echo -e "${YELLOW}⚠️  Could not generate types automatically${NC}"
fi

echo -e "${BLUE}📊 Database Status:${NC}"
supabase status

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo "📋 What's been set up:"
echo "  • Canvas and blocks schema with professional structure"
echo "  • Row Level Security (RLS) policies for data protection"
echo "  • Sample projects and blocks for testing"
echo "  • Automatic activity logging and canvas snapshots"
echo "  • Project collaboration system with member roles"
echo ""
echo "🔗 Access your database:"
echo "  • Studio URL: http://localhost:54323"
echo "  • API URL: http://localhost:54321"
echo "  • DB URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "🧪 Sample data includes:"
echo "  • 3 sample projects (Mobile App, E-commerce, Design System template)"
echo "  • Various block types (standard, logic, claude-notion, claude-figma)"
echo "  • Connected blocks with data flow relationships"
echo "  • Activity logs and canvas snapshots"
echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo "  1. Start your development server: npm run dev"
echo "  2. Check the canvas editor with sample data"
echo "  3. Test block creation and connections"
echo "  4. Verify RLS policies are working correctly"
echo ""
echo -e "${YELLOW}🔧 Development commands:${NC}"
echo "  • Reset database: supabase db reset"
echo "  • Apply new migrations: supabase db push"
echo "  • Generate types: supabase gen types typescript --local > src/types/supabase.ts"
echo "  • View logs: supabase logs"