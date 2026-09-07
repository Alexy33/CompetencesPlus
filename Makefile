# Raccourcis pour l'equipe. `make` seul affiche l'aide.
.DEFAULT_GOAL := help
.PHONY: help dev prod build stop clean logs shell migrate seed openapi test backup video \
        video-migrate video-local video-degraded video-etat

help: ## Affiche cette aide
	@grep -E '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Lance l'environnement de developpement (hot reload)
	docker compose --profile dev up

prod: ## Lance l'image de production
	docker compose --profile prod up --build -d

build: ## Reconstruit l'image de production sans la lancer
	docker compose --profile prod build

stop: ## Arrete tout en gardant la base
	docker compose --profile dev --profile prod down

clean: ## Arrete tout ET supprime la base (irreversible)
	docker compose --profile dev --profile prod down -v

logs: ## Suit les logs
	docker compose --profile dev --profile prod logs -f

shell: ## Ouvre un shell dans le conteneur de dev
	docker compose --profile dev exec web-dev sh

migrate: ## Genere une migration Drizzle depuis le schema
	docker compose --profile dev exec web-dev npx drizzle-kit generate

seed: ## Remplit la base avec le jeu de demonstration (destructif)
	docker compose --profile dev exec web-dev npm run db:seed

video-migrate: ## Range les videos existantes dans le stockage du fournisseur (rejouable)
	docker compose --profile dev exec web-dev npm run video:migrate

video-local: ## Bascule sur l'hebergement local du dispositif (etat nominal)
	@VIDEO_PROVIDER=local docker compose --profile dev up -d --force-recreate web-dev
	@$(MAKE) --no-print-directory video-etat

video-degraded: ## Bascule sur l'hebergeur ministeriel factice (indisponible)
	@VIDEO_PROVIDER=peertube VIDEO_PEERTUBE_URL=https://video.exemple.gouv.fr \
		docker compose --profile dev up -d --force-recreate web-dev
	@$(MAKE) --no-print-directory video-etat

video-etat: ## Dit quel hebergeur est actif, quoi ouvrir, et ce qu'on doit y voir
	@printf 'Demarrage de l application'; \
	for i in $$(seq 1 60); do \
		curl -sf -o /dev/null http://localhost:$${PORT:-3000}/api/health && break; \
		printf '.'; sleep 2; \
	done; echo; \
	provider=$$(docker compose --profile dev exec -T web-dev sh -c 'printf %s "$$VIDEO_PROVIDER"'); \
	fiche=$$(docker compose --profile dev exec -T web-dev node -e \
		"const D=require('better-sqlite3');const d=new D(process.env.DATABASE_URL.replace(/^file:/,''),{readonly:true});\
		 const r=d.prepare(\"select id from profile where video_id is not null and status='published' and video_status='approved' limit 1\").get();\
		 process.stdout.write(r?r.id:'')" 2>/dev/null); \
	echo; \
	echo "  Hebergeur actif : $$provider"; \
	if [ -z "$$fiche" ]; then \
		echo; \
		echo "  Aucune fiche publiee ne porte de video VALIDEE : la bascule ne se verra pas."; \
		echo "  Deposez une video depuis /candidate, puis validez-la depuis /admin (onglet Videos)."; \
	else \
		echo "  A ouvrir       : http://localhost:$${PORT:-3000}/profils/$$fiche"; \
		echo; \
		if [ "$$provider" = "local" ]; then \
			echo "  Attendu : la fiche s affiche AVEC son lecteur video."; \
		else \
			echo "  Attendu : la fiche s affiche INTACTE, le lecteur remplace par"; \
			echo "            « La video est temporairement indisponible. »"; \
			echo "            Pas de page blanche, pas d erreur 500."; \
			echo "            Un depot de video repond 503 : l instance n existe pas encore."; \
		fi; \
		echo; \
		echo "  Repasser dans l autre etat :  make video-$$([ "$$provider" = "local" ] && echo degraded || echo local)"; \
	fi

openapi: ## Exporte la specification dans ./openapi.json
	docker compose --profile dev exec web-dev npm run openapi:export

test: ## Joue les tests unitaires puis les tests d'API
	npm test
	E2E_BASE_URL=http://localhost:3000 npx playwright test

backup: ## Sauvegarde la base dans ./backups/
	@mkdir -p backups
	docker run --rm -v profilsactifs_db-data-prod:/data -v $$(pwd)/backups:/backup \
		alpine sh -c "apk add --no-cache sqlite >/dev/null && \
		sqlite3 /data/profilsactifs.db \".backup /backup/profilsactifs-$$(date +%Y%m%d-%H%M%S).db\""
	@echo "Sauvegarde ecrite dans ./backups/"

video: ## Tourne la video de presentation (serveur deja lance) + sous-titres
	npx playwright test --config=scripts/demo/playwright.tournage.ts
	ffmpeg -y -i docs/captures/video/presentation-brut.webm \
	  -vf "subtitles=docs/captures/video/sous-titres.srt:force_style='FontName=DejaVu Sans,FontSize=11,Bold=1,PrimaryColour=&HFFFFFF&,BackColour=&HB0201A14&,BorderStyle=4,Outline=0,Shadow=0,MarginV=22,MarginL=90,MarginR=90,Alignment=2'" \
	  -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart \
	  docs/captures/video/presentation.mp4
