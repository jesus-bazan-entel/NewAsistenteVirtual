#!/bin/sh
set -e

# Ensure monitoreo config files exist (created dynamically by backend)
# These are included via #include in sip.conf and extensions.conf
touch /etc/asterisk/sip.monitoreo.conf
touch /etc/asterisk/extensions.monitoreo.conf

exec asterisk -f "$@"
