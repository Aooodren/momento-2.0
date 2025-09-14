#!/bin/bash

# Script de déploiement sécurisé pour l'API Notion
# Usage: ./deploy-secure-notion.sh

set -e

echo "🚀 Déploiement de l'API Notion sécurisée..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Supabase CLI
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI n'est pas installé. Installation requise :"
        echo "npm install -g supabase"
        exit 1
    fi
    
    # Vérifier la connexion Supabase
    if ! supabase status &> /dev/null; then
        log_error "Pas de projet Supabase initialisé. Exécutez 'supabase init' d'abord."
        exit 1
    fi
    
    log_success "Prérequis OK"
}

# Vérifier les variables d'environnement
check_env_vars() {
    log_info "Vérification des variables d'environnement..."
    
    if [ -z "$NOTION_CLIENT_ID" ]; then
        log_warning "NOTION_CLIENT_ID non défini"
        read -p "Entrez votre Notion Client ID: " NOTION_CLIENT_ID
    fi
    
    if [ -z "$NOTION_CLIENT_SECRET" ]; then
        log_warning "NOTION_CLIENT_SECRET non défini"
        read -s -p "Entrez votre Notion Client Secret: " NOTION_CLIENT_SECRET
        echo
    fi
    
    if [ -z "$SITE_URL" ]; then
        log_warning "SITE_URL non défini, utilisation de localhost par défaut"
        SITE_URL="http://localhost:3000"
    fi
    
    log_success "Variables d'environnement configurées"
}

# Déployer les migrations de base de données
deploy_migrations() {
    log_info "Déploiement des migrations de base de données..."
    
    if [ -f "supabase/migrations/20240910_notion_security.sql" ]; then
        supabase db push
        log_success "Migrations appliquées"
    else
        log_warning "Fichier de migration non trouvé"
    fi
}

# Définir les secrets pour les Edge Functions
set_secrets() {
    log_info "Configuration des secrets pour les Edge Functions..."
    
    # Définir les secrets Supabase
    echo "$NOTION_CLIENT_ID" | supabase secrets set NOTION_CLIENT_ID
    echo "$NOTION_CLIENT_SECRET" | supabase secrets set NOTION_CLIENT_SECRET
    echo "$SITE_URL" | supabase secrets set SITE_URL
    
    log_success "Secrets configurés"
}

# Déployer la fonction Edge
deploy_edge_function() {
    log_info "Déploiement de la fonction Edge notion-api..."
    
    if [ -d "src/supabase/functions/notion-api" ]; then
        # Copier la fonction dans le bon répertoire si nécessaire
        if [ ! -d "supabase/functions/notion-api" ]; then
            mkdir -p supabase/functions/notion-api
            cp -r src/supabase/functions/notion-api/* supabase/functions/notion-api/
        fi
        
        supabase functions deploy notion-api
        log_success "Fonction Edge déployée"
    else
        log_error "Répertoire de fonction Edge non trouvé"
        exit 1
    fi
}

# Tester le déploiement
test_deployment() {
    log_info "Test du déploiement..."
    
    # Obtenir l'URL du projet
    PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    
    if [ -n "$PROJECT_URL" ]; then
        TEST_URL="${PROJECT_URL}/functions/v1/notion-api/test"
        
        log_info "Test de l'endpoint: $TEST_URL"
        
        # Test simple avec curl
        if command -v curl &> /dev/null; then
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL")
            
            if [ "$RESPONSE" = "200" ]; then
                log_success "API opérationnelle ✨"
            else
                log_warning "API répond avec le code: $RESPONSE"
            fi
        else
            log_warning "curl non disponible, test manuel requis"
            echo "Testez manuellement: $TEST_URL"
        fi
    else
        log_warning "Impossible de déterminer l'URL du projet"
    fi
}

# Afficher le résumé
show_summary() {
    echo
    echo "📋 Résumé du déploiement :"
    echo "=========================="
    echo
    echo "🔧 Fonction Edge: notion-api"
    echo "🗄️  Migrations: appliquées"
    echo "🔑 Secrets: configurés"
    echo "🌐 Site URL: $SITE_URL"
    echo
    echo "📝 Prochaines étapes :"
    echo "1. Mettre à jour le frontend pour utiliser secureNotionService"
    echo "2. Tester l'authentification OAuth complète"
    echo "3. Vérifier les logs dans Supabase Dashboard"
    echo
    echo "📍 URLs importantes :"
    PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    echo "• API Test: ${PROJECT_URL}/functions/v1/notion-api/test"
    echo "• Dashboard: https://app.supabase.com/project/$(supabase status | grep "Project ID" | awk '{print $3}')"
    echo
}

# Fonction principale
main() {
    echo "🔒 Déploiement de l'API Notion Sécurisée"
    echo "========================================"
    echo
    
    check_prerequisites
    check_env_vars
    deploy_migrations
    set_secrets
    deploy_edge_function
    test_deployment
    show_summary
    
    log_success "Déploiement terminé avec succès ! 🎉"
}

# Gestion des erreurs
handle_error() {
    log_error "Erreur lors du déploiement à l'étape: $1"
    echo
    echo "🔍 Débogage :"
    echo "1. Vérifiez les logs Supabase: supabase functions logs notion-api"
    echo "2. Vérifiez les variables d'environnement"
    echo "3. Consultez SECURE_MIGRATION_GUIDE.md"
    exit 1
}

# Trap les erreurs
trap 'handle_error $LINENO' ERR

# Exécuter le script principal
main

# Fin du script