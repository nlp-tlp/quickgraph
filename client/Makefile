.PHONY: install build

VITE_API_BASE_URL_DEV ?= http://localhost:8000
VITE_API_BASE_URL_STAGING ?= https://api.staging.quickgraph.tech/v1
VITE_API_BASE_URL_PROD ?= https://api.quickgraph.tech/v1

VITE_DOC_BASE_URL_DEV ?= http://localhost:5000
VITE_DOC_BASE_URL_STAGING ?= https://docs.staging.quickgraph.tech
VITE_DOC_BASE_URL_PROD ?= https://docs.quickgraph.tech

install:
	yarn install

build-script-dev:
	export VITE_API_BASE_URL=$(VITE_API_BASE_URL_DEV) VITE_DOC_BASE_URL=$(VITE_DOC_BASE_URL_DEV) && yarn build

build-script-staging:
	export VITE_API_BASE_URL=$(VITE_API_BASE_URL_STAGING) VITE_DOC_BASE_URL=$(VITE_DOC_BASE_URL_STAGING) && yarn build

build-script-prod:
	export VITE_API_BASE_URL=$(VITE_API_BASE_URL_PROD) VITE_DOC_BASE_URL=$(VITE_DOC_BASE_URL_PROD) && yarn build

start-script:
	export VITE_API_BASE_URL=$(VITE_API_BASE_URL) && yarn start

# DOCKER

build-dev:
	docker build -t client:dev -f ./Dockerfile.dev .

# build-local:
# 	docker build \
# 		-t client:local \
# 		--build-arg CADDYFILE=Caddyfile.local \
# 		--build-arg BASE_API_URL=$(VITE_API_BASE_URL_DEV) \
# 		-f ./Dockerfile.prod .

# build-staging:
# 	docker build \
# 		-t client:staging \
# 		--build-arg CADDYFILE=Caddyfile.staging \
# 		--build-arg BASE_API_URL=$(VITE_API_BASE_URL_STAGING) \
# 		-f ./Dockerfile.prod .

# build-stage-local:
# 	docker build -t qg-client-staging-local:1.0.0 -f ./Dockerfile.stage.local .
