#!/bin/bash

# Скрипт для развертывания auth-service в Kubernetes

set -e

echo "🚀 Начинаем развертывание auth-service..."

# Создаём namespace
echo "📦 Создаём namespace..."
kubectl apply -f k8s/namespace.yaml

# Применяем конфигурацию
echo "⚙️ Применяем ConfigMap и Secret..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Создаём ConfigMap для инициализации PostgreSQL
echo "🗄️ Создаём ConfigMap для PostgreSQL..."
kubectl create configmap postgres-init-config --from-file=backend/init.sql -n auth-service --dry-run=client -o yaml | kubectl apply -f -

# Развёртываем базу данных
echo "🐘 Развёртываем PostgreSQL..."
kubectl apply -f k8s/postgres-deployment.yaml

# Развёртываем Redis
echo "🔴 Развёртываем Redis..."
kubectl apply -f k8s/redis-deployment.yaml

# Ждём готовности базы данных
echo "⏳ Ждём готовности PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n auth-service --timeout=300s

# Собираем и загружаем образы
echo "🐳 Собираем Docker образы..."

# Backend
echo "🔧 Собираем backend образ..."
docker build -t auth-backend:latest ./backend

# Frontend
echo "🎨 Собираем frontend образ..."
docker build -t auth-frontend:latest ./frontend

# Развёртываем backend
echo "⚙️ Развёртываем backend..."
kubectl apply -f k8s/backend-deployment.yaml

# Ждём готовности backend
echo "⏳ Ждём готовности backend..."
kubectl wait --for=condition=ready pod -l app=backend -n auth-service --timeout=300s

# Развёртываем frontend
echo "🌐 Развёртываем frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

# Применяем Ingress
echo "🌍 Настраиваем Ingress..."
kubectl apply -f k8s/ingress.yaml

echo "✅ Развёртывание завершено!"
echo ""
echo "📊 Статус развертывания:"
kubectl get pods -n auth-service
echo ""
echo "🌐 Доступ к приложению:"
echo "Frontend: http://auth-service.local"
echo "API Docs: http://auth-service.local/api-docs"
echo ""
echo "🔍 Логи:"
echo "kubectl logs -f deployment/backend-deployment -n auth-service"
echo "kubectl logs -f deployment/frontend-deployment -n auth-service" 