#!/bin/bash
# =====================================================
# Gogram Database Setup Script
# Automates the database initialization process
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    if [ -z "$SUPABASE_PROJECT_URL" ]; then
        print_error "SUPABASE_PROJECT_URL is not set"
        echo "Please set your Supabase project URL:"
        echo "export SUPABASE_PROJECT_URL=https://your-project.supabase.co"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_error "SUPABASE_SERVICE_ROLE_KEY is not set"
        echo "Please set your Supabase service role key:"
        echo "export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
        exit 1
    fi
    
    print_success "Environment variables are set"
}

# Check if psql is available
check_psql() {
    print_status "Checking for psql command..."
    
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found"
        echo "Please install PostgreSQL client tools:"
        echo "  macOS: brew install postgresql"
        echo "  Ubuntu: sudo apt-get install postgresql-client"
        echo "  Windows: Download from https://www.postgresql.org/download/"
        exit 1
    fi
    
    print_success "psql is available"
}

# Extract database connection details from Supabase URL
get_db_connection() {
    # Extract host from URL (remove https:// and any path)
    DB_HOST=$(echo $SUPABASE_PROJECT_URL | sed 's|https://||' | sed 's|/.*||')
    DB_NAME="postgres"
    DB_USER="postgres"
    DB_PORT="5432"
    
    print_status "Database connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_error "Failed to connect to database"
        echo "Please check your Supabase project URL and service role key"
        exit 1
    fi
}

# Run SQL file
run_sql_file() {
    local file_path=$1
    local description=$2
    
    print_status "Running $description..."
    
    if [ ! -f "$file_path" ]; then
        print_error "File not found: $file_path"
        exit 1
    fi
    
    if PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file_path" > /dev/null 2>&1; then
        print_success "$description completed successfully"
    else
        print_error "Failed to run $description"
        echo "Check the SQL file for syntax errors: $file_path"
        exit 1
    fi
}

# Create .env.local file template
create_env_template() {
    local env_file=".env.local"
    
    if [ -f "$env_file" ]; then
        print_warning ".env.local already exists, skipping creation"
        return
    fi
    
    print_status "Creating .env.local template..."
    
    # Extract project reference from URL
    PROJECT_REF=$(echo $SUPABASE_PROJECT_URL | sed 's|https://||' | sed 's|\.supabase\.co.*||')
    
    cat > "$env_file" << EOF
# Gogram Environment Configuration
# Generated on $(date)

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Gogram

# Email Configuration (for procurement notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Optional: Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_POSTHOG_KEY=

# Optional: File Storage
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=attachments
EOF

    print_success ".env.local template created"
    print_warning "Please update the NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
}

# Main setup function
main() {
    echo "=================================================="
    echo "🏗️  Gogram Database Setup"
    echo "=================================================="
    echo ""
    
    # Check prerequisites
    check_env_vars
    check_psql
    get_db_connection
    test_connection
    
    echo ""
    print_status "Starting database setup..."
    echo ""
    
    # Run database schema
    run_sql_file "supabase-schema.sql" "database schema creation"
    
    # Ask user if they want sample data
    echo ""
    read -p "Do you want to install sample data for testing? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_sql_file "seed-data.sql" "sample data insertion"
    else
        print_status "Skipping sample data installation"
    fi
    
    # Create environment file
    echo ""
    create_env_template
    
    echo ""
    echo "=================================================="
    print_success "🎉 Database setup completed successfully!"
    echo "=================================================="
    echo ""
    print_status "Next steps:"
    echo "1. Update your .env.local file with the correct ANON_KEY"
    echo "2. Install dependencies: npm install @supabase/supabase-js"
    echo "3. Start your application: npm run dev"
    echo ""
    print_status "Database features enabled:"
    echo "✅ Complete schema with all tables and relationships"
    echo "✅ Row Level Security (RLS) policies"
    echo "✅ Database triggers and functions"
    echo "✅ Performance indexes"
    echo "✅ Audit logging system"
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Sample data for testing"
    fi
    echo ""
    print_status "Documentation:"
    echo "📖 Schema documentation: database/README.md"
    echo "📊 Database types: database/types.ts"
    echo "🔧 Migration files: database/migrations/"
    echo ""
    print_warning "Remember to secure your service role key and never commit it to version control!"
}

# Script help
show_help() {
    echo "Gogram Database Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Show this help message"
    echo "  --schema-only  Install only the schema (no sample data)"
    echo "  --check        Check prerequisites without installing"
    echo ""
    echo "Environment Variables Required:"
    echo "  SUPABASE_PROJECT_URL       Your Supabase project URL"
    echo "  SUPABASE_SERVICE_ROLE_KEY  Your Supabase service role key"
    echo ""
    echo "Example:"
    echo "  export SUPABASE_PROJECT_URL=https://your-project.supabase.co"
    echo "  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo "  $0"
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --schema-only)
        check_env_vars
        check_psql
        get_db_connection
        test_connection
        run_sql_file "supabase-schema.sql" "database schema creation"
        create_env_template
        print_success "Schema-only setup completed!"
        exit 0
        ;;
    --check)
        check_env_vars
        check_psql
        get_db_connection
        test_connection
        print_success "All prerequisites check passed!"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac 