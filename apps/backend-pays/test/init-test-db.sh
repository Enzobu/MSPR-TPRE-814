#!/bin/bash
# Applique les migrations Prisma committées à la DB de test, dans l'ordre
# chronologique (le nom de dossier est horodaté). Exécuté par l'entrypoint
# MariaDB au premier boot (/docker-entrypoint-initdb.d). Évite de dépendre de
# `prisma migrate` au moment des tests (pas de shadow DB ni de datasource url).
set -e

find /migrations -name migration.sql | sort | while read -r sql; do
  echo "[init-test-db] applying ${sql}"
  mariadb --user=root --password="${MARIADB_ROOT_PASSWORD}" "${MARIADB_DATABASE}" <"${sql}"
done
