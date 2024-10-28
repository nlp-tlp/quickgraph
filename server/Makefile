# Makefile for packaging FastAPI project for AWS Lambda

PROJECT_NAME := quickgraph_lambda
PACKAGE_DIR := package
STAGING_ZIP_FILE := $(PROJECT_NAME)_staging.zip
PRODUCTION_ZIP_FILE := $(PROJECT_NAME)_production.zip

.PHONY: clean_staging clean_production package_staging package_production


clean_staging:
	@echo "Cleaning up old staging package directory and zip file..."
	rm -rf $(PACKAGE_DIR)_staging $(STAGING_ZIP_FILE)

clean_production:
	@echo "Cleaning up old production package directory and zip file..."
	rm -rf $(PACKAGE_DIR)_production $(PRODUCTION_ZIP_FILE)

prepare_staging:
	@echo "Creating staging package directory..."
	mkdir -p $(PACKAGE_DIR)_staging

prepare_production:
	@echo "Creating production package directory..."
	mkdir -p $(PACKAGE_DIR)_production

dependencies_staging:
	@echo "Installing staging dependencies..."
	pip install -r requirements.txt -t $(PACKAGE_DIR)_staging

dependencies_production:
	@echo "Installing production dependencies..."
	pip install -r requirements.txt -t $(PACKAGE_DIR)_production

package_staging: clean_staging prepare_staging dependencies_staging
	@echo "Packaging FastAPI project for AWS Lambda (Staging)..."
	rsync -a --exclude=$(PACKAGE_DIR)_staging --exclude=$(PROJECT_NAME)_staging.zip --exclude=$(PROJECT_NAME)_production.zip --exclude=$(PACKAGE_DIR)_production --exclude=venv --exclude=__pycache__ --exclude=.pytest_cache ./ $(PACKAGE_DIR)_staging/
	cd $(PACKAGE_DIR)_staging && zip -r9 ../$(STAGING_ZIP_FILE) .

package_production: clean_production prepare_production dependencies_production
	@echo "Packaging FastAPI project for AWS Lambda (Production)..."
	rsync -a --exclude=$(PACKAGE_DIR)_staging --exclude=$(PROJECT_NAME)_staging.zip --exclude=$(PROJECT_NAME)_production.zip --exclude=$(PACKAGE_DIR)_production --exclude=venv --exclude=__pycache__ --exclude=.pytest_cache ./ $(PACKAGE_DIR)_production/
	cp .env.prod $(PACKAGE_DIR)_production/.env
	cd $(PACKAGE_DIR)_production && zip -r9 ../$(PRODUCTION_ZIP_FILE) .

# dependencies:
# 	@echo "Installing dependencies..."
# 	pip install -r requirements.txt -t $(PACKAGE_DIR)

# package: clean prepare dependencies
# 	@echo "Packaging FastAPI project for AWS Lambda..."
# 	rsync -a --exclude=$(PACKAGE_DIR) --exclude=venv --exclude=__pycache__ --exclude=.pytest_cache ./ $(PACKAGE_DIR)/
# 	cd $(PACKAGE_DIR) && zip -r9 ../$(ZIP_FILE) .


# DOCKER
build-dev:
	ENV=development docker build -t server -f ./Dockerfile .

build-local:
	ENV=local docker build -t server:local -f ./Dockerfile .

build-staging:
	ENV=staging docker build -t server:staging -f ./Dockerfile .