#!/bin/sh
set -e

# ============================================
# Asterisk Entrypoint
# ============================================
# Configures AMI manager.conf from environment
# variables and starts Asterisk in foreground.
# ============================================

# Configure AMI manager from environment variables
AMI_USER="${AMI_USER:-admin}"
AMI_SECRET="${AMI_SECRET:-admin}"
AMI_PERMIT="${AMI_PERMIT:-0.0.0.0/0.0.0.0}"

cat > /etc/asterisk/manager.conf <<EOF
; ============================================
; AMI Manager Configuration (auto-generated)
; Sistema de Monitoreo VoIP
; ============================================

[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[${AMI_USER}]
secret = ${AMI_SECRET}
read = all
write = all
deny = 0.0.0.0/0.0.0.0
permit = ${AMI_PERMIT}
EOF

echo "AMI configured: user=${AMI_USER}, permit=${AMI_PERMIT}"

# Ensure monitoreo config files exist (created dynamically by backend)
# These are included via #include in sip.conf and extensions.conf
touch /etc/asterisk/sip.monitoreo.conf
touch /etc/asterisk/extensions.monitoreo.conf

# Fix permissions for asterisk user
chown -R asterisk:asterisk /var/run/asterisk /var/log/asterisk /var/spool/asterisk /etc/asterisk 2>/dev/null || true

# Start Asterisk in foreground
exec asterisk -f "$@"
