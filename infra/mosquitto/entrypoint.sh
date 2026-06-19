#!/bin/sh
# Génère le password_file (hashé) et l'acl_file scopé au pays, puis démarre Mosquitto.
# Users de DEV régénérés à chaque démarrage à partir des variables d'environnement.
# En prod : remplacer par des secrets gérés hors-image + TLS (hors scope, #50).
set -eu

CONFIG_DIR=/mosquitto/config
PASSWORD_FILE="$CONFIG_DIR/passwordfile"
ACL_FILE="$CONFIG_DIR/aclfile"

COUNTRY_CODE="${COUNTRY_CODE:-BR}"
IOT_USER="${MOSQUITTO_IOT_USERNAME:-iot}"
BACKEND_USER="${MOSQUITTO_BACKEND_USERNAME:-backend-pays}"

: "${MOSQUITTO_IOT_PASSWORD:?MOSQUITTO_IOT_PASSWORD is required}"
: "${MOSQUITTO_BACKEND_PASSWORD:?MOSQUITTO_BACKEND_PASSWORD is required}"

# password_file (hashé). -c (re)crée le fichier avec le premier user.
mosquitto_passwd -c -b "$PASSWORD_FILE" "$IOT_USER" "$MOSQUITTO_IOT_PASSWORD"
mosquitto_passwd -b "$PASSWORD_FILE" "$BACKEND_USER" "$MOSQUITTO_BACKEND_PASSWORD"
chmod 0600 "$PASSWORD_FILE"

# ACL : scoping par topic pays (ADR-0003). Le capteur publie, le backend consomme.
cat > "$ACL_FILE" <<EOF
# IoT : publie les mesures et le statut des entrepôts de son pays
user $IOT_USER
topic write futurekawa/$COUNTRY_CODE/warehouse/+/measurement
topic write futurekawa/$COUNTRY_CODE/warehouse/+/status

# backend-pays : consomme les mesures et le statut de son pays
user $BACKEND_USER
topic read futurekawa/$COUNTRY_CODE/warehouse/+/measurement
topic read futurekawa/$COUNTRY_CODE/warehouse/+/status
EOF
chmod 0600 "$ACL_FILE"

# Mosquitto démarre en root puis abandonne ses privilèges vers l'utilisateur
# `mosquitto` : lui donner accès aux fichiers générés et au volume de persistance
# (on bypasse l'entrypoint par défaut de l'image qui s'en chargeait).
chown mosquitto:mosquitto "$PASSWORD_FILE" "$ACL_FILE"
chown -R mosquitto:mosquitto /mosquitto/data

exec mosquitto -c "$CONFIG_DIR/mosquitto.conf"
